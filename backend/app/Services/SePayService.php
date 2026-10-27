<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
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

        // SePay QR Image API tự động tương thích 100% app ngân hàng Việt Nam
        return "https://qr.sepay.vn/img?bank={$bank}&acc={$acc}&template=compact&amount={$amount}&des={$cleanMemo}";
    }

    /**
     * Kéo danh sách biến động số dư từ SePay qua API Polling (Cách 1 - Không cần Domain)
     * Endpoint: GET https://my.sepay.vn/userapi/transactions/list
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

        $url = 'https://my.sepay.vn/userapi/transactions/list?limit=25';
        if (!empty($this->accountNo)) {
            $url .= '&account_number=' . urlencode($this->accountNo);
        }

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'Authorization' => 'Apikey ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->get($url);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('[SePay] Lỗi gọi API giao dịch: ' . $response->status() . ' - ' . $response->body());
        } catch (\Throwable $e) {
            Log::error('[SePay] Ngoại lệ khi kết nối SePay: ' . $e->getMessage());
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
                'transactionID' => 'TEST-' . uniqid(),
                'creditAmount' => $order->total_amount,
                'description' => $order->memo,
                'transactionDate' => now()->toDateTimeString(),
            ];
        }

        $data = $history ?? $this->fetchHistory();
        if (!$data || empty($data['transactions']) || !is_array($data['transactions'])) {
            return null;
        }

        // Cú pháp memo chuẩn: ACC-XXXXXXXX
        $code = strtoupper(str_replace('ACC-', '', $order->order_code));
        $fullMemo = strtoupper($order->memo);
        $neededAmount = (int) $order->total_amount;

        foreach ($data['transactions'] as $tx) {
            $desc = strtoupper((string) ($tx['transaction_content'] ?? ''));
            $descClean = str_replace([' ', '-', '_', '.'], '', $desc);
            $targetClean = str_replace([' ', '-', '_', '.'], '', $fullMemo);
            $codeClean = str_replace([' ', '-', '_', '.'], '', $code);

            // Khớp nội dung đơn hàng (toàn bộ memo hoặc mã 8 ký tự)
            if (str_contains($descClean, $targetClean) || str_contains($descClean, $codeClean)) {
                $rawCredit = str_replace([',', '.'], '', (string) ($tx['amount_in'] ?? 0));
                $credit = (int) $rawCredit;

                if ($credit >= $neededAmount) {
                    return [
                        'transactionID' => (string) ($tx['reference_number'] ?: ($tx['id'] ?? uniqid())),
                        'creditAmount' => $credit,
                        'description' => $tx['transaction_content'] ?? '',
                        'transactionDate' => $tx['transaction_date'] ?? now()->toDateTimeString(),
                    ];
                }
            }
        }

        return null;
    }
}
