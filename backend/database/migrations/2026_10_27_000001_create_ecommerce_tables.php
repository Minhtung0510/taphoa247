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
        // 1. Categories
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Products
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('account_type')->unique(); // e.g. valo_unranked, cs2_prime
            $table->unsignedBigInteger('price'); // VND
            $table->integer('warranty_hours')->default(2); // 2h or 5h
            $table->boolean('is_auto_warranty')->default(true); // False for cs2_prime and pubg_plus
            $table->boolean('is_off_mode')->default(false);
            $table->text('short_description')->nullable();
            $table->longText('details_markdown')->nullable();
            $table->json('badges')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // 3. Orders
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code', 32)->unique(); // ACC-XXXXXXXX
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_name')->default('Khách Hàng');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();
            $table->string('memo', 64)->unique(); // ACC-XXXXXXXX
            $table->unsignedBigInteger('total_amount'); // VND
            $table->string('status', 32)->default('pending'); // pending, paid, processing, completed, timeout, cancelled
            $table->string('payment_gateway', 32)->default('web2m');
            $table->text('qr_url')->nullable();
            $table->string('delivery_format', 32)->default('inline');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'expires_at']);
        });

        // 4. Account Stock
        Schema::create('account_stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('account_type', 64)->index();
            $table->longText('credentials'); // Encrypted via Crypt::encryptString
            $table->string('credentials_hash', 64)->unique(); // SHA-256 for duplicate check
            $table->string('status', 32)->default('available')->index(); // available, reserved, sold, replaced, dead
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->timestamp('reserved_at')->nullable();
            $table->timestamp('sold_at')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'status']);
        });

        // 5. Order Items
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('account_stock_id')->nullable()->constrained('account_stock')->nullOnDelete();
            $table->integer('quantity')->default(1);
            $table->unsignedBigInteger('unit_price');
            $table->unsignedBigInteger('subtotal');
            $table->integer('position')->default(0); // 0-indexed position within order
            $table->longText('delivered_credentials')->nullable(); // Encrypted snapshot
            $table->integer('warranty_duration_hours')->default(2);
            $table->timestamp('warranty_expires_at')->nullable();
            $table->integer('replacement_count')->default(0); // Max 1
            $table->timestamps();

            $table->index(['order_id', 'position']);
        });

        // 6. Payments
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('transaction_code', 128)->unique();
            $table->unsignedBigInteger('amount');
            $table->string('bank_code', 32)->default('MBB');
            $table->string('account_no', 64)->nullable();
            $table->string('memo_received', 128)->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamp('transaction_time')->nullable();
            $table->timestamps();
        });

        // 7. Warranty Claims
        Schema::create('warranty_claims', function (Blueprint $table) {
            $table->id();
            $table->string('claim_code', 64)->unique();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('state', 32)->default('pending')->index(); // pending, approved, rejected, waiting_stock, waiting_admin
            $table->integer('attempt')->default(1);
            $table->text('buyer_note')->nullable();
            $table->text('admin_note')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        // 8. Claim Items
        Schema::create('claim_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warranty_claim_id')->constrained('warranty_claims')->cascadeOnDelete();
            $table->foreignId('order_item_id')->constrained('order_items')->cascadeOnDelete();
            $table->string('evidence_path');
            $table->string('evidence_hash', 64)->index(); // SHA-256
            $table->string('evidence_mime', 64);
            $table->foreignId('replacement_stock_id')->nullable()->constrained('account_stock')->nullOnDelete();
            $table->text('error_description')->nullable();
            $table->timestamps();
        });

        // 9. Audit Logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 64)->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();
        });

        // 10. Settings
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->longText('value')->nullable();
            $table->string('type', 32)->default('string');
            $table->timestamps();
        });

        // Update Users table to include role
        if (!Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role', 32)->default('customer')->after('email');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claim_items');
        Schema::dropIfExists('warranty_claims');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('account_stock');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('settings');

        if (Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }
};
