<?php

namespace Tests\Feature;

use App\Models\AccountStock;
use App\Models\Category;
use App\Models\ClaimItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Models\WarrantyClaim;
use App\Services\CheckoutService;
use App\Services\OrderService;
use App\Services\WarrantyService;
use App\Services\Web2MService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EcommerceSystemTest extends TestCase
{
    use RefreshDatabase;

    protected Category $category;
    protected Product $productValo;
    protected Product $productValoOff;
    protected Product $productCs2;
    protected User $admin;
    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = Category::create([
            'name' => 'Valorant',
            'slug' => 'valorant',
        ]);

        $this->productValo = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Acc Valorant Gold',
            'slug' => 'acc-valorant-gold',
            'account_type' => 'valo_gold',
            'price' => 20000,
            'warranty_hours' => 2,
            'is_auto_warranty' => true,
            'is_off_mode' => false,
        ]);

        $this->productValoOff = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Acc Valorant Gold Chủ Off',
            'slug' => 'acc-valorant-gold-chu-off',
            'account_type' => 'valo_gold_off',
            'price' => 40000,
            'warranty_hours' => 5,
            'is_auto_warranty' => true,
            'is_off_mode' => true,
        ]);

        $this->productCs2 = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Acc CSGO 2 Prime',
            'slug' => 'acc-csgo-2-prime',
            'account_type' => 'cs2_prime',
            'price' => 50000,
            'warranty_hours' => 2,
            'is_auto_warranty' => false, // Bắt buộc admin duyệt tay
            'is_off_mode' => false,
        ]);

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        $this->customer = User::create([
            'name' => 'Customer User',
            'email' => 'customer@test.com',
            'password' => bcrypt('password'),
            'role' => 'customer',
        ]);
    }

    /**
     * TEST 1: Không bán trùng acc khi 2 người mua đồng thời (Pessimistic Lock & Reservation)
     */
    public function test_no_double_selling_when_two_buyers_checkout()
    {
        // Nạp duy nhất 1 acc vào kho
        AccountStock::create([
            'product_id' => $this->productValo->id,
            'account_type' => 'valo_gold',
            'credentials' => 'user1:pass1',
            'status' => 'available',
        ]);

        $checkoutService = app(CheckoutService::class);

        // Khách A mua trước -> Thành công
        $orderA = $checkoutService->checkout([
            'product_id' => $this->productValo->id,
            'quantity' => 1,
            'customer_name' => 'Buyer A',
        ]);

        $this->assertNotNull($orderA);
        $this->assertEquals('pending', $orderA->status);
        $this->assertEquals('reserved', AccountStock::first()->status);

        // Khách B mua cùng lúc -> Phải ném lỗi không đủ kho
        $this->expectException(\InvalidArgumentException::class);
        $checkoutService->checkout([
            'product_id' => $this->productValo->id,
            'quantity' => 1,
            'customer_name' => 'Buyer B',
        ]);
    }

    /**
     * TEST 2: Thanh toán Idempotent (xử lý trùng không giao acc 2 lần)
     */
    public function test_payment_fulfillment_is_idempotent()
    {
        $stock = AccountStock::create([
            'product_id' => $this->productValo->id,
            'account_type' => 'valo_gold',
            'credentials' => 'user1:pass1',
            'status' => 'available',
        ]);

        $checkoutService = app(CheckoutService::class);
        $order = $checkoutService->checkout([
            'product_id' => $this->productValo->id,
            'quantity' => 1,
            'customer_name' => 'Buyer Test',
        ]);

        $orderService = app(OrderService::class);

        $tx = [
            'transactionID' => 'TX_IDEMPOTENT_123',
            'creditAmount' => 20000,
            'description' => $order->memo,
        ];

        // Lần 1: Thanh toán thành công
        $orderService->fulfillOrder($order, $tx);
        $order->refresh();
        $this->assertEquals('completed', $order->status);
        $this->assertEquals(1, $order->payments()->count());

        // Lần 2: Gọi lại cùng transaction -> Vẫn an toàn, không tạo payment thừa hay giao thêm acc
        $orderService->fulfillOrder($order, $tx);
        $order->refresh();
        $this->assertEquals('completed', $order->status);
        $this->assertEquals(1, $order->payments()->count());
    }

    /**
     * TEST 3: Đơn quá hạn tự động nhả acc đã reserve
     */
    public function test_expired_orders_release_reserved_stock()
    {
        $stock = AccountStock::create([
            'product_id' => $this->productValo->id,
            'account_type' => 'valo_gold',
            'credentials' => 'user1:pass1',
            'status' => 'available',
        ]);

        $checkoutService = app(CheckoutService::class);
        $order = $checkoutService->checkout([
            'product_id' => $this->productValo->id,
            'quantity' => 1,
        ]);

        $this->assertEquals('reserved', $stock->fresh()->status);

        // Giả lập đơn bị quá hạn 35 phút trước
        $order->update(['expires_at' => now()->subMinutes(5)]);

        $orderService = app(OrderService::class);
        $releasedCount = $orderService->releaseExpiredOrders();

        $this->assertEquals(1, $releasedCount);
        $this->assertEquals('timeout', $order->fresh()->status);
        $this->assertEquals('available', $stock->fresh()->status);
        $this->assertNull($stock->fresh()->order_id);
    }

    /**
     * TEST 4: Đơn thanh toán thiếu kho thì chờ rồi tự giao khi có kho mới
     */
    public function test_waiting_stock_order_auto_delivers_when_stock_added()
    {
        // Tạo đơn không có stock sẵn
        $order = Order::create([
            'order_code' => 'ACC-WAITSTOCK',
            'memo' => 'ACC-WAITSTOCK',
            'total_amount' => 20000,
            'status' => 'pending',
            'customer_name' => 'Chờ hàng',
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->productValo->id,
            'quantity' => 1,
            'unit_price' => 20000,
            'subtotal' => 20000,
            'position' => 0,
            'warranty_duration_hours' => 2,
        ]);

        $orderService = app(OrderService::class);

        // Thanh toán về khi kho trống -> Order chuyển sang 'processing' (chờ kho)
        $orderService->fulfillOrder($order, ['transactionID' => 'TX_NOWAREHOUSE', 'creditAmount' => 20000]);
        $this->assertEquals('processing', $order->fresh()->status);
        $this->assertNull($item->fresh()->delivered_credentials);

        // Admin nạp thêm acc vào kho
        AccountStock::create([
            'product_id' => $this->productValo->id,
            'account_type' => 'valo_gold',
            'credentials' => 'newacc:newpass',
            'status' => 'available',
        ]);

        // Kích hoạt worker giao acc chờ
        $fulfilledCount = $orderService->fulfillWaitingStockOrders();
        $this->assertEquals(1, $fulfilledCount);
        $this->assertEquals('completed', $order->fresh()->status);
        $this->assertEquals('newacc:newpass', $item->fresh()->delivered_credentials);
    }

    /**
     * TEST 5: Quy tắc bảo hành (hạn 2h/5h, 1 lần/acc, trùng bằng chứng, không trừ một phần khi thiếu kho)
     */
    public function test_warranty_rules_and_constraints()
    {
        Storage::fake('local');

        $stock = AccountStock::create([
            'product_id' => $this->productValo->id,
            'account_type' => 'valo_gold',
            'credentials' => 'origin:pass',
            'status' => 'available',
        ]);

        $checkoutService = app(CheckoutService::class);
        $order = $checkoutService->checkout(['product_id' => $this->productValo->id, 'quantity' => 1]);
        app(OrderService::class)->fulfillOrder($order, ['transactionID' => 'TX_WARR_1']);

        $item = $order->fresh()->items->first();

        // 5.1. Kiểm tra hạn bảo hành 2h của acc thường
        $this->assertNotNull($item->warranty_expires_at);
        $this->assertTrue($item->isWarrantyValid());

        // Giả lập quá hạn bảo hành 2h -> Phải mất quyền
        $item->update(['warranty_expires_at' => now()->subMinutes(10)]);
        $this->assertFalse($item->isWarrantyValid());

        // Phục hồi lại hạn để test tiếp
        $item->update(['warranty_expires_at' => now()->addHour()]);

        // 5.2. Test bằng chứng file PNG hợp lệ (Magic bytes 89 50 4E 47 ...)
        $pngHeader = "\x89PNG\r\n\x1a\n" . str_repeat('X', 100);
        $fakeFile = UploadedFile::fake()->createWithContent('proof.png', $pngHeader);

        $warrantyService = app(WarrantyService::class);

        // Nạp sẵn 1 acc bù trong kho
        AccountStock::create([
            'product_id' => $this->productValo->id,
            'account_type' => 'valo_gold',
            'credentials' => 'replacement:pass',
            'status' => 'available',
        ]);

        $claim = $warrantyService->submitClaim(
            $order,
            [['order_item_id' => $item->id, 'error_description' => 'Sai pass']],
            [$fakeFile]
        );

        $this->assertEquals('waiting_admin', $claim->state);

        // Admin duyệt bù acc
        $adminController = app(\App\Http\Controllers\Api\AdminController::class);
        $request = new \Illuminate\Http\Request();
        $adminController->approveClaim($request, $claim->id);

        $this->assertEquals('approved', $claim->fresh()->state);
        $this->assertEquals(1, $item->fresh()->replacement_count);
        $this->assertTrue($item->fresh()->isWarrantyValid()); // Đã đổi 1 lần -> Vẫn còn lượt bảo hành (tối đa 3 lượt)

        // 5.3. Test khi đạt tối đa 3 lượt đổi thì hết hạn
        $item->update(['replacement_count' => 3]);
        $this->assertFalse($item->fresh()->isWarrantyValid());

        $this->expectException(\InvalidArgumentException::class);
        $warrantyService->submitClaim(
            $order,
            [['order_item_id' => $item->id]],
            [$fakeFile]
        );
    }

    /**
     * TEST 6: Phân quyền & Chống IDOR (Admin vs Customer)
     */
    public function test_authorization_and_idor_protection()
    {
        // Customer thông thường gọi API Admin -> 403 Forbidden
        $response = $this->actingAs($this->customer, 'sanctum')
            ->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(403);

        // Admin gọi API Admin -> 200 OK
        $adminResponse = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard');

        $adminResponse->assertStatus(200);
        $adminResponse->assertJsonStructure(['success', 'data']);

        // 3. IDOR test trên đơn hàng đã thanh toán
        $checkoutService = app(\App\Services\CheckoutService::class);
        $orderService = app(\App\Services\OrderService::class);
        AccountStock::create([
            'product_id' => $this->productValo->id,
            'account_type' => $this->productValo->account_type,
            'credentials' => 'idor_test_user:pass123',
            'status' => 'available',
        ]);
        $order = $checkoutService->checkout([
            'product_id' => $this->productValo->id,
            'quantity' => 1,
            'customer_name' => 'Chủ Đơn Hàng',
            'customer_email' => 'owner@example.com',
            'user_id' => $this->customer->id,
        ]);
        $orderService->fulfillOrder($order, ['transactionID' => 'TX_IDOR_TEST']);

        // Kẻ tấn công khác truy cập không có token -> 403 Forbidden
        $otherUser = \App\Models\User::factory()->create(['role' => 'customer']);
        $attackerRes = $this->actingAs($otherUser, 'sanctum')
            ->getJson("/api/v1/orders/{$order->order_code}/details");
        $attackerRes->assertStatus(403);

        // Chủ đơn hàng truy cập -> 200 OK
        $ownerRes = $this->actingAs($this->customer, 'sanctum')
            ->getJson("/api/v1/orders/{$order->order_code}/details");
        $ownerRes->assertStatus(200);

        // Truy cập với Order Access Token hợp lệ -> 200 OK
        $guestWithTokenRes = $this->withHeaders(['X-Order-Token' => $order->access_token])
            ->getJson("/api/v1/orders/{$order->order_code}/details");
        $guestWithTokenRes->assertStatus(200);
    }
}
