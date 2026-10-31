<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // UUID của sản phẩm trên Digishop Reseller API
            if (!Schema::hasColumn('products', 'digishop_product_id')) {
                $table->string('digishop_product_id', 64)->nullable()->after('account_type');
            }
            // Giá vốn (cost) từ Digishop — để tính lợi nhuận
            if (!Schema::hasColumn('products', 'cost_price')) {
                $table->unsignedBigInteger('cost_price')->default(0)->after('price');
            }
            // options đã tồn tại từ trước, không cần thêm
        });

        // Thêm cột digishop_order_id cho order_items để trace lại đơn bên Digishop
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('digishop_order_id', 64)->nullable()->after('replacement_count');
            $table->string('digishop_status', 32)->nullable()->after('digishop_order_id');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('products', 'digishop_product_id')) $columns[] = 'digishop_product_id';
            if (Schema::hasColumn('products', 'cost_price')) $columns[] = 'cost_price';
            if (!empty($columns)) $table->dropColumn($columns);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['digishop_order_id', 'digishop_status']);
        });
    }
};
