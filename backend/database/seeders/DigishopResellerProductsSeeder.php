<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DigishopResellerProductsSeeder extends Seeder
{
    /**
     * Seed danh sách sản phẩm Digishop Reseller vào hệ thống DTFF Shop.
     *
     * Các sản phẩm này được fulfill tự động qua Digishop Reseller API
     * (reseller-create-order endpoint) sau khi khách hàng thanh toán thành công.
     *
     * Delivery format từ Digishop:
     *   - Cursor: "Key 1: JG-CF-XXXXXXXXXXXXXXXX"
     *   - SubAPI Card: "Key 1: <card_code>"
     *   - Antigravity [SLOT]: Hướng dẫn + token nâng cấp
     *   - Antigravity [ADMIN]: "Email | Password | 2FA_Key"
     *   - GoogleOne [SLOT]: Link chia sẻ Google Family
     *   - AgentKit/VideoViral: File ZIP + hướng dẫn
     *   - Muse AI: Email account
     */
    public function run(): void
    {
        // Đọc dữ liệu mô tả chi tiết từ Digishop Reseller API data
        $jsonPath = database_path('data/digishop_reseller_products.json');
        $apiMap = [];
        if (file_exists($jsonPath)) {
            $apiData = json_decode(file_get_contents($jsonPath), true);
            foreach ($apiData['products'] ?? [] as $ap) {
                if (!empty($ap['id'])) {
                    $apiMap[$ap['id']] = $ap;
                }
            }
        }

        // Tắt các danh mục không có sản phẩm resell/không có hàng trong kho
        DB::table('categories')
            ->whereIn('slug', ['tai-khoan-ai', 'canva', 'capcut', 'netflix', 'vpn', 'cs2', 'steam', 'pubg'])
            ->update([
                'is_active' => false,
                'updated_at' => now(),
            ]);

        // ─────────────────────────────────────────────────────────────
        // 1. Đảm bảo các Categories tồn tại và kích hoạt
        // ─────────────────────────────────────────────────────────────
        $categories = [
            [
                'name'        => 'Cursor AI',
                'slug'        => 'cursor-ai',
                'description' => 'Gói Cursor AI Pro Pool – tốc độ cao, không giới hạn theo ngày. Tích hợp qua Extension.',
                'icon'        => 'cursor',
                'sort_order'  => 10,
                'is_active'   => true,
            ],
            [
                'name'        => 'Gemini Antigravity',
                'slug'        => 'gemini-antigravity',
                'description' => 'Nâng cấp Gemini Antigravity Pro/Team/Ultra – chính chủ, bảo hành full.',
                'icon'        => 'sparkles',
                'sort_order'  => 20,
                'is_active'   => true,
            ],
            [
                'name'        => 'API Sub Credits',
                'slug'        => 'api-sub-credits',
                'description' => 'Thẻ nạp Card credits cho Claude, Codex, Deepseek, Grok. Không giới hạn thời gian.',
                'icon'        => 'cpu-chip',
                'sort_order'  => 30,
                'is_active'   => true,
            ],
            [
                'name'        => 'Google One 5TB',
                'slug'        => 'google-one',
                'description' => 'Nâng cấp Google One 5TB chính chủ – bảo hành full.',
                'icon'        => 'cloud',
                'sort_order'  => 40,
                'is_active'   => true,
            ],
            [
                'name'        => 'Muse AI',
                'slug'        => 'muse-ai',
                'description' => 'Tài khoản Muse AI Token – bàn giao qua email.',
                'icon'        => 'paint-brush',
                'sort_order'  => 50,
                'is_active'   => true,
            ],
            [
                'name'        => 'Video & AI Tools',
                'slug'        => 'video-ai-tools',
                'description' => 'Công cụ tự động hóa video và AI Kit cho developer & marketer (DigiVideo, Engineer Kit, Marketing Kit).',
                'icon'        => 'video-camera',
                'sort_order'  => 60,
                'is_active'   => true,
            ],
        ];

        foreach ($categories as $cat) {
            DB::table('categories')->updateOrInsert(
                ['slug' => $cat['slug']],
                [
                    ...$cat,
                    'is_active'  => true,
                    'updated_at' => now(),
                ]
            );
        }

        $categoryMap = DB::table('categories')->pluck('id', 'slug');

        // ─────────────────────────────────────────────────────────────
        // 2. Định nghĩa sản phẩm
        // ─────────────────────────────────────────────────────────────
        $products = [

            // ═══════════════════════════════════════
            // CURSOR AI – Gói theo ngày (Daily limit 400/day)
            // ═══════════════════════════════════════
            [
                'category_slug'       => 'cursor-ai',
                'name'                => 'Cursor AI Pro – 1 Ngày (400 Chat/day)',
                'slug'                => 'cursor-ai-pro-1-day-400',
                'account_type'        => 'digi_cursor-ai-pro-1day-400',
                'digishop_product_id' => '550e8400-e29b-41d4-a716-446655440106',
                'price'               => 35000,
                'cost_price'          => 29000,
                'warranty_hours'      => 24,
                'short_description'   => 'Cursor AI Pro 1 ngày – giới hạn 400 chat/ngày. Key giao ngay sau khi thanh toán.',
                'sort_order'          => 1,
            ],
            [
                'category_slug'       => 'cursor-ai',
                'name'                => 'Cursor AI Pro – 3 Ngày (400 Chat/day)',
                'slug'                => 'cursor-ai-pro-3-day-400',
                'account_type'        => 'digi_cursor-ai-pro-3day-400',
                'digishop_product_id' => 'a70b2dac-40c8-4692-95ff-c220bcfd9f66',
                'price'               => 69000,
                'cost_price'          => 59000,
                'warranty_hours'      => 72,
                'short_description'   => 'Cursor AI Pro 3 ngày – giới hạn 400 chat/ngày. Key giao ngay sau khi thanh toán.',
                'sort_order'          => 2,
            ],
            [
                'category_slug'       => 'cursor-ai',
                'name'                => 'Cursor AI Pro – 7 Ngày (400 Chat/day)',
                'slug'                => 'cursor-ai-pro-7-day-400',
                'account_type'        => 'digi_cursor-ai-pro-7day-400',
                'digishop_product_id' => '550e8400-e29b-41d4-a716-446655440107',
                'price'               => 119000,
                'cost_price'          => 99000,
                'warranty_hours'      => 168,
                'short_description'   => 'Cursor AI Pro 7 ngày – giới hạn 400 chat/ngày. Key giao ngay sau khi thanh toán.',
                'sort_order'          => 3,
            ],
            [
                'category_slug'       => 'cursor-ai',
                'name'                => 'Cursor AI Pro – 30 Ngày (400 Chat/day)',
                'slug'                => 'cursor-ai-pro-30-day-400',
                'account_type'        => 'digi_cursor-ai-pro-30day-400',
                'digishop_product_id' => '550e8400-e29b-41d4-a716-446655440108',
                'price'               => 299000,
                'cost_price'          => 265000,
                'warranty_hours'      => 720,
                'short_description'   => 'Cursor AI Pro 30 ngày – giới hạn 400 chat/ngày. Key giao ngay sau khi thanh toán.',
                'sort_order'          => 4,
            ],

            // ═══════════════════════════════════════
            // CURSOR AI – Gói VIP (Request Pool, không giới hạn theo ngày)
            // ═══════════════════════════════════════
            [
                'category_slug'       => 'cursor-ai',
                'name'                => 'Cursor AI Pro VIP – 30 Ngày (700 Requests)',
                'slug'                => 'cursor-ai-vip-30day-700req',
                'account_type'        => 'digi_cursor-vip-30day-700',
                'digishop_product_id' => '13c62b60-b959-486f-a567-1e7016a98607',
                'price'               => 109000,
                'cost_price'          => 95000,
                'warranty_hours'      => 720,
                'short_description'   => '700 Requests/30 ngày – không bị giới hạn theo ngày. Extension-based Pool.',
                'sort_order'          => 5,
            ],
            [
                'category_slug'       => 'cursor-ai',
                'name'                => 'Cursor AI Pro VIP – 30 Ngày (1,300 Requests)',
                'slug'                => 'cursor-ai-vip-30day-1300req',
                'account_type'        => 'digi_cursor-vip-30day-1300',
                'digishop_product_id' => '87b0b9f4-d2bf-4a16-b25f-2d13f4b3d7eb',
                'price'               => 175000,
                'cost_price'          => 155000,
                'warranty_hours'      => 720,
                'short_description'   => '1,300 Requests/30 ngày – không bị giới hạn theo ngày. Extension-based Pool.',
                'sort_order'          => 6,
            ],
            [
                'category_slug'       => 'cursor-ai',
                'name'                => 'Cursor AI Pro VIP – 30 Ngày (2,600 Requests)',
                'slug'                => 'cursor-ai-vip-30day-2600req',
                'account_type'        => 'digi_cursor-vip-30day-2600',
                'digishop_product_id' => 'f6cf9009-f0f6-4547-82e2-2b7b6a6ccf48',
                'price'               => 239000,
                'cost_price'          => 215000,
                'warranty_hours'      => 720,
                'short_description'   => '2,600 Requests/30 ngày – không bị giới hạn theo ngày. Extension-based Pool.',
                'sort_order'          => 7,
            ],
            [
                'category_slug'       => 'cursor-ai',
                'name'                => 'Cursor AI Pro VIP – 30 Ngày (6,500 Requests)',
                'slug'                => 'cursor-ai-vip-30day-6500req',
                'account_type'        => 'digi_cursor-vip-30day-6500',
                'digishop_product_id' => '949a199b-c95b-41a7-abc8-4a8e686fdff2',
                'price'               => 299000,
                'cost_price'          => 265000,
                'warranty_hours'      => 720,
                'short_description'   => '6,500 Requests/30 ngày – không bị giới hạn theo ngày. Extension-based Pool.',
                'sort_order'          => 8,
            ],
            [
                'category_slug'       => 'cursor-ai',
                'name'                => 'Cursor AI Pro VIP – 30 Ngày (13,000 Requests)',
                'slug'                => 'cursor-ai-vip-30day-13000req',
                'account_type'        => 'digi_cursor-vip-30day-13000',
                'digishop_product_id' => 'a82898a1-5c1c-4895-8711-c350a31cc29b',
                'price'               => 399000,
                'cost_price'          => 360000,
                'warranty_hours'      => 720,
                'short_description'   => '13,000 Requests/30 ngày – không bị giới hạn theo ngày. Extension-based Pool.',
                'sort_order'          => 9,
            ],
            [
                'category_slug'       => 'cursor-ai',
                'name'                => 'Cursor AI Pro VIP – 30 Ngày (30,000 Requests)',
                'slug'                => 'cursor-ai-vip-30day-30000req',
                'account_type'        => 'digi_cursor-vip-30day-30000',
                'digishop_product_id' => 'f6c6b650-05db-409f-95cf-40f3d2bcfd15',
                'price'               => 769000,
                'cost_price'          => 695000,
                'warranty_hours'      => 720,
                'short_description'   => '30,000 Requests/30 ngày – không bị giới hạn theo ngày. Extension-based Pool.',
                'sort_order'          => 10,
            ],

            // ═══════════════════════════════════════
            // GEMINI ANTIGRAVITY – Gói SLOT (Nâng chính chủ)
            // ═══════════════════════════════════════
            [
                'category_slug'       => 'gemini-antigravity',
                'name'                => 'Gemini Antigravity Pro – 1 Tháng (Slot chính chủ)',
                'slug'                => 'antigravity-pro-1month-slot',
                'account_type'        => 'digi_antigravity-pro-slot-1m',
                'digishop_product_id' => '95302ac1-66eb-4e4f-a719-024c9a4bb184',
                'price'               => 99000,
                'cost_price'          => 89000,
                'warranty_hours'      => 720,
                'short_description'   => 'Nâng cấp Gemini Antigravity Pro 1 tháng vào tài khoản chính chủ của bạn. Bảo hành full.',
                'sort_order'          => 1,
            ],
            [
                'category_slug'       => 'gemini-antigravity',
                'name'                => 'Gemini Antigravity Pro – 4 Tháng (Slot chính chủ)',
                'slug'                => 'antigravity-pro-4month-slot',
                'account_type'        => 'digi_antigravity-pro-slot-4m',
                'digishop_product_id' => '379b9b38-decc-43de-8a66-d3b086f7208f',
                'price'               => 189000,
                'cost_price'          => 169000,
                'warranty_hours'      => 2880,
                'short_description'   => 'Nâng cấp Gemini Antigravity Pro 4 tháng vào tài khoản chính chủ của bạn. Bảo hành full.',
                'sort_order'          => 2,
            ],
            [
                'category_slug'       => 'gemini-antigravity',
                'name'                => 'Gemini Antigravity Team – 1 Năm (Slot chính chủ)',
                'slug'                => 'antigravity-team-1year-slot',
                'account_type'        => 'digi_antigravity-team-slot-1y',
                'digishop_product_id' => 'c4b353bf-f38d-4bcd-a56d-9bd54824acfb',
                'price'               => 329000,
                'cost_price'          => 299000,
                'warranty_hours'      => 8760,
                'short_description'   => 'Nâng cấp Gemini Antigravity Team 1 năm vào tài khoản chính chủ. Bảo hành full.',
                'sort_order'          => 3,
            ],
            [
                'category_slug'       => 'gemini-antigravity',
                'name'                => 'Gemini Antigravity Ultra – 1 Tháng (Slot chính chủ, 0 Credit)',
                'slug'                => 'antigravity-ultra-1month-slot',
                'account_type'        => 'digi_antigravity-ultra-slot-1m',
                'digishop_product_id' => '34a9f1ee-2a78-42a1-8a4a-c1321a6824f5',
                'price'               => 499000,
                'cost_price'          => 459000,
                'warranty_hours'      => 720,
                'short_description'   => 'Nâng cấp Gemini Antigravity Ultra 1 tháng. Model Gemini Ultra, hạn mức cao nhất, reset mỗi 5h.',
                'sort_order'          => 4,
            ],
            // Gói ADMIN (cấp tài khoản mới – Email | Password | 2FA)
            [
                'category_slug'       => 'gemini-antigravity',
                'name'                => 'Gemini Antigravity Pro – 12 Tháng (Tài khoản cấp sẵn)',
                'slug'                => 'antigravity-pro-12month-admin',
                'account_type'        => 'digi_antigravity-pro-admin-12m',
                'digishop_product_id' => '12820279-805c-46b5-8807-b8f5ffa6e97d',
                'price'               => 329000,
                'cost_price'          => 299000,
                'warranty_hours'      => 720, // bảo hành 1 tháng
                'short_description'   => 'Tài khoản Google 5TB AI Pro 12 tháng cấp sẵn – bàn giao Email | Password | 2FA. Bảo hành 1 tháng.',
                'sort_order'          => 5,
            ],
            [
                'category_slug'       => 'gemini-antigravity',
                'name'                => 'Gemini Antigravity Pro – 18 Tháng (Tài khoản cấp sẵn)',
                'slug'                => 'antigravity-pro-18month-admin',
                'account_type'        => 'digi_antigravity-pro-admin-18m',
                'digishop_product_id' => '5e31e345-255d-40e2-a6ca-a2d3d0602f9a',
                'price'               => 249000,
                'cost_price'          => 229000,
                'warranty_hours'      => 1440, // bảo hành 2 tháng
                'short_description'   => 'Tài khoản Google 5TB AI Pro 18 tháng cấp sẵn – bàn giao Email | Password | 2FA. Bảo hành 2 tháng.',
                'sort_order'          => 6,
            ],

            // ═══════════════════════════════════════
            // API SUB CREDITS (sub.digishop.work)
            // ═══════════════════════════════════════
            [
                'category_slug'       => 'api-sub-credits',
                'name'                => 'API Sub Card – $20 Credits',
                'slug'                => 'api-sub-card-20',
                'account_type'        => 'digi_sub-card-20',
                'digishop_product_id' => 'ff73df58-ea48-4117-aac6-ee96459cd42b',
                'price'               => 22000,
                'cost_price'          => 19000,
                'warranty_hours'      => 0,
                'short_description'   => '$20 credits cho Claude, Codex, Deepseek, Grok – không giới hạn thời gian.',
                'sort_order'          => 1,
            ],
            [
                'category_slug'       => 'api-sub-credits',
                'name'                => 'API Sub Card – $50 Credits',
                'slug'                => 'api-sub-card-50',
                'account_type'        => 'digi_sub-card-50',
                'digishop_product_id' => 'd552a9d2-7f4a-4313-9e89-99a1e9613c30',
                'price'               => 55000,
                'cost_price'          => 49000,
                'warranty_hours'      => 0,
                'short_description'   => '$50 credits cho Claude, Codex, Deepseek, Grok – không giới hạn thời gian.',
                'sort_order'          => 2,
            ],
            [
                'category_slug'       => 'api-sub-credits',
                'name'                => 'API Sub Card – $100 Credits',
                'slug'                => 'api-sub-card-100',
                'account_type'        => 'digi_sub-card-100',
                'digishop_product_id' => '819d3ee4-c488-475a-8f52-bb64442e4c11',
                'price'               => 109000,
                'cost_price'          => 99000,
                'warranty_hours'      => 0,
                'short_description'   => '$100 credits cho Claude, Codex, Deepseek, Grok – không giới hạn thời gian.',
                'sort_order'          => 3,
            ],
            [
                'category_slug'       => 'api-sub-credits',
                'name'                => 'API Sub Card – $200 Credits',
                'slug'                => 'api-sub-card-200',
                'account_type'        => 'digi_sub-card-200',
                'digishop_product_id' => '937d3f2c-3d0a-459b-b623-4aca5dce3a32',
                'price'               => 219000,
                'cost_price'          => 199000,
                'warranty_hours'      => 0,
                'short_description'   => '$200 credits cho Claude, Codex, Deepseek, Grok – không giới hạn thời gian.',
                'sort_order'          => 4,
            ],
            [
                'category_slug'       => 'api-sub-credits',
                'name'                => 'API Sub Card – $500 Credits',
                'slug'                => 'api-sub-card-500',
                'account_type'        => 'digi_sub-card-500',
                'digishop_product_id' => '7e815a25-d13d-4458-9c97-4d4fb2f07cd1',
                'price'               => 549000,
                'cost_price'          => 499000,
                'warranty_hours'      => 0,
                'short_description'   => '$500 credits cho Claude, Codex, Deepseek, Grok – không giới hạn thời gian.',
                'sort_order'          => 5,
            ],
            [
                'category_slug'       => 'api-sub-credits',
                'name'                => 'API Sub Card – $1,000 Credits',
                'slug'                => 'api-sub-card-1000',
                'account_type'        => 'digi_sub-card-1000',
                'digishop_product_id' => '97af1c3d-2576-4bc3-ae7c-004147695b85',
                'price'               => 1090000,
                'cost_price'          => 999000,
                'warranty_hours'      => 0,
                'short_description'   => '$1,000 credits cho Claude, Codex, Deepseek, Grok – không giới hạn thời gian.',
                'sort_order'          => 6,
            ],

            // ═══════════════════════════════════════
            // GOOGLE ONE 5TB (Slot chính chủ)
            // ═══════════════════════════════════════
            [
                'category_slug'       => 'google-one',
                'name'                => 'Google One 5TB – 1 Tháng (Slot chính chủ)',
                'slug'                => 'google-one-5tb-1month',
                'account_type'        => 'digi_google-one-5tb-1m',
                'digishop_product_id' => '9b3b6c83-8377-4939-a051-908fa9c6304c',
                'price'               => 55000,
                'cost_price'          => 49000,
                'warranty_hours'      => 720,
                'short_description'   => 'Google One 5TB 1 tháng nâng vào tài khoản chính chủ – bảo hành full.',
                'sort_order'          => 1,
            ],
            [
                'category_slug'       => 'google-one',
                'name'                => 'Google One 5TB – 3 Tháng (Slot chính chủ)',
                'slug'                => 'google-one-5tb-3month',
                'account_type'        => 'digi_google-one-5tb-3m',
                'digishop_product_id' => 'bdb783cf-3192-4410-b853-6c3bd3fa1336',
                'price'               => 129000,
                'cost_price'          => 119000,
                'warranty_hours'      => 2160,
                'short_description'   => 'Google One 5TB 3 tháng nâng vào tài khoản chính chủ – bảo hành full.',
                'sort_order'          => 2,
            ],
            [
                'category_slug'       => 'google-one',
                'name'                => 'Google One 5TB – 4 Tháng (Slot chính chủ)',
                'slug'                => 'google-one-5tb-4month',
                'account_type'        => 'digi_google-one-5tb-4m',
                'digishop_product_id' => 'ab6be9f6-1452-4538-bef1-44d7c36b8c62',
                'price'               => 165000,
                'cost_price'          => 149000,
                'warranty_hours'      => 2880,
                'short_description'   => 'Google One 5TB 4 tháng nâng vào tài khoản chính chủ – bảo hành full.',
                'sort_order'          => 3,
            ],
            [
                'category_slug'       => 'google-one',
                'name'                => 'Google One 5TB – 6 Tháng (Slot chính chủ)',
                'slug'                => 'google-one-5tb-6month',
                'account_type'        => 'digi_google-one-5tb-6m',
                'digishop_product_id' => '3d9f5fa0-c106-4474-bcf1-a72e27629a1a',
                'price'               => 219000,
                'cost_price'          => 199000,
                'warranty_hours'      => 4320,
                'short_description'   => 'Google One 5TB 6 tháng nâng vào tài khoản chính chủ – bảo hành full.',
                'sort_order'          => 4,
            ],
            [
                'category_slug'       => 'google-one',
                'name'                => 'Google One 5TB – 12 Tháng (Slot chính chủ)',
                'slug'                => 'google-one-5tb-12month',
                'account_type'        => 'digi_google-one-5tb-12m',
                'digishop_product_id' => '23080b2e-1c00-47d7-8aae-9c28b8d2ef8a',
                'price'               => 329000,
                'cost_price'          => 299000,
                'warranty_hours'      => 8760,
                'short_description'   => 'Google One 5TB 12 tháng nâng vào tài khoản chính chủ – bảo hành full.',
                'sort_order'          => 5,
            ],

            // ═══════════════════════════════════════
            // MUSE AI
            // ═══════════════════════════════════════
            [
                'category_slug'       => 'muse-ai',
                'name'                => 'Tài khoản Muse AI | Có Sẵn 1 Tỷ Token | NO 2FA',
                'slug'                => 'muse-ai-1b-token',
                'account_type'        => 'muse-ai-1b-token',
                'cloneus_product_id'  => '15',
                'digishop_product_id' => null,
                'price'               => 29000,
                'cost_price'          => 2000,
                'warranty_hours'      => 1,
                'short_description'   => 'Muse AI 1 tỷ Token, không 2FA; full mail get code, đã Redeem. Bảo hành 1 đổi 1 trong 1 giờ đầu theo điều kiện.',
                'details_markdown'    => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 1 tỷ Token, NO 2FA.\n- Bảo hành 1 đổi 1 trong 1 tiếng đầu nếu account Login bị Banned hoặc Chặn Tạo Video.\n- Giao Full Mail Get Code login tại fviainboxes.com | Đã sử dụng Redeem a code.\n- Tài khoản chưa dính IP Việt Nam.\n\n## Hình hướng dẫn đăng nhập\n![Hướng dẫn đăng nhập Muse AI](/images/products/muse-ai-login-guide.png)\n",
                'sort_order'          => 1,
            ],
            [
                'category_slug'       => 'muse-ai',
                'name'                => 'Tài khoản Muse AI | Có Sẵn 10 Tỷ Token',
                'slug'                => 'muse-ai-10-billion-tokens',
                'account_type'        => 'muse-ai-10-billion-tokens',
                'cloneus_product_id'  => '7',
                'digishop_product_id' => null,
                'price'               => 39000,
                'cost_price'          => 15000,
                'warranty_hours'      => 1,
                'short_description'   => 'Muse AI có sẵn 10 tỷ Token, full thông tin login đã test. Bảo hành 1 đổi 1 trong 1 giờ đầu theo điều kiện.',
                'details_markdown'    => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 10 tỷ Token.\n- Bảo hành 1 đổi 1 trong 1 tiếng đầu nếu account Login bị Banned hoặc Chặn Tạo Video.\n- Mail Fvia Full Thông Tin Login / Đã Test tạo video ok.\n- Hàng chưa dính IP Việt Nam.\n",
                'sort_order'          => 2,
            ],
            [
                'category_slug'       => 'muse-ai',
                'name'                => 'Tài khoản Muse AI | Có Sẵn 30 Tỷ Token',
                'slug'                => 'muse-ai-30-billion-tokens',
                'account_type'        => 'muse-ai-30-billion-tokens',
                'cloneus_product_id'  => '14',
                'digishop_product_id' => null,
                'price'               => 69000,
                'cost_price'          => 40000,
                'warranty_hours'      => 1,
                'short_description'   => 'Muse AI có sẵn 30 tỷ Token, full thông tin login đã test. Bảo hành 1 đổi 1 trong 1 giờ đầu theo điều kiện.',
                'details_markdown'    => "## Thông tin sản phẩm\n- Tài khoản Muse AI có sẵn 30 tỷ Token.\n- Bảo hành 1 đổi 1 trong 1 tiếng đầu nếu account Login bị Banned hoặc Chặn Tạo Video.\n- Mail Fvia Full Thông Tin Login / Đã Test tạo video ok.\n- Hàng chưa dính IP Việt Nam.\n",
                'sort_order'          => 3,
            ],

            // ═══════════════════════════════════════
            // VIDEO & AI TOOLS
            // ═══════════════════════════════════════
            [
                'category_slug'       => 'video-ai-tools',
                'name'                => 'DigiVideoViral – Template Video Automation (TikTok/FB/YouTube)',
                'slug'                => 'digivideoviral-template',
                'account_type'        => 'digi_video-viral-template',
                'digishop_product_id' => '80508013-9b9f-4a41-b7e4-cd71b20d085b',
                'price'               => 169000,
                'cost_price'          => 149000,
                'warranty_hours'      => 0,
                'short_description'   => 'Template tạo video ngắn bằng AI cho TikTok, Reels, Shorts. Bàn giao file ZIP + hướng dẫn.',
                'sort_order'          => 1,
            ],
            [
                'category_slug'       => 'video-ai-tools',
                'name'                => 'Engineer Kit – Đội AI Developer 24/7 (ClaudeDigiKit)',
                'slug'                => 'engineer-kit-claudedigikit',
                'account_type'        => 'digi_engineer-kit',
                'digishop_product_id' => '22253d4b-ffd7-46a4-a156-fbb50b8d31c2',
                'price'               => 169000,
                'cost_price'          => 149000,
                'warranty_hours'      => 0,
                'short_description'   => '17 AI Agent chuyên biệt cho toàn bộ vòng đời phát triển phần mềm. Bàn giao kèm hướng dẫn.',
                'sort_order'          => 2,
            ],
            [
                'category_slug'       => 'video-ai-tools',
                'name'                => 'Marketing Kit – Đội AI Marketing 24/7 (ClaudeDigiKit)',
                'slug'                => 'marketing-kit-claudedigikit',
                'account_type'        => 'digi_marketing-kit',
                'digishop_product_id' => 'e7a9b88d-6af5-451f-beb0-82bb4598db66',
                'price'               => 169000,
                'cost_price'          => 149000,
                'warranty_hours'      => 0,
                'short_description'   => 'AI Marketing automation – tự động content, screenshot UI, đồng bộ features. Bàn giao kèm hướng dẫn.',
                'sort_order'          => 3,
            ],
        ];

        // ─────────────────────────────────────────────────────────────
        // 3. Insert / Update sản phẩm
        // ─────────────────────────────────────────────────────────────
        foreach ($products as $p) {
            $categoryId = $categoryMap[$p['category_slug']] ?? null;
            if (!$categoryId) {
                $this->command->warn("Category not found: {$p['category_slug']}");
                continue;
            }

            // Gắn Logo sản phẩm theo yêu cầu:
            // - digivideo, enginer, marketing kit dùng chung agent-kit-logo.jpg
            // - cursor: cursor-logo.jpg
            // - antigravity: antigravity-logo.jpg
            // - subapi: apisub-logo.webp
            // - google-one: google-one-logo.png
            // - muse: muse-logo.jpg
            $imageUrl = match ($p['category_slug']) {
                'cursor-ai'          => '/images/products/cursor-logo.jpg',
                'gemini-antigravity' => '/images/products/antigravity-logo.jpg',
                'api-sub-credits'    => '/images/products/apisub-logo.jpg',
                'google-one'         => '/images/products/google-one-logo.png',
                'muse-ai'            => '/images/products/muse-logo.jpg',
                'video-ai-tools'     => '/images/products/video-ai-tools-logo.jpg',
                default              => '/images/products/video-ai-tools-logo.jpg',
            };

            // Gắn badges thông tin nổi bật
            $badges = match ($p['category_slug']) {
                'cursor-ai' => str_contains($p['name'], 'VIP')
                    ? ['VIP Request Pool', 'Không Giới Hạn Ngày', 'Giao Tự Động 3s']
                    : ['Giao Tự Động 3s', '400 Chat/Ngày', 'Extension Pool'],
                'gemini-antigravity' => str_contains($p['name'], 'Slot')
                    ? ['Chính Chủ', 'Giao Tự Động 3s', 'Bảo Hành Full']
                    : ['Tài Khoản Sẵn', '2FA Live', 'Bảo Hành 1-2 Tháng'],
                'api-sub-credits' => ['Cổng API Sub Credits', 'Không Giới Hạn Hạn Dùng', 'Giao Key Tức Thì'],
                'google-one'      => ['Chính Chủ 5TB', 'Bảo Hành Full', 'Chia Sẻ Gia Đình'],
                'muse-ai'         => [
                    str_contains($p['name'], '30 Tỷ') ? 'Token 30 Tỷ' : (str_contains($p['name'], '10 Tỷ') ? 'Token 10 Tỷ' : 'Token 1 Tỷ'),
                    str_contains($p['name'], 'NO 2FA') ? 'Không 2FA' : 'Bàn Giao Tài Khoản',
                    'Bảo Hành 1h',
                ],
                'video-ai-tools'  => str_contains($p['name'], 'DigiVideo')
                    ? ['Video Automation', 'Full Template & Source', 'TikTok/Reels/Shorts']
                    : (str_contains($p['name'], 'Engineer')
                        ? ['17 AI Agent', 'Full Codebase Workflow', 'ClaudeDigiKit']
                        : ['Marketing Automation', 'Sync Codebase UI', 'ClaudeDigiKit']),
                default => ['Chính Hãng', 'Giao Tự Động 3s'],
            };

            // Lấy mô tả chi tiết từ Digishop Reseller API
            $detailsMarkdown = $p['details_markdown']
                ?? (!empty($p['digishop_product_id']) ? ($apiMap[$p['digishop_product_id']]['description'] ?? null) : null);

            $existing = DB::table('products')
                ->where('account_type', $p['account_type'])
                ->orWhere('slug', $p['slug'])
                ->first();

            $data = [
                'category_id'         => $categoryId,
                'name'                => $p['name'],
                'slug'                => $p['slug'],
                'account_type'        => $p['account_type'],
                'digishop_product_id' => $p['digishop_product_id'],
                'cloneus_product_id'  => $p['cloneus_product_id'] ?? null,
                'price'               => $p['price'],
                'cost_price'          => $p['cost_price'],
                'warranty_hours'      => $p['warranty_hours'],
                'is_auto_warranty'    => false, // Digishop products không dùng auto-warranty
                'is_off_mode'         => false,
                'short_description'   => $p['short_description'],
                'details_markdown'    => $detailsMarkdown,
                'badges'              => json_encode($badges, JSON_UNESCAPED_UNICODE),
                'image_url'           => $imageUrl,
                'options'             => null,
                'is_active'           => true,
                'sort_order'          => $p['sort_order'],
                'updated_at'          => now(),
            ];

            if ($existing) {
                DB::table('products')->where('id', $existing->id)->update($data);
                $this->command->info("Updated: {$p['name']}");
            } else {
                DB::table('products')->insert([
                    ...$data,
                    'created_at' => now(),
                ]);
                $this->command->info("Inserted: {$p['name']}");
            }
        }

        $this->command->info('✅ Digishop Reseller products seeded successfully!');
    }
}
