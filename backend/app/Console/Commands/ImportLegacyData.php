<?php

namespace App\Console\Commands;

use App\Models\AccountStock;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ImportLegacyData extends Command
{
    protected $signature = 'inventory:import-legacy {path? : Đường dẫn tới thư mục bot cũ}';
    protected $description = 'Import danh mục, sản phẩm, bảng giá và kho acc từ project bot Discord cũ';

    public function handle(): int
    {
        $legacyPath = $this->argument('path') ?: 'C:\Users\Administrator\Downloads\SellAccfix';

        if (!File::isDirectory($legacyPath)) {
            $this->error("Không tìm thấy thư mục bot cũ tại: {$legacyPath}");
            return 1;
        }

        $this->info("Bắt đầu import dữ liệu từ: {$legacyPath}");

        // 1. Tạo Danh Mục (Categories)
        $categories = [
            'valorant' => [
                'name' => 'Valorant',
                'description' => 'Tài khoản Valorant rank Iron đến Radiant, đầy đủ gói Thường và Chủ Off.',
                'icon' => '🎯',
                'sort_order' => 1,
            ],
            'cs2' => [
                'name' => 'CS:GO 2',
                'description' => 'Tài khoản CS2 Prime chơi được Rank, sạch 100%.',
                'icon' => '⚡',
                'sort_order' => 2,
            ],
            'steam' => [
                'name' => 'Steam',
                'description' => 'Tài khoản Steam theo số lượng game (Tier 1, Tier 2, Tier 3).',
                'icon' => '🎮',
                'sort_order' => 3,
            ],
            'pubg' => [
                'name' => 'PUBG',
                'description' => 'Tài khoản PUBG Plus chơi Rank thoải mái.',
                'icon' => '🪂',
                'sort_order' => 4,
            ],
        ];

        $categoryModels = [];
        foreach ($categories as $slug => $c) {
            $categoryModels[$slug] = Category::updateOrCreate(
                ['slug' => $slug],
                $c
            );
        }
        $this->info("✅ Đã thiết lập 4 danh mục game.");

        // 2. Đọc Bảng Giá từ prices.json
        $pricesFile = $legacyPath . DIRECTORY_SEPARATOR . 'prices.json';
        $prices = [];
        if (File::exists($pricesFile)) {
            $json = json_decode(File::get($pricesFile), true) ?: [];
            foreach ($json as $k => $v) {
                if (!str_starts_with($k, '_')) {
                    $prices[$k] = (int) $v;
                }
            }
        }

        // 3. Khởi tạo danh sách sản phẩm
        $productList = [
            // Valorant thường (2h warranty)
            ['cat' => 'valorant', 'type' => 'valo_unranked', 'name' => 'Acc Valorant Unranked', 'price' => 10000, 'w' => 2, 'off' => false],
            ['cat' => 'valorant', 'type' => 'valo_iron', 'name' => 'Acc Valorant Iron', 'price' => 10000, 'w' => 2, 'off' => false],
            ['cat' => 'valorant', 'type' => 'valo_bronze', 'name' => 'Acc Valorant Bronze', 'price' => 12000, 'w' => 2, 'off' => false],
            ['cat' => 'valorant', 'type' => 'valo_silver', 'name' => 'Acc Valorant Silver', 'price' => 15000, 'w' => 2, 'off' => false],
            ['cat' => 'valorant', 'type' => 'valo_gold', 'name' => 'Acc Valorant Gold', 'price' => 20000, 'w' => 2, 'off' => false],
            ['cat' => 'valorant', 'type' => 'valo_platinum', 'name' => 'Acc Valorant Platinum', 'price' => 25000, 'w' => 2, 'off' => false],
            ['cat' => 'valorant', 'type' => 'valo_diamond', 'name' => 'Acc Valorant Diamond', 'price' => 35000, 'w' => 2, 'off' => false],
            ['cat' => 'valorant', 'type' => 'valo_ascendant', 'name' => 'Acc Valorant Ascendant', 'price' => 50000, 'w' => 2, 'off' => false],
            ['cat' => 'valorant', 'type' => 'valo_immortal', 'name' => 'Acc Valorant Immortal', 'price' => 70000, 'w' => 2, 'off' => false],
            ['cat' => 'valorant', 'type' => 'valo_radiant', 'name' => 'Acc Valorant Radiant', 'price' => 100000, 'w' => 2, 'off' => false],

            // Valorant Chủ Off (5h warranty)
            ['cat' => 'valorant', 'type' => 'valo_unranked_off', 'name' => 'Acc Valorant Unranked (Chủ Off)', 'price' => 20000, 'w' => 5, 'off' => true],
            ['cat' => 'valorant', 'type' => 'valo_iron_off', 'name' => 'Acc Valorant Iron (Chủ Off)', 'price' => 20000, 'w' => 5, 'off' => true],
            ['cat' => 'valorant', 'type' => 'valo_bronze_off', 'name' => 'Acc Valorant Bronze (Chủ Off)', 'price' => 24000, 'w' => 5, 'off' => true],
            ['cat' => 'valorant', 'type' => 'valo_silver_off', 'name' => 'Acc Valorant Silver (Chủ Off)', 'price' => 30000, 'w' => 5, 'off' => true],
            ['cat' => 'valorant', 'type' => 'valo_gold_off', 'name' => 'Acc Valorant Gold (Chủ Off)', 'price' => 40000, 'w' => 5, 'off' => true],
            ['cat' => 'valorant', 'type' => 'valo_platinum_off', 'name' => 'Acc Valorant Platinum (Chủ Off)', 'price' => 50000, 'w' => 5, 'off' => true],
            ['cat' => 'valorant', 'type' => 'valo_diamond_off', 'name' => 'Acc Valorant Diamond (Chủ Off)', 'price' => 70000, 'w' => 5, 'off' => true],
            ['cat' => 'valorant', 'type' => 'valo_ascendant_off', 'name' => 'Acc Valorant Ascendant (Chủ Off)', 'price' => 100000, 'w' => 5, 'off' => true],
            ['cat' => 'valorant', 'type' => 'valo_immortal_off', 'name' => 'Acc Valorant Immortal (Chủ Off)', 'price' => 140000, 'w' => 5, 'off' => true],
            ['cat' => 'valorant', 'type' => 'valo_radiant_off', 'name' => 'Acc Valorant Radiant (Chủ Off)', 'price' => 200000, 'w' => 5, 'off' => true],

            // CS:GO 2 (Bảo hành duyệt tay)
            ['cat' => 'cs2', 'type' => 'cs2_prime', 'name' => 'Acc CSGO 2 Prime (Chơi được Rank)', 'price' => 50000, 'w' => 2, 'off' => false, 'auto_w' => false],

            // Steam
            ['cat' => 'steam', 'type' => 'steam_tier_1', 'name' => 'Acc Steam (0 - 10 Games)', 'price' => 5000, 'w' => 2, 'off' => false],
            ['cat' => 'steam', 'type' => 'steam_tier_2', 'name' => 'Acc Steam (11 - 40 Games)', 'price' => 15000, 'w' => 2, 'off' => false],
            ['cat' => 'steam', 'type' => 'steam_tier_3', 'name' => 'Acc Steam (41+ Games)', 'price' => 25000, 'w' => 2, 'off' => false],

            // PUBG (Bảo hành duyệt tay)
            ['cat' => 'pubg', 'type' => 'pubg_plus', 'name' => 'Acc PUBG Plus (Chơi Rank)', 'price' => 50000, 'w' => 2, 'off' => false, 'auto_w' => false],
        ];

        $productModels = [];
        foreach ($productList as $p) {
            $cat = $categoryModels[$p['cat']];
            $price = $prices[$p['type']] ?? $p['price'];
            $slug = Str::slug($p['name']);

            $productModels[$p['type']] = Product::updateOrCreate(
                ['account_type' => $p['type']],
                [
                    'category_id' => $cat->id,
                    'name' => $p['name'],
                    'slug' => $slug,
                    'price' => $price,
                    'warranty_hours' => $p['w'],
                    'is_auto_warranty' => $p['auto_w'] ?? true,
                    'is_off_mode' => $p['off'],
                    'short_description' => "Tài khoản {$p['name']} bảo hành {$p['w']} giờ. Nhận hàng tức thì qua VietQR.",
                    'badges' => $p['off'] ? ['Chủ Off', 'Bảo Hành 5h'] : ['Bán Chạy', 'Giao Tự Động'],
                    'is_active' => true,
                ]
            );
        }
        $this->info("✅ Đã thiết lập " . count($productList) . " sản phẩm từ prices.json.");

        // 4. Map File Kho sang Bảng AccountStock
        $fileMap = [
            'valo_unranked' => 'rank_unranked.txt',
            'valo_iron' => 'rank_iron.txt',
            'valo_bronze' => 'rank_bronze.txt',
            'valo_silver' => 'rank_silver.txt',
            'valo_gold' => 'rank_gold.txt',
            'valo_platinum' => 'rank_platinum.txt',
            'valo_diamond' => 'rank_diamond.txt',
            'valo_ascendant' => 'rank_ascendant.txt',
            'valo_immortal' => 'rank_immortal.txt',
            'valo_radiant' => 'rank_radiant.txt',
            'valo_unranked_off' => 'rank_unranked_off.txt',
            'valo_iron_off' => 'rank_iron_off.txt',
            'valo_bronze_off' => 'rank_bronze_off.txt',
            'valo_silver_off' => 'rank_silver_off.txt',
            'valo_gold_off' => 'rank_gold_off.txt',
            'valo_platinum_off' => 'rank_platinum_off.txt',
            'valo_diamond_off' => 'rank_diamond_off.txt',
            'valo_ascendant_off' => 'rank_ascendant_off.txt',
            'valo_immortal_off' => 'rank_immortal_off.txt',
            'valo_radiant_off' => 'rank_radiant_off.txt',
            'cs2_prime' => 'cs2_prime.txt',
            'steam_tier_1' => 'steam.txt',
            'pubg_plus' => 'pubg_plus.txt',
        ];

        $dataDir = $legacyPath . DIRECTORY_SEPARATOR . 'data';
        $totalImported = 0;

        foreach ($fileMap as $type => $filename) {
            $filePath = $dataDir . DIRECTORY_SEPARATOR . $filename;
            if (!File::exists($filePath)) {
                continue;
            }

            $content = File::get($filePath);
            $rawAccs = $this->splitRawAccounts($content);

            $product = $productModels[$type] ?? null;
            if (!$product || empty($rawAccs)) {
                continue;
            }

            $countForType = 0;
            foreach ($rawAccs as $raw) {
                $clean = trim($raw);
                if (empty($clean)) continue;

                $hash = hash('sha256', $clean);
                if (!AccountStock::where('credentials_hash', $hash)->exists()) {
                    AccountStock::create([
                        'product_id' => $product->id,
                        'account_type' => $type,
                        'credentials' => $clean,
                        'credentials_hash' => $hash,
                        'status' => 'available',
                    ]);
                    $countForType++;
                    $totalImported++;
                }
            }

            if ($countForType > 0) {
                $this->line("  - [{$type}]: Đã nạp {$countForType} acc từ {$filename}");
            }
        }

        $this->info("🎉 HOÀN THÀNH IMPORT! Tổng số {$totalImported} tài khoản đã được mã hóa an toàn vào DB.");

        return 0;
    }

    protected function splitRawAccounts(string $text): array
    {
        $text = trim($text);
        if (empty($text)) {
            return [];
        }

        if (str_contains($text, '---------------------------') || preg_match('/-{10,}/', $text) || str_contains($text, 'Username:')) {
            $blocks = preg_split('/-{10,}/', $text);
            $result = [];
            foreach ($blocks as $b) {
                $clean = trim($b);
                if (!empty($clean) && (str_contains($clean, 'Username:') || str_contains($clean, ':'))) {
                    $result[] = $clean;
                }
            }
            return $result;
        }

        return array_values(array_filter(array_map('trim', explode("\n", $text))));
    }
}
