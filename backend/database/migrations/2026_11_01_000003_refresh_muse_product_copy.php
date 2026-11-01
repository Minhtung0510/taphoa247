<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('products')->where('slug', 'muse-ai-1b-token')->update([
            'short_description' => 'Tài khoản Muse AI 1 tỷ Token, không 2FA; bàn giao thông tin đăng nhập. Bảo hành 24 giờ.',
            'details_markdown' => "## Thông tin sản phẩm\n- Muse AI có sẵn 1 tỷ Token.\n- Không yêu cầu 2FA.\n- Bàn giao thông tin đăng nhập.\n\n**Bảo hành:** 24 giờ theo chính sách cửa hàng.",
        ]);
    }

    public function down(): void
    {
        DB::table('products')->where('slug', 'muse-ai-1b-token')->update([
            'short_description' => 'Muse AI 1B Token – bàn giao qua email. Bảo hành 24 giờ.',
            'details_markdown' => "Muse AI gói 1B Token, tài khoản bàn giao dưới dạng email.\n\n**Chế độ bảo hành:** Bảo hành 24 giờ\n\n**Định dạng bàn giao:** Email",
        ]);
    }
};
