<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tạo bảng mã giảm giá
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique()->index();
            $table->string('description')->nullable();
            $table->string('discount_type', 32)->default('percent'); // 'percent' hoặc 'fixed'
            $table->unsignedBigInteger('discount_value'); // 10 (%) hoặc số tiền VNĐ ví dụ 20000
            $table->unsignedBigInteger('max_discount_amount')->nullable(); // Mức giảm tối đa cho loại %
            $table->unsignedBigInteger('min_order_amount')->default(0); // Giá trị đơn hàng tối thiểu
            $table->integer('usage_limit')->nullable(); // Giới hạn tổng số lượt sử dụng
            $table->integer('used_count')->default(0); // Số lượt đã sử dụng
            $table->timestamp('expires_at')->nullable(); // Thời hạn hết hạn
            $table->boolean('is_active')->default(true)->index(); // Trạng thái kích hoạt
            $table->timestamps();
        });

        // 2. Bổ sung trường giảm giá vào bảng orders
        Schema::table('orders', function (Blueprint $table) {
            $table->string('coupon_code', 64)->nullable()->after('memo');
            $table->unsignedBigInteger('discount_amount')->default(0)->after('coupon_code');
            $table->unsignedBigInteger('original_amount')->nullable()->after('discount_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['coupon_code', 'discount_amount', 'original_amount']);
        });

        Schema::dropIfExists('coupons');
    }
};
