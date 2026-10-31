<?php
namespace Tests\Feature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
class AdminUsersTest extends TestCase
{
    use RefreshDatabase;
    public function test_customer_cannot_list_users_and_profile_omits_balance(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));
        $this->getJson('/api/v1/admin/users')->assertForbidden();
        $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonMissingPath('data.balance');
    }
    public function test_admin_can_search_users_without_sensitive_fields(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $customer = User::factory()->create(['name' => 'Unique Customer', 'role' => 'customer']);
        $this->getJson('/api/v1/admin/users?search=Unique&role=customer')->assertOk()
            ->assertJsonPath('data.total', 1)->assertJsonPath('data.data.0.id', $customer->id)
            ->assertJsonMissingPath('data.data.0.password')->assertJsonMissingPath('data.data.0.balance');
    }
    public function test_admin_can_create_update_and_delete_customer(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);
        $res = $this->postJson('/api/v1/admin/users', ['name' => 'New User', 'email' => 'new@example.test', 'password' => 'secure-pass-123', 'role' => 'customer'])->assertCreated();
        $id = $res->json('data.id');
        $user = User::findOrFail($id);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('secure-pass-123', $user->password));
        $user->createToken('session');
        $this->putJson("/api/v1/admin/users/{$id}", ['name' => 'Updated', 'email' => 'updated@example.test', 'password' => '', 'role' => 'customer'])->assertOk();
        $this->assertSame(0, $user->tokens()->count());
        $this->assertDatabaseHas('users', ['id' => $id, 'name' => 'Updated']);
        $this->deleteJson("/api/v1/admin/users/{$id}")->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $id]);
        $this->deleteJson("/api/v1/admin/users/{$admin->id}")->assertUnprocessable();
        $this->putJson("/api/v1/admin/users/{$admin->id}", ['name' => $admin->name, 'email' => $admin->email, 'role' => 'customer'])->assertUnprocessable();
    }
    public function test_customer_cannot_mutate_users(): void
    {
        $user = User::factory()->create(['role' => 'customer']);
        Sanctum::actingAs($user);
        $this->postJson('/api/v1/admin/users', [])->assertForbidden();
        $this->putJson("/api/v1/admin/users/{$user->id}", [])->assertForbidden();
        $this->deleteJson("/api/v1/admin/users/{$user->id}")->assertForbidden();
    }
    public function test_login_methods_are_filterable_without_exposing_passwords(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $discord = User::factory()->create(['role' => 'customer', 'password' => null, 'discord_id' => '1234567']);
        $both = User::factory()->create(['role' => 'customer', 'discord_id' => '7654321']);
        $this->getJson('/api/v1/admin/users?method=both&role=customer')->assertOk()
            ->assertJsonPath('data.total', 1)->assertJsonPath('data.data.0.id', $both->id)
            ->assertJsonMissingPath('data.data.0.password');
        $res = $this->getJson('/api/v1/admin/users?method=discord&role=customer')->assertOk()->assertJsonPath('data.total', 2);
        $rows = collect($res->json('data.data'))->keyBy('id');
        $this->assertEquals(0, $rows[$discord->id]['has_password']);
        $this->assertEquals(1, $rows[$both->id]['has_password']);
        $this->assertNull($rows[$discord->id]['last_login_at']);
    }
    public function test_successful_password_login_records_activity(): void
    {
        $user = User::factory()->create(['role' => 'customer', 'password' => bcrypt('secure-pass-123')]);
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'secure-pass-123'])->assertOk();
        $this->assertNotNull($user->fresh()->last_login_at);
        $this->assertSame('password', $user->fresh()->last_login_method);
    }
}
