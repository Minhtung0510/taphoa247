<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShopMmoService
{
    protected string $baseUrl = 'https://shopmmo.pro/api/v1';
    protected string $apiKey;

    public function __construct()
    {
        $this->apiKey = (string) (config('services.shopmmo.api_key') ?: env('SHOPMMO_API_KEY', ''));
    }

    protected function headers(?string $idempotencyKey = null): array
    {
        $headers = [
            'X-API-Key' => $this->apiKey,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];

        if ($idempotencyKey !== null && $idempotencyKey !== '') {
            $headers['Idempotency-Key'] = $idempotencyKey;
        }

        return $headers;
    }

    /**
     * Place one reseller order. The same idempotency key must be reused if the
     * request outcome is uncertain, so a retry cannot charge the wallet twice.
     *
     * @return array{success: bool, order_id: string|null, delivery_content: string|null, status: string, error: string|null}
     */
    public function createOrder(
        int $productId,
        int $quantity,
        string $orderRef,
        ?string $idempotencyKey = null
    ): array {
        if ($this->apiKey === '') {
            return [
                'success' => false,
                'order_id' => null,
                'delivery_content' => null,
                'status' => 'error',
                'error' => 'Supplier API key is not configured.',
            ];
        }

        $quantity = max(1, $quantity);
        $idempotencyKey ??= 'taphoa247-' . substr(hash('sha256', $orderRef . ':' . $productId . ':' . $quantity), 0, 40);

        try {
            $response = Http::withOptions(['verify' => config('services.tls.ca_bundle') ?: true])
                ->withHeaders($this->headers($idempotencyKey))
                // The supplier documents 15–30 seconds for some automatic deliveries.
                ->timeout(65)
                ->post("{$this->baseUrl}/order", [
                    'product_id' => $productId,
                    'amount' => $quantity,
                ]);

            $body = $response->json();
            $data = is_array($body) && is_array($body['data'] ?? null) ? $body['data'] : (is_array($body) ? $body : []);
            $transactionId = $data['trans_id'] ?? $body['trans_id'] ?? null;
            $status = strtolower((string) ($data['status'] ?? $body['status'] ?? 'unknown'));
            $deliveryContent = $this->extractDeliveryContent($data);
            $error = $this->extractError($data) ?? $this->extractError(is_array($body) ? $body : []);

            // Never log the response body: successful responses can contain the purchased credentials.
            Log::info('[Supplier API] Order request completed.', [
                'product_id' => $productId,
                'quantity' => $quantity,
                'order_ref' => $orderRef,
                'http_status' => $response->status(),
                'provider_status' => $status,
                'has_transaction_id' => is_string($transactionId) && $transactionId !== '',
                'delivered_count' => is_array($data['items'] ?? null) ? count($data['items']) : 0,
            ]);

            $transactionId = is_scalar($transactionId) ? trim((string) $transactionId) : '';
            $hasTransaction = $transactionId !== '';

            return [
                // Keep the transaction ID even for failed/reconciled results to prevent a duplicate purchase.
                'success' => $response->successful() && $hasTransaction,
                'order_id' => $hasTransaction ? $transactionId : null,
                'delivery_content' => $deliveryContent,
                'status' => $status,
                'error' => $response->successful() && $hasTransaction
                    ? null
                    : ($error ?? "Supplier API returned HTTP {$response->status()} without a transaction ID."),
            ];
        } catch (\Throwable $e) {
            Log::error('[Supplier API] Order request failed before a result could be confirmed.', [
                'product_id' => $productId,
                'order_ref' => $orderRef,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'order_id' => null,
                'delivery_content' => null,
                'status' => 'unknown',
                'error' => $e->getMessage(),
            ];
        }
    }

    /** Retrieve a previously created transaction without making a new purchase. */
    public function getOrder(string $transactionId): array
    {
        if ($this->apiKey === '') {
            return ['status' => 'error', 'delivery_content' => null];
        }

        try {
            $response = Http::withOptions(['verify' => config('services.tls.ca_bundle') ?: true])
                ->withHeaders($this->headers())
                ->timeout(15)
                ->get("{$this->baseUrl}/orders/" . rawurlencode($transactionId));

            if (!$response->successful()) {
                Log::warning('[Supplier API] Order status lookup failed.', [
                    'http_status' => $response->status(),
                    'has_transaction_id' => $transactionId !== '',
                ]);

                return ['status' => 'error', 'delivery_content' => null];
            }

            $body = $response->json();
            $data = is_array($body) && is_array($body['data'] ?? null) ? $body['data'] : (is_array($body) ? $body : []);

            return [
                'status' => strtolower((string) ($data['status'] ?? 'unknown')),
                'delivery_content' => $this->extractDeliveryContent($data),
            ];
        } catch (\Throwable $e) {
            Log::warning('[Supplier API] Order status lookup raised an exception.', [
                'has_transaction_id' => $transactionId !== '',
                'error' => $e->getMessage(),
            ]);

            return ['status' => 'error', 'delivery_content' => null];
        }
    }

    /** Check the supplier wallet balance. */
    public function getBalance(): float
    {
        if ($this->apiKey === '') {
            return -1;
        }

        try {
            $response = Http::withOptions(['verify' => config('services.tls.ca_bundle') ?: true])
                ->withHeaders($this->headers())
                ->timeout(10)
                ->get("{$this->baseUrl}/profile");

            if (!$response->successful()) {
                return -1;
            }

            $body = $response->json();
            $data = is_array($body) && is_array($body['data'] ?? null) ? $body['data'] : (is_array($body) ? $body : []);

            return (float) ($data['money'] ?? $data['balance'] ?? -1);
        } catch (\Throwable $e) {
            Log::warning('[Supplier API] Balance lookup failed.', ['error' => $e->getMessage()]);
            return -1;
        }
    }

    private function extractDeliveryContent(array $data): ?string
    {
        $items = $data['items'] ?? null;
        if (is_array($items)) {
            $accounts = [];
            foreach ($items as $item) {
                if (!is_array($item)) {
                    continue;
                }

                $account = $item['account'] ?? $item['data'] ?? null;
                if (is_string($account) && trim($account) !== '') {
                    $accounts[] = trim($account);
                }
            }

            if ($accounts !== []) {
                return implode("\n", $accounts);
            }
        }

        foreach (['account', 'delivery_content', 'data'] as $field) {
            if (is_string($data[$field] ?? null) && trim($data[$field]) !== '') {
                return trim($data[$field]);
            }
        }

        return null;
    }

    private function extractError(array $data): ?string
    {
        $error = $data['error'] ?? $data['message'] ?? null;
        if (is_array($error)) {
            $error = $error['message'] ?? $error['code'] ?? null;
        }

        return is_string($error) && trim($error) !== '' ? trim($error) : null;
    }
}
