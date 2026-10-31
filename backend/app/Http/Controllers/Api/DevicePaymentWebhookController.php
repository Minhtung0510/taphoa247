<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DevicePaymentWebhookController extends Controller
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * Tiếp nhận Webhook từ Android App (DTFF Gateway)
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        $secret = (string) config('services.device_gateway.secret', '');
        if (strlen($secret) < 32 || hash_equals('DTFF_SECRET_TEST_2026', $secret)) {
            Log::critical('[Device Gateway] DEVICE_GATEWAY_SECRET trống, yếu hoặc vẫn dùng giá trị mặc định.');
            return response()->json(['error' => 'gateway_not_configured'], 503);
        }

        if (!$this->hasValidSignature($request, $secret)) {
            Log::warning('[Device Gateway] Từ chối truy cập: Sai Secret hoặc Signature từ IP ' . $request->ip());
            return response()->json(['error' => 'unauthorized', 'message' => 'Xác thực thiết bị thất bại'], 401);
        }

        $rawContent = (string) ($request->input('raw_content') ?: $request->input('body', ''));
        if (empty($rawContent)) {
            return response()->json(['error' => 'invalid_payload', 'message' => 'Nội dung thông báo trống'], 422);
        }

        Log::info('[Device Gateway] Nhận thông báo từ Android: ' . $rawContent);

        // 2. Bóc tách số tiền & mã đơn hàng (Parser)
        $parsed = $this->parseNotification($rawContent);

        if (!$parsed['incoming'] || empty($parsed['amount'])) {
            Log::info('[Device Gateway] Bỏ qua: Không phải thông báo tiền vào hoặc không bóc được số tiền.');
            return response()->json(['status' => 'ignored', 'reason' => 'not_incoming_money']);
        }

        if (empty($parsed['codes'])) {
            Log::warning("[Device Gateway] Giao dịch {$parsed['amount']}đ không tìm thấy mã đơn ACC... trong nội dung: {$rawContent}");
            return response()->json(['status' => 'unmatched', 'reason' => 'no_order_code_found']);
        }

        // 3. Tìm đơn hàng đang chờ thanh toán (pending)
        $matchedOrder = null;
        foreach ($parsed['codes'] as $code) {
            $normalizedCode = strtoupper($code);
            $cleanCode = str_replace(['ACC-', 'ACC'], '', $normalizedCode);

            $order = Order::where(function ($q) use ($normalizedCode, $cleanCode) {
                $q->where('order_code', $normalizedCode)
                  ->orWhere('order_code', 'ACC-' . $cleanCode)
                  ->orWhere('order_code', 'ACC' . $cleanCode)
                  ->orWhere('order_code', $cleanCode)
                  ->orWhere('memo', $normalizedCode)
                  ->orWhere('memo', 'ACC-' . $cleanCode)
                  ->orWhere('memo', 'ACC' . $cleanCode)
                  ->orWhere('memo', $cleanCode);
            })->where('status', 'pending')->first();

            if ($order) {
                $matchedOrder = $order;
                break;
            }
        }

        if (!$matchedOrder) {
            Log::info("[Device Gateway] Không tìm thấy đơn pending nào khớp với mã: " . implode(', ', $parsed['codes']));
            return response()->json(['status' => 'unmatched', 'reason' => 'order_not_found_or_already_paid']);
        }

        // 4. Kiểm tra số tiền
        if ($parsed['amount'] < $matchedOrder->total_amount) {
            Log::warning("[Device Gateway] Đơn {$matchedOrder->order_code} chuyển thiếu tiền: Đã chuyển {$parsed['amount']} / Cần {$matchedOrder->total_amount}");
            return response()->json(['status' => 'underpaid', 'transferred' => $parsed['amount'], 'required' => $matchedOrder->total_amount]);
        }

        // 5. Duyệt đơn và bàn giao tài khoản tự động (Idempotent)
        $txId = $parsed['bankRef'] ?: ('DEV-' . $matchedOrder->order_code . '-' . time());
        $success = $this->orderService->fulfillOrder($matchedOrder, [
            'transactionID' => $txId,
            'creditAmount' => $parsed['amount'],
            'description' => $rawContent,
        ]);

        if ($success) {
            Log::info("[Device Gateway] ✅ ĐÃ DUYỆT VÀ GIAO ACC THÀNH CÔNG CHO ĐƠN: {$matchedOrder->order_code}");
            return response()->json([
                'status' => 'ok',
                'result' => 'fulfilled',
                'order_code' => $matchedOrder->order_code,
                'amount' => $parsed['amount']
            ]);
        }

        return response()->json(['status' => 'ok', 'result' => 'already_paid']);
    }

    /**
     * Nhận Heartbeat nhịp tim từ Android
     */
    public function handleHeartbeat(Request $request): JsonResponse
    {
        $secret = (string) config('services.device_gateway.secret', '');
        if (strlen($secret) < 32 || hash_equals('DTFF_SECRET_TEST_2026', $secret)) {
            Log::critical('[Device Gateway] DEVICE_GATEWAY_SECRET trống, yếu hoặc vẫn dùng giá trị mặc định.');
            return response()->json(['error' => 'gateway_not_configured'], 503);
        }

        if (!$this->hasValidSignature($request, $secret)) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        // Lưu cache trạng thái thiết bị 3 phút
        \Illuminate\Support\Facades\Cache::put('device_gateway_status', [
            'is_online' => true,
            'last_seen' => now()->toIso8601String(),
            'battery' => $request->input('battery'),
            'network' => $request->input('network', 'wifi/4g'),
            'app_version' => $request->input('app_version', '1.0.0'),
            'pending_queue' => $request->input('pending_queue', 0),
        ], 180);

        return response()->json(['ok' => true, 'server_time' => now()->timestamp]);
    }

    private function hasValidSignature(Request $request, string $secret): bool
    {
        $timestamp = (string) $request->header('X-Timestamp', '');
        $signature = (string) $request->header('X-Signature', '');
        if (!preg_match('/^\\d{10}$/', $timestamp) || !preg_match('/^[a-fA-F0-9]{64}$/', $signature)) {
            return false;
        }

        if (abs(now()->timestamp - (int) $timestamp) > 300) {
            return false;
        }

        $payloadToSign = $timestamp . "\n" . hash('sha256', $request->getContent());
        $expectedSignature = hash_hmac('sha256', $payloadToSign, $secret);

        if (!hash_equals($expectedSignature, strtolower($signature))) {
            return false;
        }

        $replayKey = 'device_gateway_signature:' . hash('sha256', $timestamp . ':' . strtolower($signature));
        return Cache::add($replayKey, true, now()->addMinutes(5));
    }

    /**
     * Bóc tách thông báo ngân hàng
     */
    private function parseNotification(string $raw): array
    {
        $text = strtoupper(Str::ascii($raw));

        // 1. Tiền vào (+<số> VND|VNĐ|D|Đ hoặc PS:+<số>)
        $amount = null;
        if (preg_match('/(?:\+|PS:\s*\+\s*)([0-9][0-9.,]*)\s*(?:VND|VNĐ|D|Đ)?\b/iu', $text, $m)) {
            $clean = rtrim($m[1], '.,');
            if (preg_match('/^(.*\d)[.,](\d{1,2})$/', $clean, $d)) {
                $clean = $d[1];
            }
            $amount = (int) preg_replace('/\D/', '', $clean);
        }
        $incoming = ($amount !== null && $amount > 0);

        // 2. Tìm mã đơn ACC... (6 đến 8 ký tự sau ACC)
        $codes = [];
        if (preg_match_all('/ACC-?([A-Z0-9]{6,8})/i', $text, $mm)) {
            $codes = array_merge($mm[0], $mm[1]);
        }
        $codes = array_values(array_unique(array_filter($codes)));

        // 3. Mã giao dịch (SO GD, SOGD hoặc FT...)
        $ref = null;
        if (preg_match('/(?:SO GD|SOGD|MAGD|FT)\s*:?\s*([A-Z0-9]{6,25})/i', $text, $r)) {
            $ref = $r[1];
        } elseif (preg_match('/\bFT\d{8,}\b/', $text, $r)) {
            $ref = $r[0];
        }

        return [
            'incoming' => $incoming,
            'amount' => $amount,
            'codes' => $codes,
            'bankRef' => $ref,
        ];
    }
}
