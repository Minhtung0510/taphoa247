<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class CheckTlsCommand extends Command
{
    protected $signature = 'app:check-tls';
    protected $description = 'Kiểm tra chứng chỉ TLS/SSL CA bundle khi gọi HTTPS tới dịch vụ ngoài (Discord API)';

    public function handle(): int
    {
        $this->info('Đang kiểm tra kết nối TLS/SSL tới discord.com (verify = true)...');

        try {
            $response = Http::timeout(10)->get('https://discord.com');

            if ($response->successful() || $response->status() < 500) {
                $this->info("✅ OK: Chứng chỉ TLS/SSL hợp lệ. Kết nối HTTPS tới discord.com thành công (HTTP {$response->status()}).");
                return Command::SUCCESS;
            }

            $this->warn("⚠️ Phản hồi từ discord.com: HTTP {$response->status()}");
            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("❌ FAIL: Lỗi xác thực TLS/SSL khi kết nối tới discord.com.");
            $this->line("Chi tiết lỗi: " . $e->getMessage());
            $this->newLine();
            $this->warn("Hướng dẫn khắc phục trên Windows (cURL error 60):");
            $this->line("1. Tải file chứng chỉ CA từ: https://curl.se/ca/cacert.pem");
            $this->line("2. Lưu file vào: C:\\Program Files\\Common Files\\SSL\\cert.pem (hoặc thư mục PHP)");
            $this->line("3. Mở php.ini và cập nhật 2 dòng:");
            $this->line('   curl.cainfo = "C:\Program Files\Common Files\SSL\cert.pem"');
            $this->line('   openssl.cafile = "C:\Program Files\Common Files\SSL\cert.pem"');
            $this->line("4. Khởi động lại PHP server.");
            return Command::FAILURE;
        }
    }
}
