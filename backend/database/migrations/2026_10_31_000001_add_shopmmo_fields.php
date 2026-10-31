<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Thêm field shopmmo_product_id vào bảng products
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'shopmmo_product_id')) {
                // ID sản phẩm trên ShopMMO (kiểu int)
                $table->unsignedInteger('shopmmo_product_id')->nullable()->after('digishop_product_id');
            }
            if (!Schema::hasColumn('products', 'delivery_format')) {
                // Format bàn giao: email_pass | key_loader | token | raw_text
                $table->string('delivery_format', 32)->default('raw_text')->after('shopmmo_product_id');
            }
        });

        // Thêm field shopmmo_order_id vào order_items để trace lại đơn bên ShopMMO
        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('order_items', 'shopmmo_order_id')) {
                $table->string('shopmmo_order_id', 64)->nullable()->after('digishop_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('products', 'shopmmo_product_id')) $columns[] = 'shopmmo_product_id';
            if (Schema::hasColumn('products', 'delivery_format'))     $columns[] = 'delivery_format';
            if (!empty($columns)) $table->dropColumn($columns);
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (Schema::hasColumn('order_items', 'shopmmo_order_id')) {
                $table->dropColumn('shopmmo_order_id');
            }
        });
    }
};
