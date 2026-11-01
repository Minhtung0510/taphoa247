<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('order_items', 'fulfillment_state')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->string('fulfillment_state', 32)->nullable()->index();
            });
        }

        DB::table('order_items')
            ->whereNotNull('delivered_credentials')
            ->update(['fulfillment_state' => 'delivered']);

        DB::table('order_items')
            ->where(function ($query) {
                $query->whereNotNull('digishop_order_id')
                    ->orWhereNotNull('shopmmo_order_id');
            })
            ->whereNull('delivered_credentials')
            ->update(['fulfillment_state' => 'processing']);

        // Old paid supplier items without a recorded supplier order are ambiguous;
        // never auto-create them again during rollout.
        DB::table('order_items')
            ->whereNull('delivered_credentials')
            ->whereNull('fulfillment_state')
            ->whereIn('order_id', DB::table('orders')->select('id')->whereIn('status', ['paid', 'processing']))
            ->whereIn('product_id', DB::table('products')->select('id')->whereNotNull('digishop_product_id'))
            ->update(['fulfillment_state' => 'needs_review']);

        DB::table('order_items')
            ->whereNull('delivered_credentials')
            ->whereNull('fulfillment_state')
            ->whereIn('order_id', DB::table('orders')->select('id')->whereIn('status', ['paid', 'processing']))
            ->whereIn('product_id', DB::table('products')->select('id')->whereNotNull('shopmmo_product_id'))
            ->update(['fulfillment_state' => 'needs_review']);
    }

    public function down(): void
    {
        if (Schema::hasColumn('order_items', 'fulfillment_state')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropIndex(['fulfillment_state']);
                $table->dropColumn('fulfillment_state');
            });
        }
    }
};
