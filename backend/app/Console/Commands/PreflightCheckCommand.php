<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class PreflightCheckCommand extends Command
{
    protected $signature = 'app:preflight';
    protected $description = 'Kiểm tra bảo mật và điều kiện tiên quyết trước khi khởi động server production';

    public function handle(): int
    {
        $this->info('Đang kiểm tra điều kiện tiên quyết (Preflight Check)...');

        $errors = [];
        $warnings = [];

        // 1. APP_ENV
        $appEnv = config('app.env');
        if ($appEnv !== 'production') {
            $errors[] = "APP_ENV đang là '{$appEnv}'. Yêu cầu bắt buộc trên server thật: 'production'.";
        }

        // 2. APP_DEBUG
        if (config('app.debug') === true) {
            $errors[] = "APP_DEBUG đang là true. Tuyệt đối không bật debug trên server thật vì sẽ lộ stack trace và biến môi trường.";
        }

        // 3. APP_KEY
        $appKey = config('app.key');
        if (empty($appKey)) {
            $errors[] = "APP_KEY rỗng. Chạy lệnh: php artisan key:generate";
        }

        // 4. DEVICE_GATEWAY_SECRET (S2 & P3)
        $deviceSecret = (string) config('services.device_gateway.secret');
        if (empty($deviceSecret)) {
            $errors[] = "DEVICE_GATEWAY_SECRET rỗng. Cần đặt chuỗi bí mật ngẫu nhiên dài (ít nhất 32 ký tự).";
        } elseif ($deviceSecret === 'DTFF_SECRET_TEST_2026') {
            $errors[] = "DEVICE_GATEWAY_SECRET đang dùng giá trị mặc định đã lộ ('DTFF_SECRET_TEST_2026'). Hãy đổi thành chuỗi ngẫu nhiên dài.";
        } elseif (strlen($deviceSecret) < 32) {
            $errors[] = "DEVICE_GATEWAY_SECRET quá ngắn (hiện tại: " . strlen($deviceSecret) . " ký tự, yêu cầu tối thiểu 32 ký tự).";
        }

        // 5. APP_DEV_SECRET
        $appDevSecret = (string) config('services.app_dev_secret');
        if (!empty($appDevSecret)) {
            if ($appDevSecret === 'dtff_dev_secret_test') {
                $errors[] = "APP_DEV_SECRET đang dùng giá trị mặc định lộ trong repo ('dtff_dev_secret_test').";
            } elseif (strlen($appDevSecret) < 32) {
                $errors[] = "APP_DEV_SECRET quá ngắn (yêu cầu tối thiểu 32 ký tự ngẫu nhiên).";
            }
        }

        // 6. ACCOUNT_NO / ACCOUNT_NAME
        $accountNo = (string) config('services.sepay.account_no');
        $accountName = (string) config('services.sepay.account_name');
        if (empty($accountNo)) {
            $errors[] = "ACCOUNT_NO (Số tài khoản nhận tiền) đang để trống.";
        }
        if (empty($accountName)) {
            $errors[] = "ACCOUNT_NAME (Tên chủ tài khoản ngân hàng) đang để trống.";
        }

        // 7. CORS_ALLOWED_ORIGINS
        $corsOrigins = config('cors.allowed_origins', []);
        $corsOriginsStr = is_array($corsOrigins) ? implode(',', $corsOrigins) : (string) $corsOrigins;
        if (str_contains($corsOriginsStr, 'localhost') || str_contains($corsOriginsStr, '127.0.0.1')) {
            $errors[] = "CORS_ALLOWED_ORIGINS đang chứa 'localhost' hoặc '127.0.0.1'. Trên production chỉ cho phép domain thật.";
        }

        // 8. MAIL_MAILER
        $mailMailer = config('mail.default');
        if ($mailMailer === 'log') {
            $errors[] = "MAIL_MAILER đang cấu hình là 'log'. Khách hàng sẽ không nhận được OTP kích hoạt tài khoản qua email thật.";
        }

        // 9. DB_CONNECTION
        $dbConn = config('database.default');
        if ($dbConn === 'sqlite') {
            $errors[] = "DB_CONNECTION đang dùng 'sqlite'. SQLite không hỗ trợ lockForUpdate() chống bán trùng và dễ bị khóa database under load. Yêu cầu chuyển sang MySQL/PostgreSQL.";
        }

        // 10. PAYMENT_TEST_MODE
        if (filter_var(config('app.payment_test_mode') ?? env('PAYMENT_TEST_MODE', false), FILTER_VALIDATE_BOOLEAN) === true) {
            $errors[] = "PAYMENT_TEST_MODE đang là true. Cần chuyển về false trên production.";
        }

        // 11. ALLOW_MOCK_AUTH
        if (config('app.allow_mock_auth') === true) {
            $errors[] = "ALLOW_MOCK_AUTH đang là true. Cần chuyển về false trên production.";
        }

        // 12. ADMIN_INITIAL_PASSWORD
        $adminPass = (string) (config('app.admin_initial_password') ?: env('ADMIN_INITIAL_PASSWORD', ''));
        if (empty($adminPass)) {
            $warnings[] = "ADMIN_INITIAL_PASSWORD chưa được đặt. Seeder AdminUserSeeder sẽ thất bại khi chạy.";
        } elseif (strlen($adminPass) < 12) {
            $errors[] = "ADMIN_INITIAL_PASSWORD quá ngắn (" . strlen($adminPass) . " ký tự). Yêu cầu tối thiểu 12 ký tự.";
        }

        // 13. SESSION_SECURE_COOKIE (Cảnh báo khuyến nghị, hệ thống chủ yếu dùng Bearer token)
        if (!config('session.secure', false)) {
            $warnings[] = "SESSION_SECURE_COOKIE chưa bật (session.secure = false). Nếu sử dụng web session cookies trên HTTPS, hãy đặt SESSION_SECURE_COOKIE=true.";
        }

        // Báo cáo kết quả
        if (!empty($errors)) {
            $this->newLine();
            $this->error("❌ PREFLIGHT CHECK THẤT BẠI: Phát hiện " . count($errors) . " lỗi cấu hình nghiêm trọng:");
            foreach ($errors as $idx => $err) {
                $this->line("  " . ($idx + 1) . ". {$err}");
            }
            $this->newLine();
            $this->warn("Vui lòng cập nhật file .env trên server trước khi đưa vào vận hành.");
            return Command::FAILURE;
        }

        // Hiển thị cảnh báo (không chặn khởi động)
        if (!empty($warnings)) {
            $this->newLine();
            $this->warn("⚠️  Cảnh báo (" . count($warnings) . " điểm cần lưu ý):");
            foreach ($warnings as $idx => $w) {
                $this->line("  " . ($idx + 1) . ". {$w}");
            }
        }

        $this->newLine();
        $this->info("✅ PREFLIGHT CHECK HOÀN TẤT: Toàn bộ cấu hình hệ thống đã sẵn sàng cho Production!");
        return Command::SUCCESS;
    }
}
