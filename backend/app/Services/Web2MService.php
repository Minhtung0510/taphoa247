<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class Web2MService implements PaymentGatewayInterface
{
    protected string $bankCode;
    protected string $accountNo;
    protected string $accountName;
    protected ?string $password;
    protected ?string $token;
    protected bool $testMode;

    public function __construct()
    {
        $this->bankCode = strtoupper(config('services.web2m.bank_code', env('BANK_CODE', 'TPB')));
        $this->accountNo = config('services.web2m.account_no', env('ACCOUNT_NO', ''));
        $this->accountName = config('services.web2m.account_name', env('ACCOUNT_NAME', ''));
        $this->password = config('services.web2m.password', env('WEB2M_PASSWORD'));
        $this->token = config('services.web2m.token', env('WEB2M_TOKEN'));
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

    public function generateQrUrl(int $amount, string $memo): string
    {
        $bank = strtoupper($this->bankCode ?: 'TPB');
        // Chuẩn hóa mã ngân hàng cho VietQR (TPBANK -> TPB)
        if ($bank === 'TPBANK') {
            $bank = 'TPB';
        }
        $acc = $this->accountNo ?: '0000000000';
        $nameEnc = rawurlencode($this->accountName ?: 'DTFF SHOP');
        $cleanMemo = rawurlencode($memo);

        return "https://apiqr.web2m.com/api/generate/{$bank}/{$acc}/{$nameEnc}?amount={$amount}&memo={$cleanMemo}";
    }

    public function fetchHistory(): ?array
    {
        if ($this->testMode) {
            return ['status' => true, 'data' => []];
        }

        if (!$this->password || !$this->accountNo || !$this->token) {
            Log::warning('[Web2M] Thiếu thông tin xác thực WEB2M_PASSWORD, ACCOUNT_NO hoặc WEB2M_TOKEN.');
            return null;
        }

        $bank = strtolower($this->bankCode);
        $endpoint = match ($bank) {
            'tpb', 'tpbank' => 'historyapitpbank',
            'vcb', 'vietcombank' => 'historyapivcb',
            'acb' => 'historyapiacb',
            'icb', 'ctg', 'vietinbank' => 'historyapivietinbank',
            default => 'historyapimb',
        };

        $url = "https://api.web2m.com/{$endpoint}/{$this->password}/{$this->accountNo}/{$this->token}";

        try {
            $response = Http::timeout(15)->get($url);
            if ($response->successful()) {
                return $response->json();
            }

            // Fallback dự phòng cho TPBank nếu Web2M cấu hình historyapitpb
            if (($bank === 'tpb' || $bank === 'tpbank') && $response->status() === 404) {
                $fallbackUrl = "https://api.web2m.com/historyapitpb/{$this->password}/{$this->accountNo}/{$this->token}";
                $fallbackRes = Http::timeout(15)->get($fallbackUrl);
                if ($fallbackRes->successful()) {
                    return $fallbackRes->json();
                }
            }

            Log::error("[Web2M] Lỗi gọi API lịch sử ({$endpoint}): " . $response->status());
        } catch (\Throwable $e) {
            Log::error('[Web2M] Ngoại lệ khi gọi Web2M: ' . $e->getMessage());
        }

        return null;
    }

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
        if (!$data || empty($data['status']) || empty($data['data'])) {
            return null;
        }

        // Cú pháp memo chuẩn: ACC-XXXXXXXX
        $code = strtoupper(str_replace('ACC-', '', $order->order_code));
        $fullMemo = strtoupper($order->memo);
        $neededAmount = (int) $order->total_amount;

        foreach ($data['data'] as $tx) {
            $desc = strtoupper(($tx['description'] ?? '') . ' ' . ($tx['addDescription'] ?? ''));
            $descClean = str_replace([' ', '-', '_'], '', $desc);
            $targetClean = str_replace([' ', '-', '_'], '', $fullMemo);
            $codeClean = str_replace([' ', '-', '_'], '', $code);

            if (str_contains($descClean, $targetClean) || str_contains($descClean, $codeClean)) {
                $rawCredit = str_replace([',', '.'], '', (string) ($tx['creditAmount'] ?? 0));
                $credit = (int) $rawCredit;

                if ($credit >= $neededAmount) {
                    return $tx;
                }
            }
        }

        return null;
    }
}
