<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\CheckoutService;
use App\Services\OrderService;
use App\Services\Web2MService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CheckoutController extends Controller
{
    public function __construct(
        protected CheckoutService $checkoutService,
        protected OrderService $orderService,
        protected Web2MService $web2mService
    ) {}

    /**
     * Tạo đơn hàng mới & giữ chỗ kho
     */
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1|max:50',
            'customer_name' => 'nullable|string|max:100',
            'customer_email' => 'nullable|email|max:150',
            'customer_phone' => 'nullable|string|max:20',
        ]);

        $validated['user_id'] = $request->user()?->id;

        try {
            $order = $this->checkoutService->checkout($validated);

            return response()->json([
                'success' => true,
                'message' => 'Tạo đơn hàng thành công. Vui lòng quét mã VietQR để thanh toán.',
                'data' => [
                    'order_code' => $order->order_code,
                    'memo' => $order->memo,
                    'total_amount' => $order->total_amount,
                    'qr_url' => $order->qr_url,
                    'bank_code' => config('services.web2m.bank_code', env('BANK_CODE', 'MBB')),
                    'account_no' => config('services.web2m.account_no', env('ACCOUNT_NO', '')),
                    'account_name' => config('services.web2m.account_name', env('ACCOUNT_NAME', 'DTFF SHOP')),
                    'expires_at' => $order->expires_at?->toIso8601String(),
                    'remaining_seconds' => max(0, now()->diffInSeconds($order->expires_at, false)),
                    'status' => $order->status,
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
     * Tra cứu trạng thái đơn hàng (Polling)
     */
    public function status(string $orderCode): JsonResponse
    {
        $order = Order::where('order_code', $orderCode)
            ->with('items.product')
            ->firstOrFail();

        // Kiểm tra quá hạn
        if ($order->isExpired()) {
            $this->orderService->releaseExpiredOrders();
            $order->refresh();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'order_code' => $order->order_code,
                'status' => $order->status,
                'total_amount' => $order->total_amount,
                'paid_at' => $order->paid_at?->toIso8601String(),
                'is_paid' => $order->isPaid(),
                'remaining_seconds' => max(0, $order->expires_at ? now()->diffInSeconds($order->expires_at, false) : 0),
            ],
        ]);
    }

    /**
     * Server-Sent Events (SSE) stream theo dõi thanh toán realtime
     */
    public function stream(string $orderCode): StreamedResponse
    {
        return new StreamedResponse(function () use ($orderCode) {
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('X-Accel-Buffering: no');

            $start = time();
            while (time() - $start < 30) { // Max execution 30s per connection
                $order = Order::where('order_code', $orderCode)->first();

                if (!$order) {
                    echo "event: error\ndata: " . json_encode(['message' => 'Không tìm thấy đơn hàng']) . "\n\n";
                    ob_flush();
                    flush();
                    break;
                }

                $data = [
                    'order_code' => $order->order_code,
                    'status' => $order->status,
                    'is_paid' => $order->isPaid(),
                    'remaining_seconds' => max(0, $order->expires_at ? now()->diffInSeconds($order->expires_at, false) : 0),
                ];

                echo "event: status\ndata: " . json_encode($data) . "\n\n";
                ob_flush();
                flush();

                if ($order->isPaid() || $order->status === 'timeout') {
                    break;
                }

                sleep(2);
            }
        });
    }

    /**
     * Giả lập thanh toán tức thì (Chỉ kích hoạt khi PAYMENT_TEST_MODE=true)
     */
    public function testPay(string $orderCode): JsonResponse
    {
        if (!$this->web2mService->isTestMode()) {
            return response()->json([
                'success' => false,
                'message' => 'Chế độ test thanh toán không được kích hoạt.',
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
