<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SePayService implements PaymentGatewayInterface
{
    protected string $apiKey;
    protected string $bankCode;
    protected string $accountNo;
    protected string $accountName;
    protected bool $testMode;

    public function __construct()
    {
        $this->apiKey = (string) config('services.sepay.api_key', env('SEPAY_API_KEY', ''));
        $this->bankCode = strtoupper((string) config('services.sepay.bank_code', env('BANK_CODE', 'TPB')));
        $this->accountNo = (string) config('services.sepay.account_no', env('ACCOUNT_NO', ''));
        $this->accountName = (string) config('services.sepay.account_name', env('ACCOUNT_NAME', ''));
        $this->testMode = filter_var(env('PAYMENT_TEST_MODE', false), FILTER_VALIDATE_BOOLEAN);
    }

    public function isTestMode(): bool
    {
        return $this->testMode;
    }

    public function getBankCode(): string
    {
        return $this->bankCode;
    }

    /**
     * Sinh link ảnh mã VietQR thanh toán SePay / VietQR Napas
     */
    public function generateQrUrl(int $amount, string $memo): string
    {
        $bank = strtoupper($this->bankCode ?: 'TPB');
        $acc = $this->accountNo ?: '0000000000';
        $cleanMemo = rawurlencode($memo);

        return "https://qr.sepay.vn/img?bank={$bank}&acc={$acc}&template=compact&amount={$amount}&des={$cleanMemo}";
    }

    /**
     * Kéo danh sách biến động số dư từ SePay qua API Polling (Có Cache 5s chống DoS/Rate Limit)
     */
    public function fetchHistory(): ?array
    {
        if ($this->testMode) {
            return ['status' => 200, 'transactions' => []];
        }

        if (empty($this->apiKey)) {
            Log::warning('[SePay] Chưa cấu hình SEPAY_API_KEY trong file .env.');
            return null;
        }

        $cacheKey = 'sepay_history_cache_' . md5($this->accountNo);
        $cached = Cache::get($cacheKey);
        if ($cached && is_array($cached)) {
            return $cached;
        }

        $endpoints = [
            'https://userapi.sepay.vn/v2/transactions?per_page=25' . (!empty($this->accountNo) ? '&account_number=' . urlencode($this->accountNo) : ''),
            'https://my.sepay.vn/userapi/transactions/list?limit=25' . (!empty($this->accountNo) ? '&account_number=' . urlencode($this->accountNo) : ''),
        ];

        foreach ($endpoints as $url) {
            try {
                $client = Http::timeout(8);
                // Bỏ qua SSL verification trên môi trường Windows dev hoặc non-production để tránh lỗi cURL 60 (thiếu cacert.pem)
                if (!app()->environment('production') || DIRECTORY_SEPARATOR === '\\') {
                    $client = $client->withoutVerifying();
                }

                $response = $client->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])->get($url);

                if ($response->successful()) {
                    $json = $response->json();
                    Cache::put($cacheKey, $json, 3); // Cache 3 giây
                    return $json;
                }

                if ($response->status() === 401) {
                    Log::warning('[SePay] API Token không hợp lệ hoặc chưa cấp quyền (401 Unauthorized).');
                    return null;
                }
            } catch (\Throwable $e) {
                // Tự động retry với withoutVerifying nếu gặp cURL error 60 (SSL Certificate issue)
                if (str_contains($e->getMessage(), 'cURL error 60')) {
                    try {
                        $fallbackRes = Http::withoutVerifying()
                            ->timeout(8)
                            ->withHeaders([
                                'Authorization' => 'Bearer ' . $this->apiKey,
                                'Content-Type' => 'application/json',
                            ])->get($url);

                        if ($fallbackRes->successful()) {
                            $json = $fallbackRes->json();
                            Cache::put($cacheKey, $json, 3);
                            return $json;
                        }
                    } catch (\Throwable $inner) {
                        Log::error('[SePay] Ngoại lệ fallback: ' . $inner->getMessage());
                    }
                }
                Log::error('[SePay] Ngoại lệ khi kết nối SePay: ' . $e->getMessage());
            }
        }

        return null;
    }

    /**
     * Tìm giao dịch khớp với đơn hàng theo Memo (ACC-XXXXXXXX) và Số tiền
     */
    public function findMatchingTransaction(Order $order, ?array $history = null): ?array
    {
        if ($this->testMode && $history === null) {
            return [
                'transactionID' => 'TEST-' . $order->order_code . '-' . time(),
                'creditAmount' => $order->total_amount,
                'description' => $order->memo,
                'transactionDate' => now()->toDateTimeString(),
            ];
        }

        $data = $history ?? $this->fetchHistory();
        if (!$data) {
            return null;
        }

        $transactions = $data['transactions'] ?? $data['data']['transactions'] ?? $data['data'] ?? [];
        if (isset($transactions['transactions']) && is_array($transactions['transactions'])) {
            $transactions = $transactions['transactions'];
        }
        if (!is_array($transactions) || empty($transactions)) {
            return null;
        }

        $orderCode = strtoupper((string) $order->order_code);
        $code = strtoupper(str_replace('ACC-', '', $orderCode));
        $fullMemo = strtoupper((string) $order->memo);
        $neededAmount = (int) $order->total_amount;

        foreach ($transactions as $tx) {
            $desc = strtoupper((string) ($tx['transaction_content'] ?? $tx['content'] ?? $tx['description'] ?? ''));
            $descClean = str_replace([' ', '-', '_', '.'], '', $desc);
            $targetClean = str_replace([' ', '-', '_', '.'], '', $fullMemo);
            $codeClean = str_replace([' ', '-', '_', '.'], '', $code);
            $orderCodeClean = str_replace([' ', '-', '_', '.'], '', $orderCode);

            $matched = false;
            // 1. Khớp theo full memo (VD: ACC-SWQNOSKX hoặc custom memo)
            if (!empty($targetClean) && strlen($targetClean) >= 6 && str_contains($descClean, $targetClean)) {
                $matched = true;
            // 2. Khớp theo mã đơn đầy đủ dạng ACCSWQNOSKX (ngân hàng bỏ dấu gạch)
            } elseif (!empty($orderCodeClean) && strlen($orderCodeClean) >= 6 && str_contains($descClean, $orderCodeClean)) {
                $matched = true;
            // 3. Khớp theo mã ngắn không có tiền tố ACC (VD: SWQNOSKX)
            } elseif (!empty($codeClean) && strlen($codeClean) >= 6 && str_contains($descClean, $codeClean)) {
                $matched = true;
            // 4. Khớp theo tiền tố 8 ký tự khi ngân hàng cắt ngắn bớt ký tự cuối (VD: ACCSWQNO..)
            } elseif (strlen($orderCodeClean) >= 8 && str_contains($descClean, substr($orderCodeClean, 0, 8))) {
                $matched = true;
            }

            if ($matched) {
                $rawCredit = (string) ($tx['amount_in'] ?? $tx['amount'] ?? 0);
                $credit = (int) round((float) str_replace(',', '', $rawCredit));

                if ($credit >= $neededAmount) {
                    $rawTx = $tx['reference_number'] ?? $tx['code'] ?? ($tx['id'] ?? null);
                    if (!empty($rawTx)) {
                        $txId = (string) $rawTx;
                    } else {
                        $txDate = (string) ($tx['transaction_date'] ?? $tx['created_at'] ?? now()->toDateString());
                        $txId = 'TX-' . substr(hash('sha256', "{$credit}|{$desc}|{$txDate}"), 0, 16);
                    }

                    return [
                        'transactionID' => $txId,
                        'creditAmount' => $credit,
                        'description' => $desc,
                        'transactionDate' => $tx['transaction_date'] ?? $tx['created_at'] ?? now()->toDateTimeString(),
                    ];
                }
            }
        }

        return null;
    }
}
