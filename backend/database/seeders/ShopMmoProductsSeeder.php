<?php
// Seed Discord Category và sản phẩm Discord + CS2 từ ShopMMO

use App\Models\Category;
use App\Models\Product;

// ─── 1. Category Discord ─────────────────────────────────────────────────────
$discord = Category::firstOrCreate(
    ['slug' => 'discord'],
    [
        'name'        => 'Discord',
        'description' => 'Tài khoản Discord chính hãng — Token, Clone, Nitro Trial. Giao tự động 24/7.',
        'icon'        => 'chat-bubble-left-right',
        'sort_order'  => 5,
        'is_active'   => true,
    ]
);
echo "Discord category ID: {$discord->id}\n";

// ─── 2. Category CS2 (đã tồn tại) ────────────────────────────────────────────
$cs2 = Category::where('slug', 'cs2')->first();
if (!$cs2) {
    $cs2 = Category::create([
        'name'        => 'CS:GO 2',
        'slug'        => 'cs2',
        'description' => 'Tài khoản Counter-Strike 2 Prime chính hãng. Giao tự động 24/7.',
        'icon'        => 'fire',
        'sort_order'  => 4,
        'is_active'   => true,
    ]);
}
echo "CS2 category ID: {$cs2->id}\n";

// ─── 3. Sản phẩm Discord ─────────────────────────────────────────────────────

// Discord Token Only (ShopMMO ID: 3132, vốn ~314đ)
Product::updateOrCreate(
    ['shopmmo_product_id' => 3132],
    [
        'category_id'        => $discord->id,
        'name'               => 'Discord Token Only',
        'slug'               => 'discord-token-only',
        'account_type'       => 'discord_token',
        'shopmmo_product_id' => 3132,
        'delivery_format'    => 'token',
        'price'              => 3000,
        'cost_price'         => 314,
        'warranty_hours'     => 1,
        'is_auto_warranty'   => false,
        'is_off_mode'        => false,
        'short_description'  => 'Token Discord clone thô – dùng với tool riêng. Kho 8000+ acc. Giao ngay sau thanh toán.',
        'details_markdown'   => "## Discord Token Only\n\n**Định dạng bàn giao:** `Token` (1 dòng)\n\n> ⚠️ Đây là **Token thô** dùng với tool MMO (Selfbot, Nuker...). KHÔNG đăng nhập trực tiếp vào web/app Discord.\n\n**Bảo hành:** 1 giờ kể từ khi mua (hoàn tiền nếu token không hoạt động).",
        'badges'             => ['Giao ngay', 'Kho lớn'],
        'image_url'          => '/logos/discord-logo.png',
        'is_active'          => true,
        'sort_order'         => 1,
    ]
);
echo "Created: Discord Token Only\n";

// Discord Clone (verify phone, ShopMMO ID: 3131, vốn ~1920đ)
Product::updateOrCreate(
    ['shopmmo_product_id' => 3131],
    [
        'category_id'        => $discord->id,
        'name'               => 'Discord Clone (Đã Verify Phone)',
        'slug'               => 'discord-clone-verify-phone',
        'account_type'       => 'discord_clone',
        'shopmmo_product_id' => 3131,
        'delivery_format'    => 'raw_text',
        'price'              => 6000,
        'cost_price'         => 1920,
        'warranty_hours'     => 1,
        'is_auto_warranty'   => false,
        'is_off_mode'        => false,
        'short_description'  => 'Tài khoản Discord đã verify SĐT – phù hợp farm server, join group. Giao ngay 24/7.',
        'details_markdown'   => "## Discord Clone (Đã Verify Phone)\n\n**Định dạng bàn giao:** `email|password|token` hoặc thông tin đăng nhập đầy đủ.\n\n✅ Đã xác minh số điện thoại\n✅ Có thể join server không giới hạn\n\n**Bảo hành:** 1 giờ kể từ khi mua.",
        'badges'             => ['Verify Phone', 'Giao ngay'],
        'image_url'          => '/logos/discord-logo.png',
        'is_active'          => true,
        'sort_order'         => 2,
    ]
);
echo "Created: Discord Clone\n";

