<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $categoryId = DB::table('categories')->where('slug', 'muse-ai')->value('id');
        if (!$categoryId) return;

        $products = [
            [
                'name' => 'Tài khoản Muse AI | Có Sẵn 1 Tỷ Token | NO 2FA',
                'slug' => 'muse-ai-1b-token',
                'account_type' => 'muse-ai-1b-token',
                'cloneus_product_id' => '15',
                'price' => 29000,
                'cost_price' => 2000,
                'short_description' => 'Tài khoản Muse AI 1 tỷ Token, không 2FA; bàn giao thông tin đăng nhập. Bảo hành 24 giờ.',
                'details_markdown' => "## Thông tin sản phẩm\n- Muse AI có sẵn 1 tỷ Token.\n- Không yêu cầu 2FA.\n- Bàn giao thông tin đăng nhập.\n\n**Bảo hành:** 24 giờ theo chính sách cửa hàng.",
                'badges' => ['Token 1 Tỷ', 'Không 2FA', 'Bảo Hành 24h'],
                'sort_order' => 1,
            ],
            [
                'name' => 'Tài khoản Muse AI | Có Sẵn 10 Tỷ Token',
                'slug' => 'muse-ai-10-billion-tokens',
                'account_type' => 'muse-ai-10-billion-tokens',
                'cloneus_product_id' => '7',
                'price' => 39000,
                'cost_price' => 15000,
                'short_description' => 'Tài khoản Muse AI có sẵn 10 tỷ Token. Bảo hành 24 giờ.',
                'details_markdown' => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 10 tỷ Token.\n- Thông tin đăng nhập đã được kiểm tra trước khi bàn giao.\n\n**Bảo hành:** 24 giờ theo chính sách cửa hàng.",
                'badges' => ['Token 10 Tỷ', 'Bàn Giao Tài Khoản', 'Bảo Hành 24h'],
                'sort_order' => 2,
            ],
            [
                'name' => 'Tài khoản Muse AI | Có Sẵn 30 Tỷ Token',
                'slug' => 'muse-ai-30-billion-tokens',
                'account_type' => 'muse-ai-30-billion-tokens',
                'cloneus_product_id' => '14',
                'price' => 69000,
                'cost_price' => 40000,
                'short_description' => 'Tài khoản Muse AI có sẵn 30 tỷ Token. Bảo hành 24 giờ.',
                'details_markdown' => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 30 tỷ Token.\n- Thông tin đăng nhập đã được kiểm tra trước khi bàn giao.\n\n**Bảo hành:** 24 giờ theo chính sách cửa hàng.",
                'badges' => ['Token 30 Tỷ', 'Bàn Giao Tài Khoản', 'Bảo Hành 24h'],
                'sort_order' => 3,
            ],
        ];

        foreach ($products as $product) {
            $slug = $product['slug'];
            unset($product['slug']);
            $product['category_id'] = $categoryId;
            $product['is_auto_warranty'] = false;
            $product['is_off_mode'] = false;
            $product['warranty_hours'] = 24;
            $product['badges'] = json_encode($product['badges'], JSON_UNESCAPED_UNICODE);
            $product['digishop_product_id'] = null;
            $product['shopmmo_product_id'] = null;
            $product['is_active'] = true;
            $product['image_url'] = '/images/products/muse-logo.jpg';
            $product['delivery_format'] = 'raw_text';
            $product['updated_at'] = now();

            $existing = DB::table('products')->where('slug', $slug)->first();
            if ($existing) {
                DB::table('products')->where('id', $existing->id)->update($product);
            } else {
                $product['created_at'] = now();
                DB::table('products')->insert(['slug' => $slug, ...$product]);
            }
        }
    }

    public function down(): void
    {
        DB::table('products')->whereIn('slug', [
            'muse-ai-10-billion-tokens',
            'muse-ai-30-billion-tokens',
        ])->delete();

        DB::table('products')->where('slug', 'muse-ai-1b-token')->update([
            'name' => 'Muse AI – 1B Token (Bảo hành 24h)',
            'account_type' => 'digi_muse-ai-1b-token',
        ]);
    }
};
