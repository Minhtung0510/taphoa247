<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class OtpAndLoginSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_send_otp_does_not_reveal_registered_email(): void
    {
        Mail::fake();

        // 1. Create existing user
        User::create([
            'name' => 'Existing User',
            'email' => 'existing@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Send OTP to existing email
        $resExisting = $this->postJson('/api/v1/auth/send-otp', ['email' => 'existing@example.com']);
        $resExisting->assertOk();
        $resExisting->assertJsonPath('success', true);

        // Mail should NOT be sent for existing user
        Mail::assertNothingSent();

        // 2. Send OTP to new email
        $resNew = $this->postJson('/api/v1/auth/send-otp', ['email' => 'newuser@example.com']);
        $resNew->assertOk();
        $resNew->assertJsonPath('success', true);

        // Both responses should have identical messages (no email enumeration)
        $this->assertEquals($resExisting->json('message'), $resNew->json('message'));

        // OTP is NOT generated for existing email, but IS generated for new email
        $this->assertFalse(Cache::has('otp_existing@example.com'));
        $this->assertTrue(Cache::has('otp_newuser@example.com'));
    }

    public function test_otp_attempts_tracked_and_purged_after_5_failed_attempts(): void
    {
        $email = 'register_test@example.com';
        Cache::put('otp_' . $email, '123456', now()->addMinutes(10));

        // Attempt 1 to 4: wrong OTP
        for ($i = 1; $i <= 4; $i++) {
            $res = $this->postJson('/api/v1/auth/register', [
                'name' => 'Test User',
                'email' => $email,
                'password' => 'SecurePass123',
                'otp' => '000000',
            ]);
            $res->assertStatus(422);
            $this->assertStringContainsString('lần thử', $res->json('message'));
            $this->assertTrue(Cache::has('otp_' . $email));
        }

        // Attempt 5: should purge OTP and block
        $res5 = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => $email,
            'password' => 'SecurePass123',
            'otp' => '000000',
        ]);
        $res5->assertStatus(422);
        $this->assertStringContainsString('bị hủy', $res5->json('message'));

        // OTP must be gone from Cache
        $this->assertFalse(Cache::has('otp_' . $email));
    }

    public function test_register_enforces_minimum_8_char_password(): void
    {
        $email = 'shortpass@example.com';
        Cache::put('otp_' . $email, '123456', now()->addMinutes(10));

        $res = $this->postJson('/api/v1/auth/register', [
            'name' => 'Short Pass',
            'email' => $email,
            'password' => 'short', // < 8 characters
            'otp' => '123456',
        ]);

        $res->assertStatus(422);
        $this->assertArrayHasKey('password', $res->json('errors'));
    }

    public function test_login_lockout_by_ip_and_by_email(): void
    {
        $email = 'lockout_test@example.com';
        User::create([
            'name' => 'Lockout User',
            'email' => $email,
            'password' => Hash::make('CorrectPassword123'),
        ]);

        // 5 wrong attempts from IP 1.1.1.1 -> locks IP
        for ($i = 1; $i <= 5; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => '1.1.1.1'])
                ->postJson('/api/v1/auth/login', [
                    'email' => $email,
                    'password' => 'wrong',
                ]);
        }

        // 6th attempt from 1.1.1.1 is throttled
        $resIp = $this->withServerVariables(['REMOTE_ADDR' => '1.1.1.1'])
            ->postJson('/api/v1/auth/login', [
                'email' => $email,
                'password' => 'wrong',
            ]);
        $resIp->assertStatus(429);

        // Attempt from new IP 2.2.2.2 still works (not IP locked yet)
        $resNewIp = $this->withServerVariables(['REMOTE_ADDR' => '2.2.2.2'])
            ->postJson('/api/v1/auth/login', [
                'email' => $email,
                'password' => 'wrong',
            ]);
        $resNewIp->assertStatus(401); // not 429 yet
    }

    public function test_register_fails_with_otp_error_without_revealing_existing_email(): void
    {
        User::create([
            'name' => 'Existing Person',
            'email' => 'victim@example.com',
            'password' => Hash::make('SecretPass123'),
        ]);

        // Attacker attempts to register with victim's email and bogus OTP
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Attacker',
            'email' => 'victim@example.com',
            'password' => 'AttackerPass123',
            'otp' => '999999',
        ]);

        $response->assertStatus(422);
        // Error message must mention OTP, NOT that email is already taken
        $this->assertStringContainsString('OTP', $response->json('message'));
        $this->assertStringNotContainsString('Email này đã được đăng ký', $response->json('message'));
    }

    public function test_admin_account_is_exempt_from_global_email_lockout_to_prevent_dos(): void
    {
        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@taphoa247.pro',
            'password' => Hash::make('AdminRealPassword123'),
            'role' => 'admin',
        ]);

        // Attacker simulates 10 wrong attempts from multiple attacker IPs (5 from IP 10.0.0.1, 5 from IP 10.0.0.2)
        for ($i = 1; $i <= 5; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
                ->postJson('/api/v1/auth/login', [
                    'email' => 'admin@taphoa247.pro',
                    'password' => 'attacker_pw',
                ]);
        }
        for ($i = 1; $i <= 5; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])
                ->postJson('/api/v1/auth/login', [
                    'email' => 'admin@taphoa247.pro',
                    'password' => 'attacker_pw',
                ]);
        }

        // The attacker IPs are locked out
        $resAttacker = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
            ->postJson('/api/v1/auth/login', [
                'email' => 'admin@taphoa247.pro',
                'password' => 'AdminRealPassword123',
            ]);
        $resAttacker->assertStatus(429);

        // But Admin from their legitimate office IP (1.2.3.4) can still log in successfully!
        $resAdmin = $this->withServerVariables(['REMOTE_ADDR' => '1.2.3.4'])
            ->postJson('/api/v1/auth/login', [
                'email' => 'admin@taphoa247.pro',
                'password' => 'AdminRealPassword123',
            ]);
        $resAdmin->assertOk();
        $resAdmin->assertJsonPath('success', true);
    }
}
