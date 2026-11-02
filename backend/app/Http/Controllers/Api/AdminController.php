<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccountStock;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use App\Models\WarrantyClaim;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    /**
     * Tải nhanh toàn bộ dữ liệu quản trị chỉ trong 1 request duy nhất (giảm 85% độ trễ)
     */
    public function users(Request $request): JsonResponse
    {
        $validated = $this->validateUserFilters($request);
        $customers = \App\Models\User::where('role', 'customer');
        return response()->json([
            'success' => true,
            'data' => $this->userQuery($validated)->paginate(20),
            'summary' => [
                'total' => (clone $customers)->count(),
                'admins' => \App\Models\User::where('role', 'admin')->count(),
                'discord' => (clone $customers)->whereNotNull('discord_id')->count(),
                'unverified' => (clone $customers)->whereNull('email_verified_at')->count(),
            ],
        ]);
    }

    public function exportUsers(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $query = $this->userQuery($this->validateUserFilters($request));
        return response()->streamDownload(function () use ($query) {
            $output = fopen('php://output', 'w');
            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, ['ID', 'Tên', 'Email', 'Vai trò', 'Đăng nhập bằng', 'Email xác minh', 'Số đơn', 'Đơn hoàn tất', 'Tổng chi tiêu', 'Đăng nhập gần nhất', 'Ngày tạo']);
            $query->orderBy('id')->chunk(500, function ($users) use ($output) {
                foreach ($users as $user) {
                    $methods = array_filter([$user->has_password ? 'Email / Mật khẩu' : null, $user->discord_id ? 'Discord' : null]);
                    $cells = [
                        $user->id, $user->name, $user->email, $user->role, implode(' + ', $methods) ?: 'Chưa thiết lập',
                        $user->email_verified_at ? 'Đã xác minh' : 'Chưa xác minh', $user->orders_count,
                        $user->completed_orders_count, $user->total_spent ?? 0, $user->last_login_at,
                        optional($user->created_at)->toDateTimeString(),
                    ];
                    fputcsv($output, array_map(fn ($value) => is_string($value) && preg_match('/^\s*[=+@-]/u', $value) ? "'" . $value : $value, $cells));
                }
            });
            fclose($output);
        }, 'danh-sach-nguoi-dung-' . now()->format('Ymd-His') . '.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function validateUserFilters(Request $request): array
    {
        return $request->validate([
            'search' => 'nullable|string|max:150',
            'role' => 'nullable|in:admin,customer',
            'page' => 'nullable|integer|min:1',
            'method' => 'nullable|in:password,discord,both',
            'verified' => 'nullable|in:yes,no',
            'sort' => 'nullable|in:newest,oldest,spend,orders,login',
        ]);
    }

    private function userQuery(array $filters): \Illuminate\Database\Eloquent\Builder
    {
        $query = \App\Models\User::query()
            ->select(['id', 'name', 'email', 'role', 'discord_id', 'created_at', 'email_verified_at', 'last_login_at', 'last_login_method'])
            ->selectRaw("CASE WHEN password IS NOT NULL AND password <> '' THEN 1 ELSE 0 END AS has_password")
            ->selectRaw("CASE WHEN email LIKE '%@dtffshop.local' THEN 1 ELSE 0 END AS is_placeholder_email")
            ->withCount(['orders', 'orders as completed_orders_count' => fn ($q) => $q->where('status', 'completed'), 'claims'])
            ->withSum(['orders as total_spent' => fn ($q) => $q->whereIn('status', ['paid', 'processing', 'completed'])], 'total_amount')
            ->withMax('orders', 'created_at');
        if ($search = trim($filters['search'] ?? '')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('discord_id', $search);
                if (ctype_digit($search)) $q->orWhere('id', $search);
            });
        }
        if (!empty($filters['role'])) $query->where('role', $filters['role']);
        $method = $filters['method'] ?? null;
        if ($method === 'password' || $method === 'both') $query->whereNotNull('password')->where('password', '<>', '');
        if ($method === 'discord' || $method === 'both') $query->whereNotNull('discord_id');
        if (($filters['verified'] ?? null) === 'yes') $query->whereNotNull('email_verified_at');
        if (($filters['verified'] ?? null) === 'no') $query->whereNull('email_verified_at');
        $sort = $filters['sort'] ?? 'newest';
        match ($sort) {
            'oldest' => $query->orderBy('created_at')->orderBy('id'),
            'spend' => $query->orderByDesc('total_spent')->orderByDesc('id'),
            'orders' => $query->orderByDesc('orders_count')->orderByDesc('id'),
            'login' => $query->orderByDesc('last_login_at')->orderByDesc('id'),
            default => $query->latest('id'),
        };
        return $query;
    }

    public function createUser(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|max:128',
            'role' => 'required|in:customer,admin',
        ]);
        $user = \App\Models\User::create($data);
        return response()->json(['success' => true, 'data' => $user->only(['id', 'name', 'email', 'role'])], 201);
    }

    public function updateUser(Request $request, \App\Models\User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', \Illuminate\Validation\Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8|max:128',
            'role' => 'required|in:customer,admin',
        ]);
        if ($user->id === $request->user()->id && $data['role'] !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Không thể tự gỡ quyền quản trị của tài khoản đang đăng nhập.'], 422);
        }
        if (empty($data['password'])) unset($data['password']);
        DB::transaction(function () use ($user, $data) {
            if ($user->email !== $data['email']) $user->email_verified_at = null;
            $revoke = isset($data['password']) || $user->role !== $data['role'] || $user->email !== $data['email'];
            $user->fill($data)->save();
            if ($revoke) $user->tokens()->delete();
        });
        return response()->json(['success' => true]);
    }

    public function deleteUser(Request $request, \App\Models\User $user): JsonResponse
    {
        if ($user->id === $request->user()->id || $user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Không thể xóa tài khoản quản trị.'], 422);
        }
        return DB::transaction(function () use ($user) {
            $user = \App\Models\User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            if ($user->orders()->exists() || $user->claims()->exists()) {
                return response()->json(['success' => false, 'message' => 'Không thể xóa tài khoản có đơn hàng hoặc yêu cầu bảo hành.'], 422);
            }
            $user->tokens()->delete();
            $user->delete();
            return response()->json(['success' => true]);
        });
    }

    public function bootstrap(): JsonResponse
    {
        $dashboard = $this->dashboard()->original['data'] ?? [];
        $categories = Category::orderBy('sort_order')->get();
        $products = Product::with('category')
            ->withCount(['stocks as available_stock' => function ($q) {
                $q->where('status', 'available');
            }])
            ->orderBy('category_id')
            ->orderBy('sort_order')
            ->get();
        $orders = Order::with('items.product')->latest()->limit(50)->get();
        $revenue = $this->revenueAnalytics()->original['data'] ?? [];
        $settings = $this->getSettings()->original['data'] ?? [];
        $warranty = WarrantyClaim::with(['order', 'claimItems.orderItem.product'])->latest()->get();
        $coupons = \App\Models\Coupon::latest()->get();

        return response()->json([
            'success' => true,
            'data' => [
                'dashboard' => $dashboard,
                'categories' => $categories,
                'products' => $products,
                'orders' => $orders,
                'needs_review_count' => Order::whereHas('items', fn ($items) => $items->where('fulfillment_state', 'needs_review'))->count(),
                'revenue' => $revenue,
                'settings' => $settings,
                'warranty' => $warranty,
                'coupons' => $coupons,
            ],
        ]);
    }

    /**
     * Dashboard tổng quan
     */
    public function dashboard(): JsonResponse
    {
        $totalRevenue = Order::whereIn('status', ['paid', 'completed'])->sum('total_amount');
        $totalOrders = Order::count();
        $completedOrders = Order::whereIn('status', ['paid', 'completed'])->count();
        $totalStock = AccountStock::where('status', 'available')->count();
        $pendingClaims = WarrantyClaim::whereIn('state', ['pending', 'waiting_admin', 'waiting_stock'])->count();

        $recentOrders = Order::with('items.product')->latest()->limit(10)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_revenue' => $totalRevenue,
                'total_orders' => $totalOrders,
                'completed_orders' => $completedOrders,
                'total_stock' => $totalStock,
                'pending_claims' => $pendingClaims,
                'recent_orders' => $recentOrders,
            ],
        ]);
    }

    /**
     * Danh sách danh mục
     */
    public function categories(): JsonResponse
    {
        $categories = Category::orderBy('sort_order')->get();
        return response()->json(['success' => true, 'data' => $categories]);
    }

    /**
     * Thêm danh mục mới
     */
    public function createCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'nullable|string|max:100|unique:categories,slug',
            'description' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:2048',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']);
            $originalSlug = $validated['slug'];
            $count = 1;
            while (Category::where('slug', $validated['slug'])->exists()) {
                $validated['slug'] = "{$originalSlug}-{$count}";
                $count++;
            }
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = $validated['sort_order'] ?? 0;

        $cat = Category::create($validated);
        \Illuminate\Support\Facades\Cache::forget('catalog.categories');

        return response()->json([
            'success' => true,
            'message' => 'Thêm danh mục mới thành công!',
            'data' => $cat
        ]);
    }

    /**
     * Cập nhật danh mục
     */
    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $cat = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'nullable|string|max:100|unique:categories,slug,' . $id,
            'description' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:2048',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        if (!empty($validated['slug'])) {
            $cat->slug = \Illuminate\Support\Str::slug($validated['slug']);
        }
        $cat->name = $validated['name'];
        if (array_key_exists('description', $validated)) {
            $cat->description = $validated['description'];
        }
        if (array_key_exists('icon', $validated)) {
            $cat->icon = $validated['icon'];
        }
        if (array_key_exists('sort_order', $validated)) {
            $cat->sort_order = $validated['sort_order'];
        }
        if ($request->has('is_active')) {
            $cat->is_active = $request->boolean('is_active');
        }

        $cat->save();
        \Illuminate\Support\Facades\Cache::forget('catalog.categories');

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật danh mục thành công!',
            'data' => $cat
        ]);
    }

    /**
     * Xóa danh mục
     */
    public function deleteCategory(int $id): JsonResponse
    {
        $cat = Category::findOrFail($id);

        $prodCount = $cat->products()->count();
        if ($prodCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Không thể xóa danh mục '{$cat->name}' vì đang có {$prodCount} sản phẩm liên kết. Vui lòng chuyển hoặc xóa sản phẩm trước."
            ], 422);
        }

        $cat->delete();
        \Illuminate\Support\Facades\Cache::forget('catalog.categories');

        return response()->json([
            'success' => true,
            'message' => "Đã xóa danh mục '{$cat->name}' thành công!"
        ]);
    }

    /**
     * Danh sách sản phẩm và giá
     */
    public function products(): JsonResponse
    {
        $products = Product::with('category')
            ->withCount(['stocks as available_stock' => function ($q) {
                $q->where('status', 'available');
            }])
            ->orderBy('category_id')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['success' => true, 'data' => $products]);
    }

    /**
     * Thêm sản phẩm mới
     */
    public function createProduct(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'category_id' => 'required|exists:categories,id',
            'account_type' => 'required|string|max:100|unique:products,account_type',
            'price' => 'required|integer|min:1000|max:100000000',
            'warranty_hours' => 'nullable|integer|min:0|max:8760',
            'is_off_mode' => 'nullable|boolean',
            'is_auto_warranty' => 'nullable|boolean',
            'short_description' => 'nullable|string|max:500',
            'details_markdown' => 'nullable|string',
            'image_url' => ['nullable', 'string', 'max:2048', 'regex:~^(https?://|/(?!/))~i'],
        ]);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-" . ($counter++);
        }

        $product = Product::create([
            'category_id' => $validated['category_id'],
            'name' => trim($validated['name']),
            'slug' => $slug,
            'account_type' => trim($validated['account_type']),
            'price' => (int) $validated['price'],
            'warranty_hours' => $validated['warranty_hours'] ?? 2,
            'is_off_mode' => $validated['is_off_mode'] ?? false,
            'is_auto_warranty' => $validated['is_auto_warranty'] ?? true,
            'short_description' => $validated['short_description'] ?? null,
            'details_markdown' => $validated['details_markdown'] ?? null,
            'image_url' => $validated['image_url'] ?? null,
            'is_active' => true,
            'sort_order' => (int) (Product::max('sort_order') ?? 0) + 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Đã thêm sản phẩm '{$product->name}' thành công!",
            'data' => $product->load('category'),
        ], 201);
    }

    /**
     * Sửa toàn diện sản phẩm
     */
    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'category_id' => 'sometimes|required|exists:categories,id',
            'account_type' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                "unique:products,account_type,{$id}",
            ],
            'price' => 'sometimes|required|integer|min:1000|max:100000000',
            'warranty_hours' => 'sometimes|integer|min:0|max:8760',
            'is_off_mode' => 'sometimes|boolean',
            'is_auto_warranty' => 'nullable|boolean',
            'is_active' => 'sometimes|required|boolean',
            'short_description' => 'nullable|string|max:500',
            'details_markdown' => 'nullable|string',
            'image_url' => ['nullable', 'string', 'max:2048', 'regex:~^(https?://|/(?!/))~i'],
        ]);

        if ($validated === []) {
            return response()->json([
                'success' => false,
                'message' => 'Không có thông tin sản phẩm nào để cập nhật.',
            ], 422);
        }

        foreach (['name', 'account_type'] as $field) {
            if (array_key_exists($field, $validated)) {
                $validated[$field] = trim($validated[$field]);
            }
        }
        if (array_key_exists('price', $validated)) {
            $validated['price'] = (int) $validated['price'];
        }

        $product->update($validated);
        if (($validated['is_active'] ?? false) === true) {
            $product->category()->update(['is_active' => true]);
        }
        \Illuminate\Support\Facades\Cache::forget('catalog.categories');

        return response()->json([
            'success' => true,
            'message' => "Đã cập nhật thông tin '{$product->name}' thành công!",
            'data' => $product->load('category'),
        ]);
    }

    /**
     * Xóa sản phẩm
     */
    public function deleteProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $name = $product->name;

        // Kiểm tra xem sản phẩm có đơn hàng đã mua không
        $hasPaidOrders = OrderItem::where('product_id', $id)->exists();

        if ($hasPaidOrders && !$request->boolean('force')) {
            $product->update(['is_active' => false]);
            return response()->json([
                'success' => true,
                'message' => "Sản phẩm '{$name}' đã có lịch sử đơn hàng nên hệ thống chuyển sang trạng thái [Ngưng Bán/Ẩn] để bảo toàn dữ liệu.",
                'action' => 'deactivated',
            ]);
        }

        $product->stocks()->delete();
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => "Đã xóa vĩnh viễn sản phẩm '{$name}' khỏi hệ thống!",
            'action' => 'deleted',
        ]);
    }

    /**
     * Cập nhật nhanh giá sản phẩm
     */
    public function updatePrice(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'price' => 'required|integer|min:1000|max:100000000',
        ]);

        $product = Product::findOrFail($id);
        $product->update(['price' => $validated['price']]);

        return response()->json([
            'success' => true,
            'message' => "Đã cập nhật giá cho {$product->name} thành " . number_format($product->price) . " VNĐ",
            'data' => $product,
        ]);
    }

    /**
     * Nạp kho tài khoản (hỗ trợ nhập text hoặc tải file TXT)
     */
    public function importStock(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'raw_text' => 'nullable|string',
            'file' => 'nullable|file|mimes:txt',
        ]);

        $product = Product::findOrFail($request->product_id);

        $content = '';
        if ($request->hasFile('file')) {
            $content = file_get_contents($request->file('file')->getRealPath());
        } elseif ($request->filled('raw_text')) {
            $content = $request->raw_text;
        } else {
            return response()->json(['success' => false, 'message' => 'Vui lòng nhập nội dung text hoặc tải lên file TXT'], 422);
        }

        $rawAccs = $this->splitRawAccounts($content);
        if (empty($rawAccs)) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy tài khoản hợp lệ trong nội dung'], 422);
        }

        $imported = 0;
        $duplicates = 0;

        foreach ($rawAccs as $raw) {
            $clean = trim($raw);
            if (empty($clean)) continue;

            $hash = hash('sha256', $clean);
            if (AccountStock::where('credentials_hash', $hash)->exists()) {
                $duplicates++;
                continue;
            }

            AccountStock::create([
                'product_id' => $product->id,
                'account_type' => $product->account_type,
                'credentials' => $clean,
                'credentials_hash' => $hash,
                'status' => 'available',
            ]);
            $imported++;
        }

        // Tự động kích hoạt giao các đơn đang chờ kho
        $fulfilledWaiting = $this->orderService->fulfillWaitingStockOrders();

        return response()->json([
            'success' => true,
            'message' => "Đã nạp thành công {$imported} tài khoản vào kho ({$duplicates} acc bị trùng lặp bỏ qua). Đã đưa {$fulfilledWaiting} đơn chờ kho vào hàng đợi xử lý.",
            'data' => [
                'imported_count' => $imported,
                'duplicates_count' => $duplicates,
                'fulfilled_waiting' => $fulfilledWaiting,
            ],
        ]);
    }

    /**
     * Danh sách đơn hàng
     */
    public function orders(Request $request): JsonResponse
    {
        $query = Order::with('items.product')->latest();

        if ($request->filled('status')) {
            if ($request->status === 'needs_review') {
                $query->whereHas('items', fn ($items) => $items->where('fulfillment_state', 'needs_review'));
            } else {
                $query->where('status', $request->status);
            }
        }

        if ($request->filled('search')) {
            $s = str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], trim((string) $request->search));
            $query->where(function ($q) use ($s) {
                $q->where('order_code', 'like', "%{$s}%")
                  ->orWhere('customer_name', 'like', "%{$s}%")
                  ->orWhere('customer_email', 'like', "%{$s}%")
                  ->orWhere('memo', 'like', "%{$s}%");
            });
        }

        $orders = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $orders,
            'needs_review_count' => Order::whereHas('items', fn ($items) => $items->where('fulfillment_state', 'needs_review'))->count(),
        ]);
    }

    public function auditLogs(): JsonResponse
    {
        $logs = \App\Models\AuditLog::with('user:id,name,email')->latest()->paginate(30);
        return response()->json(['success' => true, 'data' => $logs]);
    }

    /**
     * Admin duyệt/khớp đơn thanh toán thủ công
     */
    public function forceCompleteOrder(string $orderCode): JsonResponse
    {
        $order = Order::where('order_code', $orderCode)->firstOrFail();
        if ($order->isPaid()) {
            return response()->json(['success' => false, 'message' => 'Đơn hàng này đã thanh toán trước đó.'], 422);
        }

        $tx = [
            'transactionID' => 'MANUAL-ADMIN-' . $order->order_code . '-' . Str::upper(Str::random(8)),
            'creditAmount' => $order->total_amount,
            'description' => $order->memo,
            'transactionDate' => now()->toDateTimeString(),
        ];

        if (!$this->orderService->fulfillOrder($order, $tx)) {
            return response()->json(['success' => false, 'message' => 'Không thể ghi nhận thanh toán cho đơn hàng này.'], 409);
        }

        return response()->json([
            'success' => true,
            'message' => "Đã duyệt thanh toán cho đơn {$order->order_code}; hệ thống đang xử lý giao hàng.",
            'data' => $order->fresh(['items']),
        ]);
    }

    /**
     * Admin từ chối / hủy bỏ đơn hàng (đơn trùng, spam, không chuyển khoản...)
     */
    public function rejectOrder(Request $request, string $orderCode): JsonResponse
    {
        $order = Order::where('order_code', $orderCode)->firstOrFail();
        if ($order->isPaid()) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể từ chối đơn hàng đã thanh toán thành công.'
            ], 422);
        }

        $reason = $request->input('reason', 'Admin từ chối / hủy đơn hàng trùng lặp hoặc không hợp lệ');

        // Hoàn trả tồn kho nếu có tài khoản đang bị reserve
        AccountStock::where('order_id', $order->id)
            ->where('status', 'reserved')
            ->update([
                'status' => 'available',
                'order_id' => null,
                'reserved_at' => null,
            ]);

        // Hoàn trả lượt sử dụng coupon nếu đơn có áp mã giảm giá và CHƯA từng được hoàn
        if (!empty($order->coupon_code) && $order->coupon_released_at === null) {
            Coupon::where('code', $order->coupon_code)
                ->where('used_count', '>', 0)
                ->decrement('used_count');
            $order->coupon_released_at = now();
        }

        // Cập nhật trạng thái đơn thành cancelled
        $order->status = 'cancelled';
        $order->save();

        return response()->json([
            'success' => true,
            'message' => "Đã hủy bỏ / từ chối đơn hàng {$order->order_code} thành công.",
            'data' => $order,
        ]);
    }

    /**
     * Danh sách yêu cầu bảo hành
     */
    public function warrantyClaims(Request $request): JsonResponse
    {
        $query = WarrantyClaim::with(['order', 'claimItems.orderItem.product'])->latest();

        if ($request->filled('state')) {
            $query->where('state', $request->state);
        }

        $claims = $query->paginate(15);

        return response()->json(['success' => true, 'data' => $claims]);
    }

    /**
     * Duyệt yêu cầu bảo hành và bù acc thủ công
     */
    public function approveClaim(Request $request, int $claimId): JsonResponse
    {
        $request->validate([
            'replacements' => 'nullable|array',
            'admin_note' => 'nullable|string|max:1000',
        ]);

        $claim = WarrantyClaim::with('claimItems.orderItem.product')->findOrFail($claimId);
        if (in_array($claim->state, ['approved', 'rejected'])) {
            return response()->json(['success' => false, 'message' => 'Yêu cầu này đã được xử lý trước đó.'], 422);
        }

        try {
            DB::transaction(function () use ($claim, $request) {
                foreach ($claim->claimItems as $idx => $claimItem) {
                    $rawReplacement = $request->replacements[$idx] ?? null;

                    if (!empty($rawReplacement)) {
                        // Admin tự tay nhập acc bù
                        $stock = AccountStock::create([
                            'product_id' => $claimItem->orderItem->product_id,
                            'account_type' => $claimItem->orderItem->product->account_type,
                            'credentials' => trim($rawReplacement),
                            'credentials_hash' => hash('sha256', trim($rawReplacement)),
                            'status' => 'replaced',
                            'order_id' => $claim->order_id,
                            'sold_at' => now(),
                        ]);
                    } else {
                        // Tự động tìm acc có sẵn trong kho
                        $stock = AccountStock::where('product_id', $claimItem->orderItem->product_id)
                            ->where('status', 'available')
                            ->lockForUpdate()
                            ->first();

                        if (!$stock) {
                            throw new \Exception("Kho hiện tại không có tài khoản {$claimItem->orderItem->product->name} trống để cấp bù. Vui lòng nạp kho hoặc nhập tay tài khoản bù.");
                        }

                        $stock->update([
                            'status' => 'replaced',
                            'order_id' => $claim->order_id,
                            'sold_at' => now(),
                        ]);
                    }

                    $claimItem->update(['replacement_stock_id' => $stock->id]);

                    // Cập nhật tài khoản mới vào đơn hàng để khách thấy ngay
                    $claimItem->orderItem->update([
                        'delivered_credentials' => $stock->credentials,
                        'replacement_count' => $claimItem->orderItem->replacement_count + 1,
                    ]);
                }

                $claim->update([
                    'state' => 'approved',
                    'admin_note' => $request->admin_note ?: 'Đã duyệt cấp bù tài khoản mới',
                    'resolved_by' => $request->user()?->id,
                    'resolved_at' => now(),
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Đã duyệt yêu cầu bảo hành và cấp acc bù thành công cho khách hàng.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Từ chối bảo hành
     */
    public function rejectClaim(Request $request, int $claimId): JsonResponse
    {
        $request->validate([
            'admin_note' => 'required|string|max:1000',
        ]);

        $cleanNote = htmlspecialchars(strip_tags(trim($request->admin_note)), ENT_QUOTES, 'UTF-8');

        $claim = WarrantyClaim::findOrFail($claimId);
        $claim->update([
            'state' => 'rejected',
            'admin_note' => $cleanNote,
            'resolved_by' => $request->user()?->id,
            'resolved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã từ chối yêu cầu bảo hành.',
        ]);
    }

    protected function splitRawAccounts(string $text): array
    {
        $text = trim($text);
        if (empty($text)) return [];

        // Kiểm tra xem có phải định dạng khối log game (ngăn cách bởi dấu gạch ngang hoặc từ khóa Username:/User:)
        if (preg_match('/-{5,}/', $text) || stripos($text, 'Username:') !== false || stripos($text, 'User:') !== false) {
            // 1. Phân tách theo dấu gạch ngang
            if (preg_match('/-{5,}/', $text)) {
                $blocks = preg_split('/-{5,}/', $text);
                $result = [];
                foreach ($blocks as $b) {
                    $clean = trim($b);
                    if (!empty($clean) && (stripos($clean, 'Username:') !== false || stripos($clean, 'User:') !== false || str_contains($clean, ':'))) {
                        $result[] = $clean;
                    }
                }
                if (!empty($result)) return $result;
            }

            // 2. Phân tách theo Username: hoặc User: đầu dòng nếu không có dấu gạch ngang
            $blocks = preg_split('/(?=^(?:Username|User):\s*)/im', $text);
            $result = [];
            foreach ($blocks as $b) {
                $clean = trim($b);
                if (!empty($clean) && (stripos($clean, 'Username:') !== false || stripos($clean, 'User:') !== false)) {
                    $result[] = $clean;
                }
            }
            if (!empty($result)) return $result;
        }

        // 3. Định dạng danh sách 1 dòng 1 tài khoản (user:pass hoặc user|pass)
        return array_values(array_filter(array_map('trim', explode("\n", $text)), function ($line) {
            return !empty($line) && !str_starts_with($line, '---') && !str_starts_with($line, '#');
        }));
    }

    /**
     * Bảng phân tích doanh thu chi tiết cho Admin
     */
    public function revenueAnalytics(): JsonResponse
    {
        $paidQuery = Order::whereIn('status', ['paid', 'completed']);

        // Doanh thu các mốc thời gian
        $allTimeRevenue = (clone $paidQuery)->sum('total_amount');
        $allTimeOrders = (clone $paidQuery)->count();
        $totalOrdersCreated = Order::count();
        $conversionRate = $totalOrdersCreated > 0 ? round(($allTimeOrders / $totalOrdersCreated) * 100, 1) : 0;

        $todayRevenue = (clone $paidQuery)->whereDate('paid_at', today())->sum('total_amount');
        $todayOrders = (clone $paidQuery)->whereDate('paid_at', today())->count();

        $sevenDaysAgo = now()->subDays(7)->startOfDay();
        $last7DaysRevenue = (clone $paidQuery)->where('paid_at', '>=', $sevenDaysAgo)->sum('total_amount');
        $last7DaysOrders = (clone $paidQuery)->where('paid_at', '>=', $sevenDaysAgo)->count();

        $thirtyDaysAgo = now()->subDays(30)->startOfDay();
        $last30DaysRevenue = (clone $paidQuery)->where('paid_at', '>=', $thirtyDaysAgo)->sum('total_amount');
        $last30DaysOrders = (clone $paidQuery)->where('paid_at', '>=', $thirtyDaysAgo)->count();

        // Doanh thu theo từng danh mục Game (Gộp truy vấn JOIN tối ưu, giải quyết triệt để N+1)
        $rawCatStats = DB::table('categories')
            ->leftJoin('products', 'products.category_id', '=', 'categories.id')
            ->leftJoin('order_items', 'order_items.product_id', '=', 'products.id')
            ->leftJoin('orders', function ($join) {
                $join->on('order_items.order_id', '=', 'orders.id')
                     ->whereIn('orders.status', ['paid', 'completed']);
            })
            ->select(
                'categories.id',
                'categories.name',
                'categories.slug',
                'categories.icon',
                DB::raw('COALESCE(SUM(order_items.subtotal), 0) as total_revenue'),
                DB::raw('COUNT(DISTINCT order_items.id) as total_sold')
            )
            ->groupBy('categories.id', 'categories.name', 'categories.slug', 'categories.icon')
            ->orderBy('categories.sort_order')
            ->get();

        $revenueByCategory = [];
        foreach ($rawCatStats as $row) {
            $catRevenue = (int) $row->total_revenue;
            $percentage = $allTimeRevenue > 0 ? round(($catRevenue / $allTimeRevenue) * 100, 1) : 0;
            $revenueByCategory[] = [
                'id' => (int) $row->id,
                'name' => $row->name,
                'slug' => $row->slug,
                'icon' => $row->icon,
                'total_revenue' => $catRevenue,
                'total_sold' => (int) $row->total_sold,
                'percentage' => $percentage,
            ];
        }

        // Top 5 sản phẩm bán chạy nhất
        $topProducts = OrderItem::whereHas('order', function ($q) {
            $q->whereIn('status', ['paid', 'completed']);
        })
        ->with('product.category')
        ->selectRaw('product_id, count(*) as total_sold, sum(subtotal) as total_revenue')
        ->groupBy('product_id')
        ->orderByDesc('total_revenue')
        ->limit(5)
        ->get()
        ->map(function ($item) {
            return [
                'product_id' => $item->product_id,
                'name' => $item->product?->name ?? 'Tài khoản',
                'category' => $item->product?->category?->name ?? 'Game',
                'total_sold' => (int) $item->total_sold,
                'total_revenue' => (int) $item->total_revenue,
            ];
        });

        // Doanh thu theo từng ngày (7 ngày gần nhất)
        $dailyBreakdown = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $dayLabel = now()->subDays($i)->format('d/m');
            $dayRevenue = (clone $paidQuery)->whereDate('paid_at', $date)->sum('total_amount');
            $dayOrders = (clone $paidQuery)->whereDate('paid_at', $date)->count();

            $dailyBreakdown[] = [
                'date' => $date,
                'label' => $dayLabel,
                'revenue' => (int) $dayRevenue,
                'orders' => (int) $dayOrders,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'all_time_revenue' => (int) $allTimeRevenue,
                'all_time_orders' => (int) $allTimeOrders,
                'total_orders_created' => (int) $totalOrdersCreated,
                'conversion_rate' => $conversionRate,
                'today_revenue' => (int) $todayRevenue,
                'today_orders' => (int) $todayOrders,
                'last_7_days_revenue' => (int) $last7DaysRevenue,
                'last_7_days_orders' => (int) $last7DaysOrders,
                'last_30_days_revenue' => (int) $last30DaysRevenue,
                'last_30_days_orders' => (int) $last30DaysOrders,
                'revenue_by_category' => $revenueByCategory,
                'top_products' => $topProducts,
                'daily_breakdown' => $dailyBreakdown,
            ],
        ]);
    }

    /**
     * Lấy cấu hình website cho Admin
     */
    public function getSettings(): JsonResponse
    {
        $giftCode = Setting::get('banner_gift_code', 'TAPHOA247');
        $coupon = \App\Models\Coupon::where('code', $giftCode)->first();
        $giftText = Setting::get('banner_gift_discount_text', '');

        if ($coupon && (empty($giftText) || $giftText === 'Giảm 10% đơn hàng' || $giftText === 'Giảm 10% toàn bộ đơn hàng')) {
            $giftText = $coupon->discount_type === 'percent'
                ? "Giảm {$coupon->discount_value}%"
                : "Giảm " . number_format($coupon->discount_value, 0, ',', '.') . "đ";
            if ($coupon->max_discount_amount) {
                $giftText .= " (tối đa " . number_format($coupon->max_discount_amount, 0, ',', '.') . "đ)";
            }
            if ($coupon->min_order_amount > 0) {
                $giftText .= " • Đơn từ " . number_format($coupon->min_order_amount, 0, ',', '.') . "đ";
            }
            if (!empty($coupon->description)) {
                $giftText .= " - " . $coupon->description;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'store_name' => Setting::get('store_name', 'Tạp Hóa 247'),
                'store_slogan' => Setting::get('store_slogan', 'Shop Dịch Vụ Số & Acc Game Tự Động 24/7 Uy Tín #1'),
                'store_hotline' => Setting::get('store_hotline', '0937809305'),
                'store_telegram' => Setting::get('store_telegram', 'https://t.me/taphoa247_support'),
                'store_facebook' => Setting::get('store_facebook', 'https://facebook.com/taphoa247'),
                'banner_active' => Setting::get('banner_active', false),
                'banner_text' => Setting::get('banner_text', 'Ưu đãi đặc biệt: Tặng bảo hiểm tài khoản 5 tiếng cho toàn bộ đơn hàng hôm nay!'),
                'banner_gift_code' => $giftCode,
                'banner_gift_discount_text' => $giftText ?: 'Giảm giá cực sốc',
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
                'store_real_hearts' => (int) Setting::get('store_real_hearts', 0),
                'store_maintenance_mode' => Setting::get('store_maintenance_mode', false),
            ],
        ]);
    }

    /**
     * Cập nhật cấu hình website từ Admin
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_name' => 'nullable|string|max:100',
            'store_slogan' => 'nullable|string|max:255',
            'store_hotline' => 'nullable|string|max:30',
            'store_telegram' => 'nullable|string|max:255',
            'store_facebook' => 'nullable|string|max:255',
            'banner_active' => 'nullable|boolean',
            'banner_text' => 'nullable|string|max:500',
            'banner_gift_code' => 'nullable|string|max:64',
            'banner_gift_discount_text' => 'nullable|string|max:255',
            'store_real_hearts' => 'nullable|integer|min:0|max:1000000',
            'store_maintenance_mode' => 'nullable|boolean',
        ]);

        if (!empty($validated['banner_gift_code'])) {
            $coupon = \App\Models\Coupon::where('code', $validated['banner_gift_code'])->first();
            if ($coupon) {
                if (empty($validated['banner_gift_discount_text']) || $validated['banner_gift_discount_text'] === 'Giảm 10% đơn hàng' || $validated['banner_gift_discount_text'] === 'Giảm 10% toàn bộ đơn hàng') {
                    $autoText = $coupon->discount_type === 'percent'
                        ? "Giảm {$coupon->discount_value}%"
                        : "Giảm " . number_format($coupon->discount_value, 0, ',', '.') . "đ";
                    if ($coupon->max_discount_amount) {
                        $autoText .= " (tối đa " . number_format($coupon->max_discount_amount, 0, ',', '.') . "đ)";
                    }
                    if ($coupon->min_order_amount > 0) {
                        $autoText .= " • Đơn từ " . number_format($coupon->min_order_amount, 0, ',', '.') . "đ";
                    }
                    if (!empty($coupon->description)) {
                        $autoText .= " - " . $coupon->description;
                    }
                    $validated['banner_gift_discount_text'] = $autoText;
                }
            }
        }

        foreach ($validated as $key => $value) {
            $type = is_bool($value) ? 'boolean' : (is_int($value) ? 'integer' : 'string');
            Setting::set($key, $value, $type);
        }

        // Xóa sạch cache cấu hình công khai lập tức để client nhận ngay
        \Illuminate\Support\Facades\Cache::forget('store_settings_public');

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật cấu hình cửa hàng thành công!',
            'data' => $this->getSettings()->original['data'],
        ]);
    }
}
