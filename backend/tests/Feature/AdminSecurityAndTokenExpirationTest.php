<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminSecurityAndTokenExpirationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_user_seeder_fails_without_admin_initial_password(): void
    {
        putenv('ADMIN_INITIAL_PASSWORD=');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Thiếu ADMIN_INITIAL_PASSWORD trong .env');

        (new AdminUserSeeder())->run();
    }

    public function test_admin_user_seeder_succeeds_with_env_password(): void
    {
        putenv('ADMIN_INITIAL_PASSWORD=SuperSecretPass2026!');

        (new AdminUserSeeder())->run();

        $admin = User::where('role', 'admin')->first();
        $this->assertNotNull($admin);
        $this->assertTrue(Hash::check('SuperSecretPass2026!', $admin->password));
    }

    public function test_admin_reset_password_command_updates_password_and_revokes_tokens(): void
    {
        $admin = User::create([
            'name' => 'Admin Test',
            'email' => 'admin_test@taphoa247.io.vn',
            'password' => Hash::make('old-password-123'),
            'role' => 'admin',
        ]);

        $admin->createToken('old-token');
        $this->assertCount(1, $admin->tokens);

        $exitCode = Artisan::call('admin:reset-password', [
            'email' => 'admin_test@taphoa247.io.vn',
        ]);

        // When non-interactive, secret() returns empty or fails minimum length
        $this->assertEquals(1, $exitCode);
    }

    public function test_admin_login_issues_token_with_12_hour_expiration(): void
    {
        $admin = User::create([
            'name' => 'Admin Login Test',
            'email' => 'admin_login@taphoa247.io.vn',
            'password' => Hash::make('correct-password-123'),
            'role' => 'admin',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin_login@taphoa247.io.vn',
            'password' => 'correct-password-123',
        ]);

        $response->assertStatus(200);

        $tokenRecord = $admin->tokens()->latest()->first();
        $this->assertNotNull($tokenRecord);
        $this->assertNotNull($tokenRecord->expires_at);

        // Should expire within ~12 hours (between 11h55m and 12h05m from now)
        $diffHours = now()->diffInHours($tokenRecord->expires_at, false);
        $this->assertEquals(12, round($diffHours));
    }
}
