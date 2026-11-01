<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $oneBillionDetails = "## Thông tin sản phẩm\n- Muse AI có sẵn 1 tỷ Token, không yêu cầu 2FA.\n- Bàn giao full mail để nhận mã đăng nhập. Tài khoản đã sử dụng Redeem a code và chưa sử dụng IP Việt Nam.\n- Liên hệ CSKH nếu cần hướng dẫn đăng nhập.\n\n**Bảo hành:** 1 đổi 1 trong 1 giờ đầu nếu tài khoản bị banned khi đăng nhập hoặc bị chặn tạo video.";

        $updates = [
            'muse-ai-1b-token' => [
                'short_description' => 'Tài khoản Muse AI 1 tỷ Token, không 2FA. Bảo hành 1 đổi 1 trong 1 giờ đầu theo điều kiện.',
                'details_markdown' => $oneBillionDetails,
                'badges' => ['Token 1 Tỷ', 'Không 2FA', 'Bảo Hành 1h'],
            ],
            'muse-ai-10-billion-tokens' => [
                'short_description' => 'Tài khoản Muse AI có sẵn 10 tỷ Token. Bảo hành 1 giờ.',
                'details_markdown' => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 10 tỷ Token.\n- Thông tin đăng nhập đã được kiểm tra trước khi bàn giao.\n\n**Bảo hành:** 1 giờ theo chính sách cửa hàng.",
                'badges' => ['Token 10 Tỷ', 'Bàn Giao Tài Khoản', 'Bảo Hành 1h'],
            ],
            'muse-ai-30-billion-tokens' => [
                'short_description' => 'Tài khoản Muse AI có sẵn 30 tỷ Token. Bảo hành 1 giờ.',
                'details_markdown' => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 30 tỷ Token.\n- Thông tin đăng nhập đã được kiểm tra trước khi bàn giao.\n\n**Bảo hành:** 1 giờ theo chính sách cửa hàng.",
                'badges' => ['Token 30 Tỷ', 'Bàn Giao Tài Khoản', 'Bảo Hành 1h'],
            ],
        ];

        foreach ($updates as $slug => $values) {
            $values['warranty_hours'] = 1;
            $values['badges'] = json_encode($values['badges'], JSON_UNESCAPED_UNICODE);
            $values['updated_at'] = now();
            DB::table('products')->where('slug', $slug)->update($values);
        }
    }

    public function down(): void
    {
        $old = [
            'muse-ai-1b-token' => [
                'warranty_hours' => 24,
                'short_description' => 'Tài khoản Muse AI 1 tỷ Token, không 2FA; bàn giao thông tin đăng nhập. Bảo hành 24 giờ.',
                'details_markdown' => "## Thông tin sản phẩm\n- Muse AI có sẵn 1 tỷ Token.\n- Không yêu cầu 2FA.\n- Bàn giao thông tin đăng nhập.\n\n**Bảo hành:** 24 giờ theo chính sách cửa hàng.",
                'badges' => ['Token 1 Tỷ', 'Không 2FA', 'Bảo Hành 24h'],
            ],
            'muse-ai-10-billion-tokens' => [
                'warranty_hours' => 24,
                'short_description' => 'Tài khoản Muse AI có sẵn 10 tỷ Token. Bảo hành 24 giờ.',
                'details_markdown' => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 10 tỷ Token.\n- Thông tin đăng nhập đã được kiểm tra trước khi bàn giao.\n\n**Bảo hành:** 24 giờ theo chính sách cửa hàng.",
                'badges' => ['Token 10 Tỷ', 'Bàn Giao Tài Khoản', 'Bảo Hành 24h'],
            ],
            'muse-ai-30-billion-tokens' => [
                'warranty_hours' => 24,
                'short_description' => 'Tài khoản Muse AI có sẵn 30 tỷ Token. Bảo hành 24 giờ.',
                'details_markdown' => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 30 tỷ Token.\n- Thông tin đăng nhập đã được kiểm tra trước khi bàn giao.\n\n**Bảo hành:** 24 giờ theo chính sách cửa hàng.",
                'badges' => ['Token 30 Tỷ', 'Bàn Giao Tài Khoản', 'Bảo Hành 24h'],
            ],
        ];

        foreach ($old as $slug => $values) {
            $values['badges'] = json_encode($values['badges'], JSON_UNESCAPED_UNICODE);
            $values['updated_at'] = now();
            DB::table('products')->where('slug', $slug)->update($values);
        }
    }
};
