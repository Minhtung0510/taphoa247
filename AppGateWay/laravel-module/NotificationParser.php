<?php

namespace AppGateWay\LaravelModule;

use Illuminate\Support\Str;

final class ParsedNotification
{
    public function __construct(
        public bool $incoming,
        public ?int $amount,
        public array $codes,
        public ?string $bankRef,
    ) {}
}

class NotificationParser
{
    public function parse(string $raw): ParsedNotification
    {
        // 1. Chuẩn hóa: loại bỏ dấu tiếng Việt, in hoa
        $text = strtoupper(Str::ascii($raw));

        // 2. Chỉ chấp nhận "+<số> VND|D|Đ" (tiền vào)
        $amount = null;
        if (preg_match('/\+\s*([0-9][0-9.,]*)\s*(?:VND|VNĐ|D|Đ)\b/iu', $text, $m)) {
            $amount = $this->toInt($m[1]);
        }
        $incoming = $amount !== null && $amount > 0;

        // 3. Cắt bỏ phần "SO DU ..." để không bóc nhầm
        $body = preg_split('/\bSO DU\b|\bSD\b\s*:/', $text)[0] ?? $text;

        // 4. Bỏ mọi ký tự không phải chữ/số rồi tìm mã đơn ACCXXXXXXXX (8 ký tự)
        $flat = preg_replace('/[^A-Z0-9]/', '', $body);
        preg_match_all('/ACC[A-Z0-9]{8}/', $flat, $mm);
        $codes = array_values(array_unique($mm[0] ?? []));

        // 5. Mã giao dịch ngân hàng FT... (nếu có)
        $ref = null;
        if (preg_match('/\bFT\d{8,}\b/', $text, $r)) {
            $ref = $r[0];
        }

        return new ParsedNotification($incoming, $amount, $codes, $ref);
    }

    private function toInt(string $s): int
    {
        $s = rtrim($s, '.,');
        if (preg_match('/^(.*\d)[.,](\d{1,2})$/', $s, $m)) {
            $s = $m[1];
        }
        return (int) preg_replace('/\D/', '', $s);
    }

    public function mask(string $raw): string
    {
        $raw = preg_replace('/(số dư|so du|sd)\s*[:：]?\s*[\d.,]+\s*(vnd|vnđ|đ)?/iu', '$1: ***', $raw);
        return preg_replace_callback('/\d{8,}/', fn ($m) => str_repeat('*', strlen($m[0]) - 4) . substr($m[0], -4), $raw);
    }
}