// Discord Cổ >3 Tháng Full Mail (ShopMMO ID: 3162, vốn ~2241đ)
Product::updateOrCreate(
    ['shopmmo_product_id' => 3162],
    [
        'category_id'        => $discord->id,
        'name'               => 'Discord Cổ >3 Tháng (Full Mail)',
        'slug'               => 'discord-co-3-thang-full-mail',
        'account_type'       => 'discord_aged',
        'shopmmo_product_id' => 3162,
        'delivery_format'    => 'raw_text',
        'price'              => 8000,
        'cost_price'         => 2241,
        'warranty_hours'     => 1,
        'is_auto_warranty'   => false,
        'is_off_mode'        => false,
        'short_description'  => 'Tài khoản Discord cổ trên 3 tháng, kèm full mail tạo. Uy tín cao, ít bị ban.',
        'details_markdown'   => "## Discord Cổ >3 Tháng (Full Mail AutoReg)\n\n**Định dạng bàn giao:** `email|password` (kèm mail tạo)\n\n✅ Tuổi tài khoản > 3 tháng – uy tín cao\n✅ Kèm full thông tin email tạo tài khoản\n✅ Phù hợp farm cộng đồng, boost trust\n\n**Bảo hành:** 1 giờ kể từ khi mua.",
        'badges'             => ['Cổ >3 tháng', 'Full Mail'],
        'image_url'          => '/logos/discord-logo.png',
        'is_active'          => true,
        'sort_order'         => 3,
    ]
);
echo "Created: Discord Cổ 3 Tháng\n";

// ─── 4. Sản phẩm CS2 ──────────────────────────────────────────────────────────

// CS2 Prime NFA Random (ShopMMO ID: 3164, vốn ~6402đ)
Product::updateOrCreate(
    ['shopmmo_product_id' => 3164],
    [
        'category_id'        => $cs2->id,
        'name'               => 'CS2 Prime (NFA) — Random',
        'slug'               => 'cs2-prime-nfa-random',
        'account_type'       => 'cs2_key',
        'shopmmo_product_id' => 3164,
        'delivery_format'    => 'key_loader',
        'price'              => 29000,
        'cost_price'         => 6402,
        'warranty_hours'     => 1,
        'is_auto_warranty'   => false,
        'is_off_mode'        => false,
        'short_description'  => 'Tài khoản CS2 Prime NFA random – giao Mã Key, đăng nhập qua Loader. Kho 200+ acc.',
        'details_markdown'   => "## CS2 Prime NFA — Random\n\n**Định dạng bàn giao:** `Mã Key` (ví dụ: `CS2-XXXX-XXXX-XXXX`)\n\n### Cách sử dụng:\n1. Tải công cụ **SteamLoader.exe** tại [Hướng Dẫn CS2](https://taphoa247.io.vn/huong-dan/cs2)\n2. Mở file, nhập **Mã Key** vừa nhận → nhấn **Enter**\n3. Loader tự động đăng nhập Steam – Mở CS2 chơi ngay!\n\n⚠️ Tài khoản NFA (No Full Access) – đăng nhập qua Loader, không có mail gốc.\n\n**Bảo hành:** 1 giờ kể từ khi mua.",
        'badges'             => ['CS2 Prime', 'NFA', 'Giao ngay'],
        'image_url'          => '/logos/csgo2-logo.png',
        'is_active'          => true,
        'sort_order'         => 1,
    ]
);
echo "Created: CS2 Prime NFA Random\n";

// CS2 Prime NFA Clean không VAC (ShopMMO ID: 3165, vốn ~6402đ)
Product::updateOrCreate(
    ['shopmmo_product_id' => 3165],
    [
        'category_id'        => $cs2->id,
        'name'               => 'CS2 Prime (NFA) — Clean Không VAC',
        'slug'               => 'cs2-prime-nfa-clean-khong-vac',
        'account_type'       => 'cs2_key',
        'shopmmo_product_id' => 3165,
        'delivery_format'    => 'key_loader',
        'price'              => 35000,
        'cost_price'         => 6402,
        'warranty_hours'     => 1,
        'is_auto_warranty'   => false,
        'is_off_mode'        => false,
        'short_description'  => 'CS2 Prime NFA sạch – không VAC ban, không game ban. Kho 130+ acc. Giao Mã Key ngay.',
        'details_markdown'   => "## CS2 Prime NFA — Clean Không VAC\n\n**Định dạng bàn giao:** `Mã Key` (ví dụ: `CS2-XXXX-XXXX-XXXX`)\n\n### Đặc điểm:\n✅ **Prime Status** – chơi Premier & Competitive\n✅ **Không VAC Ban** – lịch sử sạch 100%\n✅ **Không Game Ban** – an toàn hoàn toàn\n\n### Cách sử dụng:\n1. Tải công cụ **SteamLoader.exe** tại [Hướng Dẫn CS2](https://taphoa247.io.vn/huong-dan/cs2)\n2. Nhập **Mã Key** → Loader tự đăng nhập Steam\n\n**Bảo hành:** 1 giờ kể từ khi mua.",
        'badges'             => ['CS2 Prime', 'Clean', 'No VAC'],
        'image_url'          => '/logos/csgo2-logo.png',
        'is_active'          => true,
        'sort_order'         => 2,
    ]
);
echo "Created: CS2 Prime NFA Clean\n";

echo "\n✅ HOÀN TẤT! Đã tạo 5 sản phẩm (3 Discord + 2 CS2)\n";
