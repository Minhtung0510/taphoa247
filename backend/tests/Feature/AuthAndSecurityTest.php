<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthAndSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_security_headers_and_shield_present()
    {
        $response = $this->get('/api/v1/products');
        $response->assertStatus(200);
        $response->assertHeader('X-Shield', 'DTFF-AntiDDoS-Active');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    public function test_ddos_and_path_traversal_blocked()
    {
        $response = $this->get('/api/v1/products/../../../etc/passwd');
        $response->assertStatus(403);
        $this->assertFalse($response->json('success'));
    }

    public function test_traditional_register_and_login()
    {
        // Kể từ S7, đăng ký qua API /register yêu cầu OTP.
        // Test này xác nhận login flow: tạo user trực tiếp (seeder/factory) rồi test login.
        $user = \App\Models\User::factory()->create([
            'email'    => 'testuser@dtffshop.com',
            'password' => bcrypt('Secret123!'),
            'role'     => 'customer',
        ]);

        // 1. Login với đúng mật khẩu
        $resLogin = $this->postJson('/api/v1/auth/login', [
            'email'    => 'testuser@dtffshop.com',
            'password' => 'Secret123!',
        ]);
        $resLogin->assertStatus(200);
        $resLogin->assertJsonPath('success', true);
        $token = $resLogin->json('data.token');
        $this->assertNotEmpty($token);

        // 2. Login với sai mật khẩu
        $resBad = $this->postJson('/api/v1/auth/login', [
            'email'    => 'testuser@dtffshop.com',
            'password' => 'wrongpass',
        ]);
        $resBad->assertStatus(401);
    }

    public function test_discord_mock_is_blocked_in_production()
    {
        // When in production or allow_mock_auth is false, mock login must return 404
        config(['app.allow_mock_auth' => false]);
        $res = $this->postJson('/api/v1/auth/discord/mock', [
            'name' => 'ProGamer Discord',
            'email' => 'progamer@discord.test',
        ]);

        $res->assertStatus(404);
        $res->assertJsonPath('success', false);
    }

    public function test_discord_mock_when_enabled_in_local_testing()
    {
        config(['app.allow_mock_auth' => true]);
        app()->detectEnvironment(fn() => 'local');

        $res = $this->postJson('/api/v1/auth/discord/mock', [
            'name' => 'ProGamer Discord',
            'email' => 'progamer@discord.test',
        ]);

        $res->assertStatus(200);
        $res->assertJsonPath('success', true);
        $token = $res->json('data.token');
        $this->assertNotEmpty($token);

        // Call /auth/me with bearer token
        $meRes = $this->withToken($token)->getJson('/api/v1/auth/me');
        $meRes->assertStatus(200);
        $meRes->assertJsonPath('data.name', 'ProGamer Discord');

        // Call /user/orders
        $ordersRes = $this->withToken($token)->getJson('/api/v1/user/orders');
        $ordersRes->assertStatus(200);
        $ordersRes->assertJsonPath('success', true);
    }

    public function test_sepay_webhook_security_rejection_and_authorization()
    {
        config(['services.sepay.webhook_key' => 'secret_test_key_123']);

        // 1. Rejection without authorization header/key
        $unauthRes = $this->postJson('/api/v1/payments/sepay/webhook', [
            'transferType' => 'in',
            'transferAmount' => 50000,
            'content' => 'ACC-TEST999',
        ]);
        $unauthRes->assertStatus(401);

        // 2. Acceptance with valid authorization header
        $authRes = $this->withHeaders([
            'Authorization' => 'Apikey secret_test_key_123',
        ])->postJson('/api/v1/payments/sepay/webhook', [
            'transferType' => 'in',
            'transferAmount' => 50000,
            'content' => 'NO_MATCHING_ORDER',
        ]);
        $authRes->assertStatus(200);
    }

    public function test_test_pay_blocked_in_production()
    {
        // On production, test-pay must 404
        app()->detectEnvironment(fn() => 'production');
        $res = $this->postJson('/api/v1/orders/ACC-ANY123/test-pay');
        $res->assertStatus(404);
    }
}
