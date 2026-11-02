<?php

namespace Tests\Feature;

use App\Jobs\FulfillPaidOrder;
use App\Jobs\SendPurchaseEvent;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Services\CatalogCache;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OperationalReliabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_is_recorded_before_fulfillment_is_queued(): void
    {
        Queue::fake();
        $order = Order::create([
            'order_code' => 'ACC-QUEUE001', 'memo' => 'ACC-QUEUE001', 'customer_name' => 'Test',
            'total_amount' => 10000, 'status' => 'pending', 'payment_gateway' => 'device_gateway',
        ]);

        $this->assertTrue(app(OrderService::class)->fulfillOrder($order, [
            'transactionID' => 'BANK-TX-QUEUE001', 'creditAmount' => 10000, 'description' => $order->memo,
        ]));

        $this->assertSame('processing', $order->fresh()->status);
        $this->assertNotNull($order->fresh()->paid_at);
        $this->assertSame(1, Payment::where('order_id', $order->id)->count());
        Queue::assertPushed(FulfillPaidOrder::class, fn (FulfillPaidOrder $job) => $job->orderId === $order->id);
        Queue::assertPushed(SendPurchaseEvent::class, fn (SendPurchaseEvent $job) => $job->orderId === $order->id);
    }

    public function test_catalog_cache_version_changes_when_product_or_category_is_saved(): void
    {
        Cache::flush();
        $category = Category::create(['name' => 'Test', 'slug' => 'test', 'icon' => 'x', 'is_active' => true]);
        $product = Product::create([
            'category_id' => $category->id, 'name' => 'Test item', 'slug' => 'test-item',
            'account_type' => 'test_item', 'price' => 10000, 'is_active' => false,
        ]);
        $oldVersion = CatalogCache::version();
        $product->update(['is_active' => true]);
        $this->assertNotSame($oldVersion, CatalogCache::version());
        $this->getJson('/api/v1/products')->assertOk()->assertJsonFragment(['slug' => 'test-item']);

        $categoryVersion = CatalogCache::version();
        $category->update(['is_active' => false]);
        $this->assertNotSame($categoryVersion, CatalogCache::version());
        $this->getJson('/api/v1/categories')->assertOk()->assertJsonMissing(['slug' => 'test']);
    }

    public function test_admin_can_filter_all_orders_with_items_marked_for_review(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);
        [$order, $product] = $this->makeOrderWithProduct('processing');
        OrderItem::create([
            'order_id' => $order->id, 'product_id' => $product->id, 'quantity' => 1,
            'unit_price' => 10000, 'subtotal' => 10000, 'fulfillment_state' => 'needs_review',
        ]);

        $this->getJson('/api/v1/admin/orders?status=needs_review')
            ->assertOk()
            ->assertJsonPath('needs_review_count', 1)
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.order_code', $order->order_code);
    }

    public function test_successful_admin_write_is_logged_without_request_secrets(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/admin/users', [
            'name' => 'Audit target', 'email' => 'audit-target@example.test',
            'password' => 'NeverStoreThisPassword123!', 'role' => 'customer',
        ])->assertCreated();

        $log = AuditLog::latest('id')->firstOrFail();
        $this->assertSame($admin->id, $log->user_id);
        $this->assertStringContainsString('POST', $log->action);
        $this->assertStringNotContainsString('NeverStoreThisPassword123!', json_encode($log->details));
    }

    private function makeOrderWithProduct(string $status): array
    {
        $category = Category::create(['name' => 'Test', 'slug' => 'test-' . uniqid(), 'icon' => 'x', 'is_active' => true]);
        $product = Product::create([
            'category_id' => $category->id, 'name' => 'Test product', 'slug' => 'item-' . uniqid(),
            'account_type' => 'type-' . uniqid(), 'price' => 10000, 'is_active' => true,
        ]);
        $order = Order::create([
            'order_code' => 'ACC-' . strtoupper(substr(uniqid(), -8)), 'memo' => 'MEMO-' . uniqid(),
            'customer_name' => 'Customer', 'total_amount' => 10000, 'status' => $status,
            'paid_at' => now(), 'payment_gateway' => 'device_gateway',
        ]);
        return [$order, $product];
    }
}
