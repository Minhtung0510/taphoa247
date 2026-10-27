<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccountStock;
use App\Models\Order;
use App\Models\Product;
use App\Models\WarrantyClaim;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    /**
     * Dashboard tổng quan
     */
    public function dashboard(): JsonResponse
    {
        $totalRevenue = Order::whereIn('status', ['paid', 'completed'])->sum('total_amount');
        $totalOrders = Order::count();
        $completedOrders = Order::whereIn('status', ['paid', 'completed'])->count();
        $totalStock = AccountStock::where('status', 'available')->count();
        $pendingClaims = WarrantyClaim::whereIn('state', ['pending', 'waiting_admin', 'waiting_stock'])->count();

        $recentOrders = Order::with('items.product')->latest()->limit(10)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_revenue' => $totalRevenue,
                'total_orders' => $totalOrders,
                'completed_orders' => $completedOrders,
                'total_stock' => $totalStock,
                'pending_claims' => $pendingClaims,
                'recent_orders' => $recentOrders,
            ],
        ]);
    }

    /**
     * Danh sách sản phẩm và giá
     */
    public function products(): JsonResponse
    {
        $products = Product::with('category')
            ->withCount(['stocks as available_stock' => function ($q) {
                $q->where('status', 'available');
            }])
            ->orderBy('category_id')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['success' => true, 'data' => $products]);
    }

    /**
     * Cập nhật giá sản phẩm
     */
    public function updatePrice(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'price' => 'required|integer|min:1000',
        ]);

        $product = Product::findOrFail($id);
        $product->update(['price' => $validated['price']]);

        return response()->json([
            'success' => true,
            'message' => "Đã cập nhật giá cho {$product->name} thành " . number_format($product->price) . " VNĐ",
            'data' => $product,
        ]);
    }

    /**
     * Nạp kho tài khoản (hỗ trợ nhập text hoặc tải file TXT)
     */
    public function importStock(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'raw_text' => 'nullable|string',
            'file' => 'nullable|file|mimes:txt',
        ]);

        $product = Product::findOrFail($request->product_id);

        $content = '';
        if ($request->hasFile('file')) {
            $content = file_get_contents($request->file('file')->getRealPath());
        } elseif ($request->filled('raw_text')) {
            $content = $request->raw_text;
        } else {
            return response()->json(['success' => false, 'message' => 'Vui lòng nhập nội dung text hoặc tải lên file TXT'], 422);
        }

        $rawAccs = $this->splitRawAccounts($content);
        if (empty($rawAccs)) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy tài khoản hợp lệ trong nội dung'], 422);
        }

        $imported = 0;
        $duplicates = 0;

        foreach ($rawAccs as $raw) {
            $clean = trim($raw);
            if (empty($clean)) continue;

            $hash = hash('sha256', $clean);
            if (AccountStock::where('credentials_hash', $hash)->exists()) {
                $duplicates++;
                continue;
            }

            AccountStock::create([
                'product_id' => $product->id,
                'account_type' => $product->account_type,
                'credentials' => $clean,
                'credentials_hash' => $hash,
                'status' => 'available',
            ]);
            $imported++;
        }

        // Tự động kích hoạt giao các đơn đang chờ kho
        $fulfilledWaiting = $this->orderService->fulfillWaitingStockOrders();

        return response()->json([
            'success' => true,
            'message' => "Đã nạp thành công {$imported} tài khoản vào kho ({$duplicates} acc bị trùng lặp bỏ qua). Tự động giao {$fulfilledWaiting} đơn đang chờ hàng.",
            'data' => [
                'imported_count' => $imported,
                'duplicates_count' => $duplicates,
                'fulfilled_waiting' => $fulfilledWaiting,
            ],
        ]);
    }

    /**
     * Danh sách đơn hàng
     */
    public function orders(Request $request): JsonResponse
    {
        $query = Order::with('items.product')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('order_code', 'like', "%{$s}%")
                  ->orWhere('customer_name', 'like', "%{$s}%")
                  ->orWhere('customer_email', 'like', "%{$s}%")
                  ->orWhere('memo', 'like', "%{$s}%");
            });
        }

        $orders = $query->paginate(20);

        return response()->json(['success' => true, 'data' => $orders]);
    }

    /**
     * Admin duyệt/khớp đơn thanh toán thủ công
     */
    public function forceCompleteOrder(string $orderCode): JsonResponse
    {
        $order = Order::where('order_code', $orderCode)->firstOrFail();
        if ($order->isPaid()) {
            return response()->json(['success' => false, 'message' => 'Đơn hàng này đã thanh toán trước đó.'], 422);
        }

        $tx = [
            'transactionID' => 'MANUAL-ADMIN-' . time(),
            'creditAmount' => $order->total_amount,
            'description' => $order->memo,
            'transactionDate' => now()->toDateTimeString(),
        ];

        $this->orderService->fulfillOrder($order, $tx);

        return response()->json([
            'success' => true,
            'message' => "Đã duyệt thanh toán thành công cho đơn {$order->order_code}.",
            'data' => $order->fresh(['items']),
        ]);
    }

    /**
     * Danh sách yêu cầu bảo hành
     */
    public function warrantyClaims(Request $request): JsonResponse
    {
        $query = WarrantyClaim::with(['order', 'claimItems.orderItem.product'])->latest();

        if ($request->filled('state')) {
            $query->where('state', $request->state);
        }

        $claims = $query->paginate(15);

        return response()->json(['success' => true, 'data' => $claims]);
    }

    /**
     * Duyệt yêu cầu bảo hành và bù acc thủ công
     */
    public function approveClaim(Request $request, int $claimId): JsonResponse
    {
        $request->validate([
            'replacements' => 'required|array', // Mảng tài khoản bù tương ứng
            'admin_note' => 'nullable|string|max:1000',
        ]);

        $claim = WarrantyClaim::findOrFail($claimId);
        if (in_array($claim->state, ['approved', 'rejected'])) {
            return response()->json(['success' => false, 'message' => 'Yêu cầu này đã được xử lý trước đó.'], 422);
        }

        DB::transaction(function () use ($claim, $request) {
            foreach ($claim->claimItems as $idx => $claimItem) {
                $rawReplacement = $request->replacements[$idx] ?? null;
                if (!empty($rawReplacement)) {
                    $stock = AccountStock::create([
                        'product_id' => $claimItem->orderItem->product_id,
                        'account_type' => $claimItem->orderItem->product->account_type,
                        'credentials' => trim($rawReplacement),
                        'status' => 'replaced',
                        'order_id' => $claim->order_id,
                        'sold_at' => now(),
                    ]);

                    $claimItem->update(['replacement_stock_id' => $stock->id]);
                    $claimItem->orderItem->increment('replacement_count');
                }
            }

            $claim->update([
                'state' => 'approved',
                'admin_note' => $request->admin_note,
                'resolved_by' => $request->user()?->id,
                'resolved_at' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Đã duyệt yêu cầu bảo hành và cấp acc bù thành công.',
        ]);
    }

    /**
     * Từ chối bảo hành
     */
    public function rejectClaim(Request $request, int $claimId): JsonResponse
    {
        $request->validate([
            'admin_note' => 'required|string|max:1000',
        ]);

        $claim = WarrantyClaim::findOrFail($claimId);
        $claim->update([
            'state' => 'rejected',
            'admin_note' => $request->admin_note,
            'resolved_by' => $request->user()?->id,
            'resolved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã từ chối yêu cầu bảo hành.',
        ]);
    }

    protected function splitRawAccounts(string $text): array
    {
        $text = trim($text);
        if (empty($text)) return [];

        if (str_contains($text, '---------------------------') || preg_match('/-{10,}/', $text) || str_contains($text, 'Username:')) {
            $blocks = preg_split('/-{10,}/', $text);
            $result = [];
            foreach ($blocks as $b) {
                $clean = trim($b);
                if (!empty($clean) && (str_contains($clean, 'Username:') || str_contains($clean, ':'))) {
                    $result[] = $clean;
                }
            }
            return $result;
        }

        return array_values(array_filter(array_map('trim', explode("\n", $text))));
    }
}
