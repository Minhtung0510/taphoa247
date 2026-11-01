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
        $this->gatewayKey  = (string) (config('services.digishop.gateway_key') ?: env('DIGISHOP_GATEWAY_KEY', env('SUPPLIER_GATEWAY_KEY', '')));
        $this->resellerKey = (string) (config('services.digishop.reseller_key') ?: env('DIGISHOP_RESELLER_KEY', env('SUPPLIER_RESELLER_KEY', '')));
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
            'Accept'        => 'application/json',
        ];
    }

    /** Read the reseller product catalog. This never creates a purchase. */
    public function getProducts(int $limit = 50): array
    {
        if ($this->gatewayKey === '' || $this->resellerKey === '') {
            return [];
        }

        try {
            $response = Http::withOptions(['verify' => config('services.tls.ca_bundle') ?: true])
                ->withHeaders($this->headers())
                ->timeout(20)
                ->get("{$this->baseUrl}/reseller-get-products", [
                    'limit' => min(50, max(1, $limit)),
                ]);

            if (!$response->successful()) {
                Log::warning('[Reseller API] Product catalog lookup failed.', [
                    'http_status' => $response->status(),
                ]);
                return [];
            }

            $body = $response->json();
            $products = $body['products'] ?? $body['data']['products'] ?? $body['data'] ?? [];
            return is_array($products) ? array_values(array_filter($products, 'is_array')) : [];
        } catch (\Throwable $e) {
            Log::warning('[Reseller API] Product catalog lookup raised an exception.', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /** Read reseller balance and discount details using the documented GET endpoint. */
    public function getProfile(): array
    {
        if ($this->gatewayKey === '' || $this->resellerKey === '') {
            return [];
        }

        try {
            $response = Http::withOptions(['verify' => config('services.tls.ca_bundle') ?: true])
                ->withHeaders($this->headers())
                ->timeout(10)
                ->get("{$this->baseUrl}/reseller-get-profile");

            if (!$response->successful()) {
                Log::warning('[Reseller API] Profile lookup failed.', [
                    'http_status' => $response->status(),
                ]);
                return [];
            }

            $body = $response->json();
            $profile = $body['profile'] ?? $body['data']['profile'] ?? $body['data'] ?? [];
            return is_array($profile) ? $profile : [];
        } catch (\Throwable $e) {
            Log::warning('[Reseller API] Profile lookup raised an exception.', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /** Read the reseller order list using the documented list endpoint. */
    public function getOrders(int $limit = 50): array
    {
        if ($this->gatewayKey === '' || $this->resellerKey === '') {
            return [];
        }

        try {
            $response = Http::withOptions(['verify' => config('services.tls.ca_bundle') ?: true])
                ->withHeaders($this->headers())
                ->timeout(15)
                ->get("{$this->baseUrl}/reseller-get-orders", [
                    'limit' => min(50, max(1, $limit)),
                ]);

            if (!$response->successful()) {
                Log::warning('[Reseller API] Order list lookup failed.', [
                    'http_status' => $response->status(),
                ]);
                return [];
            }

            $body = $response->json();
            $orders = $body['orders'] ?? $body['data']['orders'] ?? $body['data'] ?? [];
            if (is_array($body) && !empty($body['id'])) {
                return [$body];
            }
            return is_array($orders) ? array_values(array_filter($orders, 'is_array')) : [];
        } catch (\Throwable $e) {
            Log::warning('[Reseller API] Order list lookup raised an exception.', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
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
            // The API requires license_type. Resolve it from the catalog instead of
            // guessing, and fail closed if this product is missing/unavailable.
            $product = null;
            foreach ($this->getProducts(50) as $catalogProduct) {
                $catalogId = (string) ($catalogProduct['id'] ?? $catalogProduct['product_id'] ?? '');
                if ($catalogId !== '' && hash_equals($catalogId, $productId)) {
                    $product = $catalogProduct;
                    break;
                }
            }

            $licenseType = trim((string) ($product['license_type'] ?? ''));
            if ($product === null || $licenseType === '') {
                Log::warning('[Reseller API] Purchase stopped: product or license type missing.', [
                    'product_id' => $productId,
                ]);

                return [
                    'success'          => false,
                    'order_id'         => null,
                    'delivery_content' => null,
                    'error'            => 'Sản phẩm không khả dụng hoặc thiếu loại license. Vui lòng liên hệ quản trị viên.',
                ];
            }

            $response = Http::withOptions(['verify' => config('services.tls.ca_bundle') ?: true])
                ->withHeaders($this->headers())
                ->timeout(60)
                ->post("{$this->baseUrl}/reseller-create-order", [
                    'items' => [
                        [
                            'product_id'   => $productId,
                            'quantity'     => 1,
                            'license_type' => $licenseType,
                        ],
                    ],
                    'customer_note' => $orderRef,
                ]);

            $body = $response->json();
            $body = is_array($body) ? $body : [];

            // Documented response is { "order": { ... } }.
            $orderData = $body['order'] ?? $body['data']['order'] ?? null;
            if (!is_array($orderData) && !empty($body['orders'][0]) && is_array($body['orders'][0])) {
                $orderData = $body['orders'][0];
            }
            if (!is_array($orderData) && !empty($body['id'])) {
                $orderData = $body;
            }

            $externalOrderId = is_array($orderData)
                ? (string) ($orderData['id'] ?? $orderData['order_number'] ?? '')
                : '';
            $deliveryContent = is_array($orderData)
                ? ($orderData['delivery_content'] ?? null)
                : null;

            // Never write the raw response to logs: it can contain purchased credentials.
            Log::info('[Reseller API] Purchase request completed.', [
                'product_id' => $productId,
                'order_ref' => $orderRef,
                'http_status' => $response->status(),
                'has_order_id' => $externalOrderId !== '',
                'has_delivery_content' => is_string($deliveryContent) && $deliveryContent !== '',
                'order_status' => is_array($orderData) ? ($orderData['status'] ?? null) : null,
            ]);

            if ($response->successful() && is_array($orderData) && $externalOrderId !== '') {
                return [
                    'success'          => true,
                    'order_id'         => $externalOrderId,
                    'delivery_content' => $deliveryContent,
                    'status'           => $orderData['status'] ?? 'pending',
                    'error'            => null,
                ];
            }

            $errorMsg = (string) ($body['error'] ?? $body['message'] ?? 'Nhà cung cấp chưa xác nhận được đơn hàng.');
            Log::warning('[Reseller API] Purchase request was not confirmed.', [
                'product_id' => $productId,
                'order_ref' => $orderRef,
                'http_status' => $response->status(),
            ]);

            return [
                'success'          => false,
                'order_id'         => null,
                'delivery_content' => null,
                'error'            => $errorMsg,
            ];
        } catch (\Throwable $e) {
            Log::error('[Reseller API] Purchase request raised an exception.', [
                'product_id' => $productId,
                'order_ref' => $orderRef,
                'error' => $e->getMessage(),
            ]);

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
            foreach ($this->getOrders(50) as $order) {
                $orderId = (string) ($order['id'] ?? $order['order_id'] ?? '');
                if ($orderId !== '' && hash_equals($orderId, $digishopOrderId)) {
                    return [
                        'status'           => $order['status'] ?? 'pending',
                        'delivery_content' => $order['delivery_content'] ?? null,
                    ];
                }
            }

            // Never use another order's first row as a fallback: that could leak its delivery data.
            return ['status' => 'unknown', 'delivery_content' => null];
        } catch (\Throwable $e) {
            Log::warning('[Reseller API] Order lookup raised an exception.', [
                'error' => $e->getMessage(),
            ]);
            return ['status' => 'error', 'delivery_content' => null];
        }
    }

    /**
     * Kiểm tra số dư ví Reseller.
     */
    public function getBalance(): int
    {
        $profile = $this->getProfile();
        if ($profile === []) {
            return -1;
        }

        return (int) ($profile['reseller_balance'] ?? $profile['balance'] ?? $profile['wallet_balance'] ?? -1);
    }
}
