<?php

namespace Tests\Feature;

use App\Models\Coupon;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponRollbackOnTimeoutTest extends TestCase
{
    use RefreshDatabase;

    /**
     * S9: Khi đơn hàng timeout, used_count coupon phải được hoàn trả.
     */
    public function test_coupon_used_count_decremented_when_order_times_out(): void
    {
        $coupon = Coupon::factory()->create([
            'code'        => 'TESTROLL',
            'is_active'   => true,
            'usage_limit' => 5,
            'used_count'  => 3,
        ]);

        $order = Order::factory()->create([
            'status'      => 'pending',
            'coupon_code' => 'TESTROLL',
            'expires_at'  => now()->subMinutes(1),
        ]);

        /** @var OrderService $service */
        $service = app(OrderService::class);
        $released = $service->releaseExpiredOrders();

        $this->assertEquals(1, $released);
        $this->assertEquals(2, $coupon->fresh()->used_count); // 3 - 1 = 2
        $this->assertEquals('timeout', $order->fresh()->status);
    }

    /**
     * S9: used_count không được xuống âm dù coupon hiện đang là 0.
     */
    public function test_coupon_used_count_cannot_go_below_zero(): void
    {
        $coupon = Coupon::factory()->create([
            'code'        => 'ZEROUSE',
            'is_active'   => true,
            'usage_limit' => 5,
            'used_count'  => 0,
        ]);

        $order = Order::factory()->create([
            'status'      => 'pending',
            'coupon_code' => 'ZEROUSE',
            'expires_at'  => now()->subMinutes(1),
        ]);

        $service = app(OrderService::class);
        $service->releaseExpiredOrders();

        $this->assertEquals(0, $coupon->fresh()->used_count); // Không âm
    }

    /**
     * S9: Đơn không có coupon vẫn được release bình thường.
     */
    public function test_order_without_coupon_released_normally(): void
    {
        $order = Order::factory()->create([
            'status'      => 'pending',
            'coupon_code' => null,
            'expires_at'  => now()->subMinutes(1),
        ]);

        $service = app(OrderService::class);
        $released = $service->releaseExpiredOrders();

        $this->assertEquals(1, $released);
        $this->assertEquals('timeout', $order->fresh()->status);
    }

    /**
     * S9: Ngăn chặn hoàn lượt 2 lần (double refund) khi đơn đã timeout và admin sau đó bấm reject.
     */
    public function test_coupon_cannot_be_refunded_twice_after_timeout_and_admin_cancel(): void
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin']);

        $coupon = Coupon::factory()->create([
            'code'        => 'DOUBLECHECK',
            'is_active'   => true,
            'usage_limit' => 10,
            'used_count'  => 5,
        ]);

        $order = Order::factory()->create([
            'status'      => 'pending',
            'coupon_code' => 'DOUBLECHECK',
            'expires_at'  => now()->subMinutes(1),
        ]);

        // 1. Scheduler/Service timeout đơn hàng: used_count giảm từ 5 -> 4
        $service = app(OrderService::class);
        $service->releaseExpiredOrders();

        $freshOrder = $order->fresh();
        $this->assertEquals(4, $coupon->fresh()->used_count);
        $this->assertNotNull($freshOrder->coupon_released_at);

        // 2. Admin sau đó thực hiện từ chối / hủy đơn qua API admin
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/orders/{$freshOrder->order_code}/reject", [
                'reason' => 'Đơn hết hạn cần dọn dẹp',
            ]);

        $response->assertOk();

        // used_count vẫn phải là 4 (KHÔNG bị trừ tiếp thành 3)!
        $this->assertEquals(4, $coupon->fresh()->used_count);
    }
}
