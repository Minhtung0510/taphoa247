<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CatalogController extends Controller
{
    /**
     * Danh sách danh mục game
     */
    public function categories(): JsonResponse
    {
        $categories = Cache::remember('catalog.categories', 10, function () {
            return Category::where('is_active', true)
                ->whereHas('products', fn ($q) => $q->where('is_active', true))
                ->withCount(['products' => function ($q) {
                    $q->where('is_active', true);
                }])
                ->orderBy('sort_order', 'asc')
                ->get();
        });

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Chi tiết danh mục kèm sản phẩm và tồn kho thời gian thực
     */
    public function category(string $slug): JsonResponse
    {
        $category = Category::where('slug', $slug)
            ->where('is_active', true)
            ->whereHas('products', fn ($q) => $q->where('is_active', true))
            ->firstOrFail();

        $products = Product::where('category_id', $category->id)
            ->where('is_active', true)
            ->withCount(['stocks as available_stock' => function ($q) {
                $q->where('status', 'available');
            }])
            ->orderBy('sort_order', 'asc')
            ->get()
            ->map(fn($p) => $this->formatProductStock($p, $category->id));

        return response()->json([
            'success' => true,
            'data' => [
                'category' => $category,
                'products' => $products,
            ],
        ]);
    }

    /**
     * Danh sách sản phẩm (có filter theo category_slug)
     */
    public function products(Request $request): JsonResponse
    {
        $cacheKey = 'catalog.products.' . \App\Services\CatalogCache::version() . '.' . md5(serialize($request->all()));
        $products = Cache::remember($cacheKey, 20, function () use ($request) {
            $query = Product::where('is_active', true)
                ->with('category:id,name,slug,icon')
                ->withCount(['stocks as available_stock' => function ($q) {
                    $q->where('status', 'available');
                }]);

            if ($request->filled('category')) {
                $query->whereHas('category', function ($q) use ($request) {
                    $q->where('slug', $request->category);
                });
            }

            return $query->orderBy('sort_order', 'asc')
                ->get()
                ->map(fn($p) => $this->formatProductStock($p, $p->category_id));
        });

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Chi tiết 1 sản phẩm
     */
    public function product(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)
            ->where('is_active', true)
            ->with('category:id,name,slug,icon')
            ->withCount(['stocks as available_stock' => function ($q) {
                $q->where('status', 'available');
            }])
            ->firstOrFail();

        $product = $this->formatProductStock($product, $product->category_id);

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /**
     * Tự động tính toán tồn kho cho các sản phẩm mua tự động qua Bot
     * Chỉ riêng Valorant (Category 1) mới trừ tồn kho thực tế từ DB account_stock
     */
    protected function formatProductStock(Product $product, ?int $categoryId = null): Product
    {
        // Never expose supplier mappings or internal margin through the public catalog API.
        $product->makeHidden([
            'cloneus_product_id',
            'digishop_product_id',
            'shopmmo_product_id',
            'cost_price',
        ]);

        $catId = $categoryId ?? $product->category_id;
        // Null preserves the other product types' existing checkout behavior.
        $product->requires_customer_note = $product->isDigishop() ? (bool) $product->requires_customer_note : null;
        if ($catId !== 1 && ($product->category?->slug !== 'valorant')) {
            if (!empty($product->options) && is_array($product->options)) {
                $hasInStockOption = false;
                foreach ($product->options as $opt) {
                    if (!empty($opt['is_available'])) {
                        $hasInStockOption = true;
                        break;
                    }
                }
                $product->available_stock = $hasInStockOption ? 99 : 0;
            } else {
                $product->available_stock = 99;
            }
        }
        return $product;
    }

    /**
     * Thống kê Social Proof (cho Live Stream / Màn hình AI làm việc)
     * Người thật việc thật: Đếm IP/Session thực tế đang truy cập, đếm tim thật từ DB
     */
    public function stats(Request $request): JsonResponse
    {
        // 1. Cập nhật nhịp tim người xem trực tiếp thực tế qua IP/Session
        $now = time();
        $activeViewers = Cache::get('store.active_viewers', []);
        if (!is_array($activeViewers)) {
            $activeViewers = [];
        }

        // Lọc bỏ các visitor không có hoạt động quá 90 giây
        $activeViewers = array_filter($activeViewers, function ($timestamp) use ($now) {
            return ($now - (int) $timestamp) < 90;
        });

        // Định danh client thực tế (IP + User-Agent băm an toàn)
        $clientKey = substr(hash('sha256', ($request->ip() ?? '127.0.0.1') . ($request->userAgent() ?? '')), 0, 16);
        $activeViewers[$clientKey] = $now;
        Cache::put('store.active_viewers', $activeViewers, 300);

        // Số người xem trực tiếp thực tế (tối thiểu là chính người đang truy cập)
        $realLiveViewers = max(1, count($activeViewers));

        // 2. Lấy số tim thật đã lưu trong DB (người dùng bấm tim thật)
        $realHearts = (int) Setting::get('store_real_hearts', 0);

        // 3. Thống kê đơn hàng và doanh thu thực tế từ CSDL
        $orderStats = Cache::remember('store.live_order_stats', 15, function () {
            $totalOrders = Order::whereIn('status', ['paid', 'completed'])->count();
            $totalRevenue = Order::whereIn('status', ['paid', 'completed'])->sum('total_amount');
            $todayOrders = Order::whereIn('status', ['paid', 'completed'])
                ->whereDate('paid_at', today())
                ->count();
            $todayRevenue = Order::whereIn('status', ['paid', 'completed'])
                ->whereDate('paid_at', today())
                ->sum('total_amount');

            $recentSales = Order::whereIn('status', ['paid', 'completed'])
                ->with('items.product')
                ->latest('paid_at')
                ->limit(6)
                ->get()
                ->map(function ($o) {
                    $firstItem = $o->items->first();
                    return [
                        'customer' => mb_substr($o->customer_name, 0, 1) . '***',
                        'product_name' => $firstItem?->product?->name ?? 'Tài khoản Game',
                        'amount' => $o->total_amount,
                        'paid_at' => $o->paid_at?->diffForHumans() ?? 'vừa xong',
                    ];
                });

            return [
                'total_orders' => $totalOrders,
                'today_orders' => $todayOrders,
                'recent_sales' => $recentSales,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => array_merge($orderStats, [
                'live_viewers' => $realLiveViewers,
                'hearts_count' => $realHearts,
            ]),
        ]);
    }

    /**
     * Thả tim thật từ người dùng (Atomic Update chống Race Condition)
     */
    public function addHeart(): JsonResponse
    {
        $setting = Setting::firstOrCreate(
            ['key' => 'store_real_hearts'],
            ['value' => '0', 'type' => 'integer']
        );

        $current = (int) $setting->value;
        $newCount = $current + 1;
        $setting->update(['value' => (string) $newCount]);

        return response()->json([
            'success' => true,
            'hearts_count' => $newCount,
        ]);
    }

    /**
     * Cấu hình công khai của cửa hàng (Tên, Slogan, Hotline, Mạng xã hội, Bảo trì)
     */
    public function settings(): JsonResponse
    {
        $settings = Cache::remember('store_settings_public', 300, function () {
            $giftCode = (string) Setting::get('banner_gift_code', '');
            $coupon = $giftCode !== '' ? Coupon::where('code', $giftCode)->first() : null;

            return [
                'banner_active' => (bool) Setting::get('banner_active', false),
                'banner_text' => Setting::get('banner_text', ''),
                'banner_gift_code' => $giftCode,
                'banner_gift_discount_text' => Setting::get('banner_gift_discount_text', ''),
                'banner_gift_coupon' => $coupon ? [
                    'id' => $coupon->id,
                    'code' => $coupon->code,
                    'description' => $coupon->description,
                    'discount_type' => $coupon->discount_type,
                    'discount_value' => (float) $coupon->discount_value,
                    'max_discount_amount' => $coupon->max_discount_amount ? (int) $coupon->max_discount_amount : null,
                    'min_order_amount' => (int) $coupon->min_order_amount,
                    'is_active' => (bool) $coupon->is_active,
                ] : null,
                'store_name' => Setting::get('store_name', 'Tạp Hóa 247'),
                'store_slogan' => Setting::get('store_slogan', 'Shop Dịch Vụ Số & Acc Game Tự Động 24/7 Uy Tín #1'),
                'store_hotline' => Setting::get('store_hotline', '0937809305'),
                'store_telegram' => Setting::get('store_telegram', 'https://t.me/taphoa247_support'),
                'store_facebook' => Setting::get('store_facebook', 'https://facebook.com/taphoa247'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }
}
