<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $products = [
            'muse-ai-1b-token' => [
                'short_description' => 'Muse AI 1 tỷ Token, không 2FA; full mail get code, đã Redeem. Bảo hành 1 đổi 1 trong 1 giờ đầu theo điều kiện.',
                'details_markdown' => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 1 tỷ Token, NO 2FA.\n- Bảo hành 1 đổi 1 trong 1 tiếng đầu nếu account Login bị Banned hoặc Chặn Tạo Video.\n- Giao Full Mail Get Code login tại fviainboxes.com | Đã sử dụng Redeem a code.\n- Tài khoản chưa dính IP Việt Nam.\n",
            ],
            'muse-ai-10-billion-tokens' => [
                'short_description' => 'Muse AI có sẵn 10 tỷ Token, full thông tin login đã test. Bảo hành 1 đổi 1 trong 1 giờ đầu theo điều kiện.',
                'details_markdown' => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 10 tỷ Token.\n- Bảo hành 1 đổi 1 trong 1 tiếng đầu nếu account Login bị Banned hoặc Chặn Tạo Video.\n- Mail Fvia Full Thông Tin Login / Đã Test tạo video ok.\n- Hàng chưa dính IP Việt Nam.\n",
            ],
            'muse-ai-30-billion-tokens' => [
                'short_description' => 'Muse AI có sẵn 30 tỷ Token, full thông tin login đã test. Bảo hành 1 đổi 1 trong 1 giờ đầu theo điều kiện.',
                'details_markdown' => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 30 tỷ Token.\n- Bảo hành 1 đổi 1 trong 1 tiếng đầu nếu account Login bị Banned hoặc Chặn Tạo Video.\n- Mail Fvia Full Thông Tin Login / Đã Test tạo video ok.\n- Hàng chưa dính IP Việt Nam.\n",
            ],
        ];

        foreach ($products as $slug => $copy) {
            $copy['updated_at'] = now();
            DB::table('products')->where('slug', $slug)->update($copy);
        }
    }

    public function down(): void
    {
        DB::table('products')->where('slug', 'muse-ai-1b-token')->update([
            'short_description' => 'Tài khoản Muse AI 1 tỷ Token, không 2FA. Bảo hành 1 đổi 1 trong 1 giờ đầu theo điều kiện.',
            'details_markdown' => "## Thông tin sản phẩm\n- Muse AI có sẵn 1 tỷ Token, không yêu cầu 2FA.\n- Bàn giao full mail để nhận mã đăng nhập. Tài khoản đã sử dụng Redeem a code và chưa sử dụng IP Việt Nam.\n- Liên hệ CSKH nếu cần hướng dẫn đăng nhập.\n\n**Bảo hành:** 1 đổi 1 trong 1 giờ đầu nếu tài khoản bị banned khi đăng nhập hoặc bị chặn tạo video.",
        ]);
        DB::table('products')->where('slug', 'muse-ai-10-billion-tokens')->update([
            'short_description' => 'Tài khoản Muse AI có sẵn 10 tỷ Token. Bảo hành 1 giờ.',
            'details_markdown' => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 10 tỷ Token.\n- Thông tin đăng nhập đã được kiểm tra trước khi bàn giao.\n\n**Bảo hành:** 1 giờ theo chính sách cửa hàng.",
        ]);
        DB::table('products')->where('slug', 'muse-ai-30-billion-tokens')->update([
            'short_description' => 'Tài khoản Muse AI có sẵn 30 tỷ Token. Bảo hành 1 giờ.',
            'details_markdown' => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 30 tỷ Token.\n- Thông tin đăng nhập đã được kiểm tra trước khi bàn giao.\n\n**Bảo hành:** 1 giờ theo chính sách cửa hàng.",
        ]);
    }
};
