<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
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
            ->get();

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

        $products = $query->orderBy('sort_order', 'asc')->get();

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

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /**
     * Thống kê Social Proof (cho Live Stream / Màn hình AI làm việc)
     */
    public function stats(): JsonResponse
    {
        $stats = Cache::remember('store.live_stats', 15, function () {
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
                'total_revenue' => $totalRevenue,
                'today_orders' => $todayOrders,
                'today_revenue' => $todayRevenue,
                'recent_sales' => $recentSales,
                'live_viewers' => rand(8, 24), // Giả lập số người online
                'hearts_count' => 142 + ($totalOrders * 3),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
