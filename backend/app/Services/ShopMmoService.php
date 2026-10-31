<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * ShopMmoService
 *
 * Gọi ShopMMO.pro API để tạo đơn hàng và nhận thông tin tài khoản bàn giao.
 *
 * Base URL: https://shopmmo.pro/api/v1
 * Auth: X-API-Key header
 */
class ShopMmoService
{
    protected string $baseUrl = 'https://shopmmo.pro/api/v1';
    protected string $apiKey;

    public function __construct()
    {
        $this->apiKey = (string) (config('services.shopmmo.api_key') ?: env('SHOPMMO_API_KEY', ''));
    }

    /**
     * Headers bắt buộc cho mọi request ShopMMO API
     */
    protected function headers(): array
    {
        return [
            'X-API-Key'    => $this->apiKey,
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ];
    }

    /**
     * Tạo đơn hàng trên ShopMMO.
     *
     * @param int    $productId  ID sản phẩm trên ShopMMO (int)
     * @param int    $quantity   Số lượng cần mua
     * @param string $orderRef   Mã đơn của Tạp Hóa 247 (ACC-XXXXXXXX) – ghi vào note
     * @return array{success: bool, order_id: string|null, delivery_content: string|null, error: string|null}
     */
    public function createOrder(int $productId, int $quantity, string $orderRef): array
    {
        try {
            $response = Http::withOptions(['verify' => config('services.tls.ca_bundle') ?: true])
                ->withHeaders($this->headers())
                ->timeout(30)
                ->post("{$this->baseUrl}/orders/create", [
                    'product_id' => $productId,
                    'quantity'   => $quantity,
                    'note'       => $orderRef,
                ]);

            $body = $response->json();

            Log::info("[ShopMMO] createOrder product={$productId} qty={$quantity} ref={$orderRef} status={$response->status()}", [
                'response' => $body,
            ]);

            if ($response->successful() && !empty($body['data'])) {
                $data = $body['data'];

                // ShopMMO trả về mảng items đã mua
                $deliveryContent = null;
                if (!empty($data['items']) && is_array($data['items'])) {
                    // Ghép tất cả accounts thành chuỗi (mỗi dòng 1 acc)
                    $lines = array_map(fn($item) => $item['account'] ?? $item['data'] ?? '', $data['items']);
                    $deliveryContent = implode("\n", array_filter($lines));
                } elseif (!empty($data['account'])) {
                    $deliveryContent = $data['account'];
                } elseif (!empty($data['data'])) {
                    $deliveryContent = $data['data'];
                }

                $orderId = (string) ($data['id'] ?? $data['order_id'] ?? '');

                return [
                    'success'          => true,
                    'order_id'         => $orderId,
                    'delivery_content' => $deliveryContent,
                    'status'           => 'completed',
                    'error'            => null,
                ];
            }

            // Xử lý lỗi từ ShopMMO
            $errorMsg = $body['error']['message']
                ?? $body['message']
                ?? 'Lỗi không xác định từ ShopMMO API';

            Log::error("[ShopMMO] createOrder FAILED product={$productId}: {$errorMsg}", ['body' => $body]);

            return [
                'success'          => false,
                'order_id'         => null,
                'delivery_content' => null,
                'error'            => $errorMsg,
            ];
        } catch (\Throwable $e) {
            Log::error("[ShopMMO] createOrder EXCEPTION product={$productId}: {$e->getMessage()}");

            return [
                'success'          => false,
                'order_id'         => null,
                'delivery_content' => null,
                'error'            => $e->getMessage(),
            ];
        }
    }

    /**
     * Lấy thông tin đơn hàng đã tạo (để kiểm tra lại sau).
     *
     * @param string $shopmmoOrderId  ID đơn trên ShopMMO
     */
    public function getOrder(string $shopmmoOrderId): array
    {
        try {
            $response = Http::withOptions(['verify' => config('services.tls.ca_bundle') ?: true])
                ->withHeaders($this->headers())
                ->timeout(15)
                ->get("{$this->baseUrl}/orders/{$shopmmoOrderId}");

            $body = $response->json();
            $data = $body['data'] ?? $body;

            return [
                'status'           => $data['status'] ?? 'unknown',
                'delivery_content' => $data['account'] ?? $data['data'] ?? null,
            ];
        } catch (\Throwable $e) {
            Log::error("[ShopMMO] getOrder EXCEPTION id={$shopmmoOrderId}: {$e->getMessage()}");
            return ['status' => 'error', 'delivery_content' => null];
        }
    }

    /**
     * Kiểm tra số dư tài khoản ShopMMO.
     */
    public function getBalance(): float
    {
        try {
            $response = Http::withOptions(['verify' => config('services.tls.ca_bundle') ?: true])
                ->withHeaders($this->headers())
                ->timeout(10)
                ->get("{$this->baseUrl}/profile");

            $body = $response->json();
            return (float) ($body['data']['balance'] ?? $body['balance'] ?? 0);
        } catch (\Throwable $e) {
            Log::warning("[ShopMMO] getBalance failed: {$e->getMessage()}");
            return -1;
        }
    }
}
