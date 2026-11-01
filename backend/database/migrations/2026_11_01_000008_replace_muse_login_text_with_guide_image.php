<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('products')->where('slug', 'muse-ai-1b-token')->update([
            'details_markdown' => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 1 tỷ Token, NO 2FA.\n- Bảo hành 1 đổi 1 trong 1 tiếng đầu nếu account Login bị Banned hoặc Chặn Tạo Video.\n\n## Hướng dẫn đăng nhập\n![Hướng dẫn đăng nhập Muse AI](/images/products/muse-ai-login-guide.png)\n",
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('products')->where('slug', 'muse-ai-1b-token')->update([
            'details_markdown' => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 1 tỷ Token, NO 2FA.\n- Bảo hành 1 đổi 1 trong 1 tiếng đầu nếu account Login bị Banned hoặc Chặn Tạo Video.\n- Giao Full Mail Get Code login tại fviainboxes.com | Đã sử dụng Redeem a code.\n- Tài khoản chưa dính IP Việt Nam.\n- [Xem video hướng dẫn login](https://t.me/cloneus/11).\n",
            'updated_at' => now(),
        ]);
    }
};
