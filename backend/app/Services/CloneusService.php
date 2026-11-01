<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CloneusService
{
    private const BASE_URL = 'https://cloneus.net/api';

    private function apiKey(): string
    {
        return (string) config('services.cloneus.api_key', '');
    }

    private function get(string $endpoint, array $query = []): array
    {
        if ($this->apiKey() === '') {
            throw new \RuntimeException('Nhà cung cấp chưa được cấu hình.');
        }

        $response = Http::acceptJson()
            ->withOptions(['verify' => config('services.tls.ca_bundle') ?: true])
            ->timeout(20)
            ->get(self::BASE_URL . '/' . $endpoint, ['api_key' => $this->apiKey(), ...$query]);

        if (!$response->successful()) {
            Log::warning('[Muse fulfillment] Read request was rejected.', ['endpoint' => $endpoint, 'http_status' => $response->status()]);
            throw new \RuntimeException('Không lấy được trạng thái sản phẩm từ nhà cung cấp.');
        }

        $body = $response->json();
        if (!is_array($body)) {
            throw new \RuntimeException('Phản hồi nhà cung cấp không hợp lệ.');
        }

        return $body;
    }

    /** Read-only catalog lookup; returns the upstream item matching the configured ID. */
    public function findCatalogProduct(string $productId): ?array
    {
        $body = $this->get('products.php');
        if (($body['status'] ?? null) !== 'success') {
            return null;
        }

        $matches = [];
        $walk = function ($node) use (&$walk, &$matches, $productId): void {
            if (!is_array($node)) return;
            if (isset($node['id']) && (string) $node['id'] === $productId && array_key_exists('price', $node)) {
                $matches[] = $node;
                return;
            }
            foreach ($node as $child) $walk($child);
        };
        $walk($body['categories'] ?? []);

        return $matches[0] ?? null;
    }

    /** Create a supplier order. This call is intentionally never retried automatically. */
    public function createOrder(string $productId, int $quantity): array
    {
        if ($this->apiKey() === '') {
            return ['success' => false, 'order_id' => null, 'delivery_content' => null, 'status' => 'needs_review'];
        }

        $product = $this->findCatalogProduct($productId);
        if (!$product || (int) ($product['amount'] ?? 0) < $quantity) {
            Log::warning('[Muse fulfillment] Purchase stopped: product unavailable or stock insufficient.', ['product_id' => $productId]);
            return ['success' => false, 'order_id' => null, 'delivery_content' => null, 'status' => 'needs_review'];
        }

        try {
            $response = Http::asForm()
                ->acceptJson()
                ->withOptions(['verify' => config('services.tls.ca_bundle') ?: true])
                ->timeout(60)
                ->post(self::BASE_URL . '/buy_product', [
                    'action' => 'buyProduct',
                    'id' => $productId,
                    'amount' => $quantity,
                    'api_key' => $this->apiKey(),
                ]);
            $body = $response->json();
            $body = is_array($body) ? $body : [];
            $orderId = (string) ($body['trans_id'] ?? '');
            $data = $body['data'] ?? [];
            $credentials = is_array($data) ? implode("\n", array_map('strval', $data)) : (is_string($data) ? $data : '');
            $successful = $response->successful() && ($body['status'] ?? null) === 'success' && $orderId !== '';

            Log::info('[Muse fulfillment] Purchase result received.', [
                'product_id' => $productId,
                'http_status' => $response->status(),
                'has_order_id' => $orderId !== '',
                'has_delivery_content' => $credentials !== '',
            ]);

            return [
                'success' => $successful,
                'order_id' => $orderId !== '' ? $orderId : null,
                'delivery_content' => $credentials !== '' ? $credentials : null,
                'status' => $successful ? 'success' : 'needs_review',
            ];
        } catch (\Throwable $e) {
            Log::error('[Muse fulfillment] Purchase result is uncertain; manual review required.', [
                'product_id' => $productId,
                'exception' => get_class($e),
            ]);
            return ['success' => false, 'order_id' => null, 'delivery_content' => null, 'status' => 'needs_review'];
        }
    }

    public function getOrder(string $orderId): array
    {
        try {
            $body = $this->get('order.php', ['order' => $orderId]);
            $data = $body['data'] ?? $body['order'] ?? [];
            $credentials = is_array($data) ? ($data['data'] ?? $data['delivery_content'] ?? null) : null;
            if (is_array($credentials)) $credentials = implode("\n", array_map('strval', $credentials));

            return [
                'status' => (string) ($body['status'] ?? $data['status'] ?? 'processing'),
                'delivery_content' => is_string($credentials) && $credentials !== '' ? $credentials : null,
            ];
        } catch (\Throwable) {
            return ['status' => 'processing', 'delivery_content' => null];
        }
    }
}
