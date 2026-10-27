<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClaimItem;
use App\Models\Order;
use App\Models\WarrantyClaim;
use App\Services\WarrantyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class WarrantyController extends Controller
{
    public function __construct(
        protected WarrantyService $warrantyService
    ) {}

    /**
     * Kiểm tra các tài khoản đủ điều kiện bảo hành trong đơn
     */
    public function eligibility(string $orderCode): JsonResponse
    {
        $order = Order::where('order_code', $orderCode)->with('items.product')->firstOrFail();

        if (!$order->isPaid()) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng chưa thanh toán thành công.',
            ], 403);
        }

        $eligible = $this->warrantyService->getEligibleItems($order);

        return response()->json([
            'success' => true,
            'data' => [
                'order_code' => $order->order_code,
                'customer_name' => $order->customer_name,
                'eligible_items' => $eligible,
            ],
        ]);
    }

    /**
     * Gửi yêu cầu bảo hành tài khoản
     */
    public function claim(Request $request): JsonResponse
    {
        $request->validate([
            'order_code' => 'required|exists:orders,order_code',
            'items' => 'required|json', // JSON array of { order_item_id, error_description }
            'files' => 'required|array|min:1|max:10',
            'files.*' => 'required|file|max:26214400', // 25MB max
            'buyer_note' => 'nullable|string|max:1000',
        ]);

        $order = Order::where('order_code', $request->order_code)->firstOrFail();
        $itemsData = json_decode($request->items, true) ?: [];
        $files = $request->file('files') ?: [];

        if (count($itemsData) !== count($files)) {
            return response()->json([
                'success' => false,
                'message' => 'Số lượng bằng chứng (ảnh/video) phải tương ứng đúng 1:1 với số tài khoản yêu cầu bảo hành.',
            ], 422);
        }

        try {
            $claim = $this->warrantyService->submitClaim($order, $itemsData, $files, $request->buyer_note);

            return response()->json([
                'success' => true,
                'message' => 'Yêu cầu bảo hành đã được tiếp nhận thành công.',
                'data' => [
                    'claim_code' => $claim->claim_code,
                    'state' => $claim->state,
                    'attempt' => $claim->attempt,
                    'created_at' => $claim->created_at->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Tra cứu trạng thái yêu cầu bảo hành
     */
    public function claimStatus(string $claimCode): JsonResponse
    {
        $claim = WarrantyClaim::where('claim_code', $claimCode)
            ->with(['order', 'claimItems.replacementStock', 'claimItems.orderItem.product'])
            ->firstOrFail();

        $replacements = [];
        if ($claim->state === 'approved') {
            foreach ($claim->claimItems as $ci) {
                if ($ci->replacementStock) {
                    $replacements[] = [
                        'order_item_position' => $ci->orderItem->position,
                        'product_name' => $ci->orderItem->product->name,
                        'new_credentials' => $ci->replacementStock->credentials,
                    ];
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'claim_code' => $claim->claim_code,
                'order_code' => $claim->order->order_code,
                'state' => $claim->state,
                'attempt' => $claim->attempt,
                'admin_note' => $claim->admin_note,
                'resolved_at' => $claim->resolved_at?->toIso8601String(),
                'replacements' => $replacements,
            ],
        ]);
    }

    /**
     * Tải/xem file bằng chứng an toàn (yêu cầu chữ ký hoặc Admin)
     */
    public function viewEvidence(int $claimItemId): BinaryFileResponse
    {
        $claimItem = ClaimItem::findOrFail($claimItemId);
        $path = $claimItem->evidence_path;

        if (!Storage::exists($path)) {
            abort(404, 'Không tìm thấy file bằng chứng.');
        }

        return response()->file(Storage::path($path), [
            'Content-Type' => $claimItem->evidence_mime,
            'Content-Disposition' => 'inline',
        ]);
    }
}
