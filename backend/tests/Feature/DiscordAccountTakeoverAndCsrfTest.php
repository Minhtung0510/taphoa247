<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DiscordAccountTakeoverAndCsrfTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.discord.client_id' => 'fake-discord-client-id',
            'services.discord.client_secret' => 'fake-discord-client-secret',
            'services.discord.redirect' => 'http://localhost:3000/auth/discord/callback',
            'services.discord.allowed_redirects' => ['http://localhost:3000/auth/discord/callback'],
        ]);
    }

    public function test_discord_callback_rejects_missing_or_invalid_state(): void
    {
        $response = $this->postJson('/api/v1/auth/discord/callback', [
            'code' => 'valid-discord-auth-code',
            'state' => 'invalid-or-expired-state',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('success', false);
    }

    public function test_unverified_discord_email_matching_existing_user_returns_409(): void
    {
        $victim = User::create([
            'name' => 'Victim User',
            'email' => 'victim@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $state = 'valid-test-state-token-12345';
        Cache::put("discord_oauth_state:{$state}", true, now()->addMinutes(10));

        Http::fake([
            'https://discord.com/api/oauth2/token' => Http::response([
                'access_token' => 'fake-discord-access-token',
                'token_type' => 'Bearer',
            ], 200),
            'https://discord.com/api/users/@me' => Http::response([
                'id' => '1122334455667788',
                'username' => 'AttackerDiscord',
                'email' => 'victim@example.com', // Matching victim
                'verified' => false,             // BUT UNVERIFIED on Discord!
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/auth/discord/callback', [
            'code' => 'fake-code',
            'state' => $state,
        ]);

        $response->assertStatus(409);
        $response->assertJsonPath('success', false);

        // Assert victim's account was not hijacked
        $victimFresh = $victim->fresh();
        $this->assertNull($victimFresh->discord_id);
    }

    public function test_verified_discord_email_matching_existing_user_links_successfully(): void
    {
        $user = User::create([
            'name' => 'Real User',
            'email' => 'realuser@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $state = 'valid-test-state-token-67890';
        Cache::put("discord_oauth_state:{$state}", true, now()->addMinutes(10));

        Http::fake([
            'https://discord.com/api/oauth2/token' => Http::response([
                'access_token' => 'fake-discord-access-token-2',
            ], 200),
            'https://discord.com/api/users/@me' => Http::response([
                'id' => '9988776655443322',
                'username' => 'RealUserDiscord',
                'email' => 'realuser@example.com',
                'verified' => true, // VERIFIED
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/auth/discord/callback', [
            'code' => 'fake-code-2',
            'state' => $state,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertEquals('9988776655443322', $user->fresh()->discord_id);
    }

    public function test_unverified_discord_email_creates_dummy_email_user(): void
    {
        $state = 'valid-test-state-token-dummy';
        Cache::put("discord_oauth_state:{$state}", true, now()->addMinutes(10));

        Http::fake([
            'https://discord.com/api/oauth2/token' => Http::response([
                'access_token' => 'fake-discord-access-token-3',
            ], 200),
            'https://discord.com/api/users/@me' => Http::response([
                'id' => '5555444433332222',
                'username' => 'NewUnverifiedUser',
                'email' => 'unverified_new@example.com',
                'verified' => false,
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/auth/discord/callback', [
            'code' => 'fake-code-3',
            'state' => $state,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        $created = User::where('discord_id', '5555444433332222')->first();
        $this->assertNotNull($created);
        $this->assertEquals('discord_5555444433332222@dtffshop.local', $created->email);
    }
    public function test_linked_admin_can_login_with_verified_discord_and_get_admin_token(): void
    {
        $admin = User::create([
            'name' => 'Store Admin',
            'email' => 'store-admin@example.com',
            'password' => bcrypt('secure-admin-password'),
            'role' => 'admin',
            'discord_id' => '3344556677889900',
        ]);
        $state = 'valid-admin-discord-state-12345';
        Cache::put("discord_oauth_state:{$state}", true, now()->addMinutes(10));
        Http::fake([
            'https://discord.com/api/oauth2/token' => Http::response(['access_token' => 'admin-discord-token'], 200),
            'https://discord.com/api/users/@me' => Http::response([
                'id' => '3344556677889900', 'username' => 'StoreAdmin',
                'email' => 'store-admin@example.com', 'verified' => true,
            ], 200),
        ]);
        $response = $this->postJson('/api/v1/auth/discord/callback', ['code' => 'admin-code', 'state' => $state]);
        $response->assertOk()->assertJsonPath('success', true)->assertJsonPath('data.user.role', 'admin');
        $this->assertSame('discord', $admin->fresh()->last_login_method);
        $this->withToken($response->json('data.token'))->getJson('/api/v1/admin/users')->assertOk();
    }
}
