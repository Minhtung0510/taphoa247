<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    /**
     * Tiếp nhận Webhook tự động từ SePay (Hỗ trợ cả Webhook thời gian thực)
     */
    public function handleSePay(Request $request): JsonResponse
    {
        // 1. Xác thực bảo mật Webhook SePay (BẮT BUỘC Ở MỌI MÔI TRƯỜNG)
        $configuredKey = config('services.sepay.webhook_key') ?: env('SEPAY_WEBHOOK_KEY');
        if (empty($configuredKey)) {
            Log::critical('[SePay Webhook] SEPAY_WEBHOOK_KEY chưa được thiết lập trên hệ thống!');
            return response()->json([
                'success' => false,
                'message' => 'Hệ thống chưa thiết lập khóa bảo mật Webhook.',
            ], 500);
        }

        $authHeader = (string) $request->header('Authorization', '');
        $apiKeyHeader = (string) $request->header('X-Api-Key', '');
        $providedKey = (string) $request->query('api_key', '');

        $authorized = (
            hash_equals('Apikey ' . $configuredKey, $authHeader) ||
            hash_equals('Bearer ' . $configuredKey, $authHeader) ||
            hash_equals($configuredKey, $authHeader) ||
            (!empty($apiKeyHeader) && hash_equals($configuredKey, $apiKeyHeader)) ||
            (!empty($providedKey) && hash_equals($configuredKey, $providedKey))
        );

        if (!$authorized) {
            Log::warning('[SePay Webhook] Từ chối truy cập: API Key không hợp lệ từ IP ' . $request->ip());
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Invalid or missing webhook key.',
            ], 401);
        }

        $payload = $request->all();
        Log::info('[SePay Webhook] Nhận dữ liệu webhook hợp lệ:', $payload);

        // 2. Kiểm tra loại giao dịch: chỉ xử lý tiền vào (in)
        $transferType = $payload['transferType'] ?? $payload['transfer_type'] ?? 'in';
        if (strtolower((string) $transferType) !== 'in') {
            return response()->json(['success' => true, 'message' => 'Bỏ qua giao dịch tiền ra.']);
        }

        $amount = (int) ($payload['transferAmount'] ?? $payload['amount_in'] ?? $payload['amount'] ?? 0);
        $content = strtoupper((string) ($payload['content'] ?? $payload['transaction_content'] ?? $payload['description'] ?? ''));
        $code = strtoupper((string) ($payload['code'] ?? ''));
        
        // Tạo Transaction ID xác định (Deterministic) chống Replay Attack ngay cả khi thiếu reference code
        $rawTxId = $payload['referenceCode'] ?? $payload['reference_number'] ?? $payload['id'] ?? null;
        if (!empty($rawTxId)) {
            $txId = (string) $rawTxId;
        } else {
            // Hash từ nội dung + số tiền + ngày giao dịch để tránh random uniqid() làm hỏng anti-replay
            $txDate = (string) ($payload['transactionDate'] ?? now()->toDateString());
            $txId = 'TX-' . substr(hash('sha256', "{$amount}|{$content}|{$txDate}"), 0, 16);
        }

        $contentClean = str_replace([' ', '-', '_', '.'], '', $content . $code);
        if (empty($contentClean)) {
            return response()->json(['success' => true, 'message' => 'Nội dung chuyển khoản rỗng, bỏ qua.']);
        }

        // 3. Tìm đơn hàng chờ thanh toán khớp nội dung
        $orders = Order::where('status', 'pending')
            ->whereNotNull('expires_at')
            ->where('expires_at', '>', now())
            ->get();

        $matchedOrder = null;
        foreach ($orders as $order) {
            $orderCodeClean = str_replace([' ', '-', '_', '.'], '', strtoupper((string) $order->order_code));
            $shortCodeClean = str_replace([' ', '-', '_', '.'], '', strtoupper(str_replace('ACC-', '', (string) $order->order_code)));
            $memoClean = str_replace([' ', '-', '_', '.'], '', strtoupper((string) $order->memo));

            // Chỉ so khớp khi mã đơn / memo có độ dài tối thiểu an toàn (tránh chuỗi rỗng luôn match)
            $isMatched = false;
            if (!empty($orderCodeClean) && strlen($orderCodeClean) >= 6 && str_contains($contentClean, $orderCodeClean)) {
                $isMatched = true;
            } elseif (!empty($memoClean) && strlen($memoClean) >= 6 && str_contains($contentClean, $memoClean)) {
                $isMatched = true;
            } elseif (!empty($shortCodeClean) && strlen($shortCodeClean) >= 6 && str_contains($contentClean, $shortCodeClean)) {
                $isMatched = true;
            } elseif (strlen($orderCodeClean) >= 8 && str_contains($contentClean, substr($orderCodeClean, 0, 8))) {
                $isMatched = true;
            }

            if ($isMatched) {
                if ($amount >= (int) $order->total_amount) {
                    $matchedOrder = $order;
                    break;
                } else {
                    Log::warning("[SePay Webhook] Đơn hàng {$order->order_code} khớp nội dung nhưng thiếu tiền: Đóng {$amount} / Cần {$order->total_amount}");
                }
            }
        }

        if (!$matchedOrder) {
            Log::info("[SePay Webhook] Không tìm thấy đơn hàng pending khớp với nội dung: {$content}, số tiền: {$amount}");
            return response()->json(['success' => true, 'message' => 'Không tìm thấy đơn hàng phù hợp hoặc số tiền không đủ.']);
        }

        // 4. Hoàn tất đơn hàng và bàn giao tài khoản (Idempotent)
        $transactionData = [
            'transactionID' => $txId,
            'creditAmount' => $amount,
            'description' => $content,
            'transactionDate' => $payload['transactionDate'] ?? now()->toDateTimeString(),
        ];

        $fulfilled = $this->orderService->fulfillOrder($matchedOrder, $transactionData);
        if ($fulfilled) {
            Log::info("[SePay Webhook] Đã duyệt và giao tài khoản thành công cho đơn: {$matchedOrder->order_code}");
            return response()->json([
                'success' => true,
                'message' => "Đơn hàng {$matchedOrder->order_code} đã được xử lý thành công.",
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => "Giao dịch đã được xử lý hoặc có lỗi trong quá trình xuất kho.",
        ], 409);
    }
}
