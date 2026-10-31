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
     * Xác thực quyền truy cập đơn hàng & bảo hành (Chống IDOR)
     */
    protected function verifyOrderAccess(Order $order, Request $request): bool
    {
        $user = $request->user('sanctum') ?? auth('sanctum')->user();

        // 1. Quản trị viên luôn có quyền
        if ($user && $user->isAdmin()) {
            return true;
        }

        // 2. Người dùng đã đăng nhập là chủ sở hữu đơn hàng
        if ($user && $order->user_id && (int) $order->user_id === (int) $user->id) {
            return true;
        }

        // 3. Khớp Access Token bảo mật của đơn hàng (qua Header X-Order-Token hoặc query param ?token=)
        $providedToken = $request->header('X-Order-Token') ?: $request->query('token');
        if (!empty($order->access_token) && !empty($providedToken) && hash_equals((string) $order->access_token, (string) $providedToken)) {
            return true;
        }

        // 4. Nếu khớp email: BẮT BUỘC tài khoản đã xác minh email thực tế
        if (
            $user &&
            $user->hasVerifiedEmail() &&
            !empty($order->customer_email) &&
            hash_equals(strtolower((string) $order->customer_email), strtolower((string) $user->email))
        ) {
            return true;
        }

        return false;
    }

    /**
     * Kiểm tra các tài khoản đủ điều kiện bảo hành trong đơn
     */
    public function eligibility(Request $request, string $orderCode): JsonResponse
    {
        $order = Order::where('order_code', $orderCode)->with('items.product')->firstOrFail();

        if (!$this->verifyOrderAccess($order, $request)) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập thông tin bảo hành của đơn hàng này.',
            ], 403);
        }

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
        // Tự động chuẩn hoá nếu gửi selected_items thay vì items
        if (!$request->has('items') && $request->has('selected_items')) {
            $selected = (array) $request->input('selected_items', []);
            $reasons = (array) $request->input('reasons', []);
            $built = [];
            foreach ($selected as $id) {
                $built[] = [
                    'order_item_id' => (int) $id,
                    'error_description' => $reasons[$id] ?? $request->input('customer_note', 'Tài khoản bị lỗi / sai mật khẩu'),
                ];
            }
            $request->merge(['items' => json_encode($built)]);
        }

        // Nếu items được gửi dạng array trực tiếp
        if (is_array($request->items)) {
            $request->merge(['items' => json_encode($request->items)]);
        }

        $request->validate([
            'order_code' => 'required|exists:orders,order_code',
            'items' => 'required|string',
            'files' => 'nullable|array|max:10',
            'files.*' => 'nullable|file|mimes:jpeg,jpg,png,webp,mp4,webm,mov|max:26214400', // 25MB max
            'buyer_note' => 'nullable|string|max:1000',
        ], [
            'items.required' => 'Vui lòng chọn ít nhất 1 tài khoản cần bảo hành.',
            'order_code.required' => 'Mã đơn hàng không được để trống.',
            'order_code.exists' => 'Không tìm thấy đơn hàng tương ứng trong hệ thống.',
            'files.*.mimes' => 'Tệp đính kèm phải là ảnh (JPG, PNG, WEBP) hoặc video (MP4, WEBM, MOV).',
        ]);

        $order = Order::where('order_code', $request->order_code)->firstOrFail();

        if (!$this->verifyOrderAccess($order, $request)) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền gửi yêu cầu bảo hành cho đơn hàng này.',
            ], 403);
        }

        $itemsData = is_string($request->items) ? json_decode($request->items, true) : $request->items;
        $itemsData = is_array($itemsData) ? $itemsData : [];
        $files = $request->file('files') ?: [];

        if (empty($itemsData)) {
            return response()->json([
                'success' => false,
                'message' => 'Danh sách tài khoản cần bảo hành không hợp lệ.',
            ], 422);
        }

        try {
            $buyerNote = $request->input('buyer_note') ?: $request->input('customer_note');
            $claim = $this->warrantyService->submitClaim($order, $itemsData, $files, $buyerNote);

            return response()->json([
                'success' => true,
                'message' => 'Yêu cầu bảo hành đã được gửi tới Quản trị viên thành công. Shop sẽ kiểm tra và cấp bù tài khoản mới cho bạn.',
                'data' => [
                    'claim_code' => $claim->claim_code,
                    'state' => $claim->state,
                    'attempt' => $claim->attempt,
                    'created_at' => $claim->created_at->toIso8601String(),
                ],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('[Warranty Exception] ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => app()->environment('production')
                    ? 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu bảo hành. Vui lòng thử lại sau.'
                    : $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tra cứu trạng thái yêu cầu bảo hành
     */
    public function claimStatus(Request $request, string $claimCode): JsonResponse
    {
        $claim = WarrantyClaim::where('claim_code', $claimCode)
            ->with(['order', 'claimItems.replacementStock', 'claimItems.orderItem.product'])
            ->firstOrFail();

        if ($claim->order && !$this->verifyOrderAccess($claim->order, $request)) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền tra cứu yêu cầu bảo hành này.',
            ], 403);
        }

        $replacements = [];
        if ($claim->state === 'approved') {
            foreach ($claim->claimItems as $ci) {
                if ($ci->replacementStock && $ci->orderItem) {
                    $replacements[] = [
                        'order_item_position' => $ci->orderItem->position,
                        'product_name' => $ci->orderItem->product?->name ?? 'Tài khoản Game',
                        'new_credentials' => $ci->replacementStock->credentials,
                    ];
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'claim_code' => $claim->claim_code,
                'order_code' => $claim->order?->order_code,
                'state' => $claim->state,
                'attempt' => $claim->attempt,
                'admin_note' => $claim->admin_note,
                'resolved_at' => $claim->resolved_at?->toIso8601String(),
                'replacements' => $replacements,
            ],
        ]);
    }

    /**
     * Tải/xem file bằng chứng minh chứng lỗi
     */
    public function viewEvidence(Request $request, int $id): BinaryFileResponse
    {
        $claimItem = ClaimItem::with('claim.order')->findOrFail($id);

        $path = $claimItem->evidence_path;

        if (empty($path) || $path === 'no_file' || !Storage::exists($path)) {
            abort(404, 'Không tìm thấy file ảnh bằng chứng hoặc file đã bị xóa.');
        }

        $mime = $claimItem->evidence_mime ?: Storage::mimeType($path) ?: 'image/jpeg';

        return response()->file(Storage::path($path), [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
