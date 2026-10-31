<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * DigishopResellerService
 *
 * Gọi Digishop Reseller API để tạo đơn và lấy thông tin bàn giao.
 *
 * Base URL: https://fxuddnmgxjofivlytckn.supabase.co/functions/v1
 * Headers:
 *   - apikey: DIGISHOP_GATEWAY_KEY (sb_publishable_...)
 *   - Authorization: Bearer DIGISHOP_RESELLER_KEY (rsk_live_...)
 *   - Content-Type: application/json
 */
class DigishopResellerService
{
    protected string $baseUrl = 'https://fxuddnmgxjofivlytckn.supabase.co/functions/v1';
    protected string $gatewayKey;
    protected string $resellerKey;

    public function __construct()
    {
        $this->gatewayKey  = env('DIGISHOP_GATEWAY_KEY', '');
        $this->resellerKey = env('DIGISHOP_RESELLER_KEY', '');
    }

    /**
     * Headers bắt buộc cho mọi request Digishop Reseller API
     */
    protected function headers(): array
    {
        return [
            'apikey'        => $this->gatewayKey,
            'Authorization' => "Bearer {$this->resellerKey}",
            'Content-Type'  => 'application/json',
        ];
    }

    /**
     * Tạo đơn hàng Reseller trên Digishop.
     *
     * @param string $productId   UUID sản phẩm trên Digishop
     * @param string $orderRef    Mã đơn của DTFF shop (ACC-XXXXXXXX) – dùng làm memo/note
     * @return array{success: bool, order_id: string|null, delivery_content: string|null, error: string|null}
     */
    public function createOrder(string $productId, string $orderRef): array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->withoutVerifying()  // Fix cURL error 60 trên Windows (không có CA bundle)
                ->timeout(30)
                ->post("{$this->baseUrl}/reseller-create-order", [
                    'items' => [
                        [
                            'product_id' => $productId,
                            'quantity'   => 1,
                        ],
                    ],
                    'note' => $orderRef,  // Ghi chú để trace lại sau
                ]);

            $body = $response->json();

            Log::info("[Digishop] createOrder product={$productId} ref={$orderRef} status={$response->status()}", [
                'response' => $body,
            ]);

            // Digishop có thể trả về array orders hoặc single object
            $orderData = null;
            if (!empty($body['id'])) {
                $orderData = $body;
            } elseif (!empty($body['orders'][0])) {
                $orderData = $body['orders'][0];
            } elseif (!empty($body['order'])) {
                $orderData = $body['order'];
            }

            if ($response->successful() && $orderData) {
                return [
                    'success'          => true,
                    'order_id'         => (string) ($orderData['id'] ?? $orderData['order_number'] ?? ''),
                    'delivery_content' => $orderData['delivery_content'] ?? null,
                    'status'           => $orderData['status'] ?? 'pending',
                    'error'            => null,
                ];
            }

            $errorMsg = $body['error'] ?? $body['message'] ?? 'Unknown error from Digishop API';
            Log::error("[Digishop] createOrder FAILED product={$productId}: {$errorMsg}", ['body' => $body]);

            return [
                'success'          => false,
                'order_id'         => null,
                'delivery_content' => null,
                'error'            => $errorMsg,
            ];
        } catch (\Throwable $e) {
            Log::error("[Digishop] createOrder EXCEPTION product={$productId}: {$e->getMessage()}");

            return [
                'success'          => false,
                'order_id'         => null,
                'delivery_content' => null,
                'error'            => $e->getMessage(),
            ];
        }
    }

    /**
     * Lấy thông tin đơn hàng Reseller (polling để lấy delivery_content nếu chưa có).
     *
     * @param string $digishopOrderId  ID đơn trên Digishop (UUID)
     * @return array{status: string, delivery_content: string|null}
     */
    public function getOrder(string $digishopOrderId): array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->withoutVerifying()  // Fix cURL error 60 trên Windows
                ->timeout(15)
                ->get("{$this->baseUrl}/reseller-get-orders", [
                    'order_id' => $digishopOrderId,
                ]);

            $body = $response->json();
            $orders = $body['orders'] ?? $body['data'] ?? ($body['id'] ? [$body] : []);

            // Nếu trả về single object
            if (!empty($body['id'])) {
                $orders = [$body];
            }

            foreach ($orders as $order) {
                if ((string)($order['id'] ?? '') === $digishopOrderId) {
                    return [
                        'status'           => $order['status'] ?? 'pending',
                        'delivery_content' => $order['delivery_content'] ?? null,
                    ];
                }
            }

            // Không tìm thấy trong kết quả
            if (!empty($orders[0])) {
                return [
                    'status'           => $orders[0]['status'] ?? 'pending',
                    'delivery_content' => $orders[0]['delivery_content'] ?? null,
                ];
            }

            return ['status' => 'unknown', 'delivery_content' => null];
        } catch (\Throwable $e) {
            Log::error("[Digishop] getOrder EXCEPTION id={$digishopOrderId}: {$e->getMessage()}");
            return ['status' => 'error', 'delivery_content' => null];
        }
    }

    /**
     * Kiểm tra số dư ví Reseller.
     */
    public function getBalance(): int
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->withoutVerifying()  // Fix cURL error 60 trên Windows
                ->timeout(10)
                ->post("{$this->baseUrl}/reseller-get-profile", []);

            $body = $response->json();
            return (int) ($body['balance'] ?? $body['wallet_balance'] ?? 0);
        } catch (\Throwable $e) {
            Log::warning("[Digishop] getBalance failed: {$e->getMessage()}");
            return -1;
        }
    }
}
