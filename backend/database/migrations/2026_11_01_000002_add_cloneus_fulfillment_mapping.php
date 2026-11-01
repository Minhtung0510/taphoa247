<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'cloneus_product_id')) {
                $table->string('cloneus_product_id', 64)->nullable();
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('order_items', 'cloneus_order_id')) {
                $table->string('cloneus_order_id', 64)->nullable();
            }
            if (!Schema::hasColumn('order_items', 'cloneus_status')) {
                $table->string('cloneus_status', 32)->nullable();
            }
        });

        if (Schema::hasTable('products')) {
            DB::table('products')->where('slug', 'muse-ai-1b-token')->update([
                'cloneus_product_id' => '15',
                'digishop_product_id' => null,
                'cost_price' => 2000,
                'short_description' => 'Tài khoản Muse AI 1 tỷ Token, không 2FA; bàn giao thông tin đăng nhập. Bảo hành 24 giờ.',
                'badges' => json_encode(['Token 1 Tỷ', 'Không 2FA', 'Bảo Hành 24h'], JSON_UNESCAPED_UNICODE),
            ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products')) {
            DB::table('products')->where('slug', 'muse-ai-1b-token')->update([
                'cloneus_product_id' => null,
                'digishop_product_id' => '61d5518f-a221-403e-9d48-9e285ee37ffa',
                'cost_price' => 25000,
                'short_description' => 'Muse AI 1B Token – bàn giao qua email. Bảo hành 24 giờ.',
                'badges' => json_encode(['Token 1 Tỷ', 'Bàn Giao Email', 'Bảo Hành 24h'], JSON_UNESCAPED_UNICODE),
            ]);
        }

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'cloneus_product_id')) {
                $table->dropColumn('cloneus_product_id');
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('order_items', 'cloneus_order_id')) $columns[] = 'cloneus_order_id';
            if (Schema::hasColumn('order_items', 'cloneus_status')) $columns[] = 'cloneus_status';
            if ($columns) $table->dropColumn($columns);
        });
    }
};
