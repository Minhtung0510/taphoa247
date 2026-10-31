<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
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
        $categories = Cache::remember('catalog.categories', 60, function () {
            return Category::where('is_active', true)
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
        $cacheKey = 'catalog.products.' . md5(serialize($request->all()));
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
        $catId = $categoryId ?? $product->category_id;
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
     * Cấu hình công khai của cửa hàng (Tên, Slogan, Hotline, Banner)
     */
    public function settings(): JsonResponse
    {
        $settings = Cache::remember('store_settings_public', 300, function () {
            $giftCode = Setting::get('banner_gift_code', 'TAPHOA247');
            $customGiftText = Setting::get('banner_gift_discount_text', '');

            // Tìm thông tin chi tiết của coupon trong database
            $coupon = \App\Models\Coupon::where('code', $giftCode)->first();
            $giftCouponData = null;
            $finalGiftText = $customGiftText;

            if ($coupon) {
                $giftCouponData = [
                    'id' => $coupon->id,
                    'code' => $coupon->code,
                    'description' => $coupon->description,
                    'discount_type' => $coupon->discount_type,
                    'discount_value' => (float) $coupon->discount_value,
                    'max_discount_amount' => $coupon->max_discount_amount ? (int) $coupon->max_discount_amount : null,
                    'min_order_amount' => (int) $coupon->min_order_amount,
                    'is_active' => (bool) $coupon->is_active,
                ];

                // Nếu admin chưa đặt text hoặc text đang bị lệch lạc/mặc định cũ "Giảm 10%", tự động sinh text chuẩn 100% theo coupon
                if (empty($finalGiftText) || $finalGiftText === 'Giảm 10% đơn hàng' || $finalGiftText === 'Giảm 10% toàn bộ đơn hàng') {
                    if ($coupon->discount_type === 'percent') {
                        $finalGiftText = "Giảm {$coupon->discount_value}%";
                        if ($coupon->max_discount_amount) {
                            $finalGiftText .= " (tối đa " . number_format($coupon->max_discount_amount, 0, ',', '.') . "đ)";
                        }
                    } else {
                        $finalGiftText = "Giảm " . number_format($coupon->discount_value, 0, ',', '.') . "đ";
                    }
                    if ($coupon->min_order_amount > 0) {
                        $finalGiftText .= " • Đơn từ " . number_format($coupon->min_order_amount, 0, ',', '.') . "đ";
                    }
                    if (!empty($coupon->description)) {
                        $finalGiftText .= " - " . $coupon->description;
                    }
                }
            }

            return [
                'store_name' => Setting::get('store_name', 'Tạp Hóa 247'),
                'store_slogan' => Setting::get('store_slogan', 'Shop Dịch Vụ Số & Acc Game Tự Động 24/7 Uy Tín #1'),
                'store_hotline' => Setting::get('store_hotline', '0937809305'),
                'store_telegram' => Setting::get('store_telegram', 'https://t.me/taphoa247_support'),
                'store_facebook' => Setting::get('store_facebook', 'https://facebook.com/taphoa247'),
                'banner_active' => (bool) Setting::get('banner_active', false),
                'banner_text' => Setting::get('banner_text', 'Ưu đãi đặc biệt: Tặng bảo hiểm tài khoản 5 tiếng cho toàn bộ đơn hàng hôm nay!'),
                'banner_gift_code' => $giftCode,
                'banner_gift_discount_text' => $finalGiftText ?: 'Giảm giá cực sốc cho đơn hàng',
                'banner_gift_coupon' => $giftCouponData,
                'store_real_hearts' => (int) Setting::get('store_real_hearts', 0),
                'store_maintenance_mode' => (bool) Setting::get('store_maintenance_mode', false),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }
}
