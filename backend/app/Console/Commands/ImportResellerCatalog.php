<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ImportResellerCatalog extends Command
{
    protected $signature = 'catalog:import-reseller';
    protected $description = 'Nhập danh mục nguồn vào trạng thái tắt và cập nhật giá nhập.';

    public function handle(): int
    {
        $response = Http::withOptions(['verify' => config('services.tls.ca_bundle') ?: true])
            ->withHeaders([
                'apikey' => config('services.digishop.gateway_key'),
                'Authorization' => 'Bearer ' . config('services.digishop.reseller_key'),
            ])->timeout(60)->get('https://fxuddnmgxjofivlytckn.supabase.co/functions/v1/reseller-get-products');
        if (!$response->successful() || !is_array($response->json('products'))) {
            $this->error('Không đọc được danh mục. HTTP ' . $response->status());
            return self::FAILURE;
        }
        $counts = ['created' => 0, 'updated' => 0, 'skipped' => 0];
        DB::transaction(function () use ($response, &$counts) {
            foreach ($response->json('products') as $row) {
                $id = trim((string) ($row['id'] ?? ''));
                $name = trim((string) ($row['name'] ?? ''));
                $cost = $row['reseller_price'] ?? null;
                if ($id === '' || $name === '' || !is_numeric($cost) || $cost < 0 || preg_match('/admin.*don.t buy|^test\b/i', $name)) {
                    $counts['skipped']++;
                    continue;
                }
                $existing = Product::where('digishop_product_id', $id)->get();
                if ($existing->isNotEmpty()) {
                    foreach ($existing as $product) {
                        // Preserve alternate supplier mappings and the shop's retail price/copy.
                        if ($product->cloneus_product_id || $product->shopmmo_product_id) {
                            $counts['skipped']++;
                            continue;
                        }
                        $product->update(['cost_price' => (int) $cost, 'is_active' => false, 'requires_customer_note' => (bool) ($row['requires_customer_note'] ?? false)]);
                        $counts['updated']++;
                    }
                    continue;
                }
                $name = preg_replace('/https?:\/\/\S+|\b(?:sub\.)?digishop\.work\b|\bshopmmo(?:\.pro)?\b|\bdigishop\b/i', '', $name);
                $name = preg_replace('/^[\s\-–]+|[\s\-–]+$/u', '', preg_replace('/\s+/u', ' ', $name));
                $categoryName = trim((string) ($row['category'] ?? 'Khác')) ?: 'Khác';
                $slug = match ($categoryName) {
                    'Antigravity' => 'gemini-antigravity',
                    'Cursor' => 'cursor-ai',
                    'Muse' => 'muse-ai',
                    'GoogleOne' => 'google-one',
                    'SubAPI' => 'api-sub',
                    default => Str::slug($categoryName) ?: 'khac',
                };
                $category = Category::firstOrCreate(['slug' => $slug], [
                    'name' => $categoryName, 'is_active' => true, 'sort_order' => 100,
                ]);
                Product::create([
                    'category_id' => $category->id,
                    'name' => $name,
                    'slug' => Str::slug($name) . '-' . $id,
                    'account_type' => 'catalog-' . $id,
                    'digishop_product_id' => $id,
                    'cost_price' => (int) $cost,
                    'requires_customer_note' => (bool) ($row['requires_customer_note'] ?? false),
                    'price' => max(1000, (int) $cost),
                    'warranty_hours' => 0,
                    'is_auto_warranty' => false,
                    'is_off_mode' => false,
                    'is_active' => false,
                    'short_description' => 'Vui lòng kiểm tra thông tin gói và chính sách bảo hành trước khi mua.',
                    'sort_order' => 100,
                ]);
                $counts['created']++;
            }
        });
        Cache::forget('catalog.categories');
        $this->info(json_encode($counts));
        return self::SUCCESS;
    }
}
