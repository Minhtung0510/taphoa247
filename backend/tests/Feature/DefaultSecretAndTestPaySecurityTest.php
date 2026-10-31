<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class DefaultSecretAndTestPaySecurityTest extends TestCase
{
    use RefreshDatabase;

    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $cat = Category::create(['name' => 'SecCat', 'slug' => 'sec-cat']);
        $prod = Product::create([
            'category_id' => $cat->id,
            'name' => 'Sec Prod',
            'slug' => 'sec-prod',
            'account_type' => 'steam',
            'price' => 30000,
            'warranty_hours' => 2,
            'is_active' => true,
        ]);

        $this->order = Order::create([
            'order_code' => 'ORD-SEC-001',
            'total_amount' => 30000,
            'status' => 'pending',
            'memo' => 'MEMO-SEC-001',
        ]);

        $mock = \Mockery::mock(\App\Contracts\PaymentGatewayInterface::class);
        $mock->shouldReceive('isTestMode')->andReturn(true);
        $mock->shouldReceive('getBankCode')->andReturn('TPB');
        $mock->shouldReceive('getAccountNo')->andReturn('123456789');
        $mock->shouldReceive('getAccountName')->andReturn('TEST OWNER');
        $mock->shouldReceive('generateQrUrl')->andReturn('https://qr.test');
        $this->app->instance(\App\Contracts\PaymentGatewayInterface::class, $mock);
    }

    public function test_test_pay_returns_404_when_app_dev_secret_is_empty(): void
    {
        putenv('PAYMENT_TEST_MODE=true');
        putenv('APP_DEV_SECRET=');

        $response = $this->postJson("/api/v1/orders/{$this->order->order_code}/test-pay", [
            'dev_secret' => 'dtff_dev_secret_test',
        ]);

        $response->assertStatus(404);
    }

    public function test_test_pay_returns_403_when_dev_secret_is_invalid(): void
    {
        putenv('PAYMENT_TEST_MODE=true');
        putenv('APP_DEV_SECRET=strong-random-dev-secret-key-32-chars-long');

        $response = $this->postJson("/api/v1/orders/{$this->order->order_code}/test-pay", [
            'dev_secret' => 'wrong-secret',
        ]);

        $response->assertStatus(403);
    }

    public function test_preflight_fails_when_device_secret_is_default_or_weak(): void
    {
        putenv('DEVICE_GATEWAY_SECRET=DTFF_SECRET_TEST_2026');

        $exitCode = Artisan::call('app:preflight');
        $output = Artisan::output();

        $this->assertEquals(1, $exitCode);
        $this->assertStringContainsString('DEVICE_GATEWAY_SECRET', $output);
    }

    public function test_preflight_fails_when_admin_password_too_short(): void
    {
        // Đặt ADMIN_INITIAL_PASSWORD ngắn → preflight phải báo lỗi về nó
        // (Các check khác như APP_ENV, SQLite cũng có thể fail, nhưng ta chỉ quan tâm output chứa chuỗi này)
        putenv('ADMIN_INITIAL_PASSWORD=short');

        $exitCode = Artisan::call('app:preflight');
        $output   = Artisan::output();

        // preflight phải thất bại (exit 1) vì có ít nhất 1 lỗi
        $this->assertEquals(1, $exitCode);
        // Output phải đề cập đến ADMIN_INITIAL_PASSWORD
        $this->assertStringContainsString('ADMIN_INITIAL_PASSWORD', $output);
    }
}
