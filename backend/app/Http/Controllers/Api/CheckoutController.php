<?php

namespace App\Http\Controllers\Api;

use App\Contracts\PaymentGatewayInterface;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\CheckoutService;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    public function __construct(
        protected CheckoutService $checkoutService,
        protected OrderService $orderService,
        protected PaymentGatewayInterface $paymentGateway
    ) {}

    /**
     * Tạo đơn hàng mới & giữ chỗ kho an toàn
     */
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1|max:50',
            'customer_name' => 'nullable|string|max:100',
            'customer_email' => 'nullable|email|max:150',
            'customer_phone' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\s\-]{8,20}$/'],
            'coupon_code' => 'nullable|string|max:64',
            'option_id' => 'nullable|string|max:50',
        ], [
            'customer_phone.regex' => 'Số điện thoại không đúng định dạng.',
            'quantity.max' => 'Số lượng tối đa mỗi đơn hàng là 50 tài khoản.',
        ]);

        $authUser = $request->user('sanctum') ?? auth('sanctum')->user();
        if (!$authUser) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập tài khoản trước khi thực hiện mua hàng.',
            ], 401);
        }

        $validated['user_id'] = $authUser->id;
        $product = \App\Models\Product::findOrFail($validated['product_id']);
        if ($product->isDigishop() && $product->requires_customer_note && empty($validated['customer_email'])) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng nhập email tài khoản cần nâng cấp hoặc kích hoạt.',
            ], 422);
        }
        if (empty($validated['customer_email']) && !empty($authUser->email) && !str_contains($authUser->email, '@dtffshop.local')) {
            $validated['customer_email'] = $authUser->email;
        }
        if (empty($validated['customer_name'])) {
            $validated['customer_name'] = $authUser->name;
        }

        try {
            $order = $this->checkoutService->checkout($validated);

            return response()->json([
                'success' => true,
                'message' => 'Tạo đơn hàng thành công. Vui lòng quét mã VietQR để thanh toán.',
                'data' => [
                    'order_code' => $order->order_code,
                    'access_token' => $order->access_token,
                    'memo' => $order->memo,
                    'total_amount' => $order->total_amount,
                    'qr_url' => $order->qr_url,
                    'bank_code' => $this->paymentGateway->getBankCode(),
                    'account_no' => env('ACCOUNT_NO', ''),
                    'account_name' => env('ACCOUNT_NAME', 'DTFF SHOP'),
                    'expires_at' => $order->expires_at?->toIso8601String(),
                    'remaining_seconds' => (int) max(0, now()->diffInSeconds($order->expires_at, false)),
                    'status' => $order->status,
                ],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('[Checkout Exception] ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => app()->environment('production')
                    ? 'Đã xảy ra lỗi trong quá trình xử lý đơn hàng. Vui lòng thử lại sau.'
                    : $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tra cứu trạng thái đơn hàng (Polling nhẹ nhàng, không gây nghẽn SePay)
     */
    public function status(string $orderCode): JsonResponse
    {
        $order = Order::where('order_code', $orderCode)
            ->with('items.product')
            ->firstOrFail();

        // Kiểm tra quá hạn
        if ($order->isExpired()) {
            $lockKey = 'release_lock_' . $order->id;
            if (Cache::add($lockKey, 1, 10)) {
                $this->orderService->releaseExpiredOrders();
                $order->refresh();
            }
        }

        // Tự động đối soát thanh toán trực tiếp (SePayService đã có sẵn cache bảo vệ endpoint)
        if ($order->canAcceptPayment()) {
            try {
                $matchedTx = $this->paymentGateway->findMatchingTransaction($order);
                if ($matchedTx) {
                    $this->orderService->fulfillOrder($order, $matchedTx);
                    $order->refresh();
                }
            } catch (\Throwable $e) {
                Log::warning('[Checkout Polling] Lỗi đối soát: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'order_code' => $order->order_code,
                'status' => $order->status,
                'total_amount' => $order->total_amount,
                'paid_at' => $order->paid_at?->toIso8601String(),
                'is_paid' => $order->isPaid(),
                'remaining_seconds' => (int) max(0, $order->expires_at ? now()->diffInSeconds($order->expires_at, false) : 0),
            ],
        ]);
    }

    /**
     * Giả lập thanh toán tức thì (Chỉ kích hoạt trong môi trường dev/test khi có quyền Admin)
     */
    public function testPay(Request $request, string $orderCode): JsonResponse
    {
        // 1. Chặn tuyệt đối trên Production
        if (app()->environment('production')) {
            return response()->json([
                'success' => false,
                'message' => 'Chức năng giả lập thanh toán đã bị vô hiệu hóa trên môi trường sản xuất (Production).',
            ], 404);
        }

        // 2. Chặn nếu PAYMENT_TEST_MODE không bật
        if (!$this->paymentGateway->isTestMode()) {
            return response()->json([
                'success' => false,
                'message' => 'Chế độ thanh toán thử nghiệm chưa được kích hoạt trong tệp cấu hình.',
            ], 403);
        }

        // 3. Yêu cầu xác thực tài khoản Admin hoặc truyền secret dev key
        $user = $request->user('sanctum') ?? auth('sanctum')->user();
        $devSecret = (string) ($request->header('X-Dev-Secret') ?: $request->input('dev_secret'));
        $validDevSecret = env('APP_DEV_SECRET');

        if (empty($validDevSecret)) {
            return response()->json([
                'success' => false,
                'message' => 'Tính năng giả lập thanh toán không khả dụng (chưa cấu hình dev secret).',
            ], 404);
        }

        if ((!$user || !$user->isAdmin()) && (!hash_equals($validDevSecret, $devSecret))) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn phải là Quản trị viên hoặc có mã Dev Secret hợp lệ để sử dụng tính năng thử nghiệm này.',
            ], 403);
        }

        $order = Order::where('order_code', $orderCode)->firstOrFail();
        if ($order->isPaid()) {
            return response()->json(['success' => true, 'message' => 'Đơn hàng đã được thanh toán trước đó.']);
        }

        $mockTx = [
            'transactionID' => 'MOCK-' . strtoupper(Str::random(12)),
            'creditAmount' => $order->total_amount,
            'description' => $order->memo,
            'transactionDate' => now()->toDateTimeString(),
        ];

        $this->orderService->fulfillOrder($order, $mockTx);

        return response()->json([
            'success' => true,
            'message' => 'Thanh toán giả lập thành công!',
            'data' => [
                'order_code' => $order->order_code,
                'status' => 'completed',
            ],
        ]);
    }
}
