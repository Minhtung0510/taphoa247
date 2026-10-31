<?php
namespace Tests\Feature;

use App\Models\{AccountStock,Category,Product,Order,User};
use App\Services\{CheckoutService,OrderService};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

// Evidence tests assert observed behavior, including vulnerabilities. Not security regression guarantees.
class LocalSecurityAuditTest extends TestCase
{
    use RefreshDatabase;
    protected Product $product;
    protected function setUp(): void {
        parent::setUp();
        if (config('database.default') !== 'sqlite' || config('database.connections.sqlite.database') !== ':memory:') throw new \RuntimeException('Audit requires in-memory database');
        Http::fake();
        $cat=Category::create(['name'=>'Audit','slug'=>'audit']);
        $this->product=Product::create(['category_id'=>$cat->id,'name'=>'Audit','slug'=>'audit','account_type'=>'audit','price'=>20000,'warranty_hours'=>2,'is_active'=>true]);
        for($i=0;$i<6;$i++) AccountStock::create(['product_id'=>$this->product->id,'account_type'=>'audit','credentials'=>'audit-user-'.$i.':fake-password','status'=>'available']);
    }
    private function order(array $extra=[]): Order {
        return app(CheckoutService::class)->checkout(array_merge(['product_id'=>$this->product->id,'quantity'=>1],$extra));
    }
    private function paid(Order $order, string $tx='AUDIT-TX'): void {
        app(OrderService::class)->fulfillOrder($order,['transactionID'=>$tx,'creditAmount'=>20000,'description'=>$order->memo]);
    }
    public function test_audit_unverified_email_reads_guest_purchase(): void {
        $order=$this->order(['customer_email'=>'victim@example.test']); $this->paid($order);
        $r=$this->postJson('/api/v1/auth/register',['name'=>'Audit attacker','email'=>'victim@example.test','password'=>'Audit-Only-123','role'=>'admin']);
        $r->assertStatus(201)->assertJsonPath('data.user.role','customer');
        $this->assertNull(User::where('email','victim@example.test')->first()->email_verified_at);
        $token=$r->json('data.token');
        $this->withToken($token)->getJson('/api/v1/user/orders')->assertOk()->assertJsonPath('data.0.order_code',$order->order_code)->assertJsonPath('data.0.items.0.credentials','audit-user-0:fake-password');
        $this->withToken($token)->getJson('/api/v1/orders/'.$order->order_code.'/details')->assertOk();
        $this->withToken($token)->getJson('/api/v1/admin/dashboard')->assertForbidden();
    }
    public function test_audit_anonymous_order_token_controls(): void {
        $order=$this->order(); $this->paid($order);
        foreach(['details','download','download-html','check-acc/0','warranty-eligibility'] as $path) {
            $this->getJson('/api/v1/orders/'.$order->order_code.'/'.$path)->assertForbidden();
        }
        $this->withHeader('X-Order-Token','incorrect')->getJson('/api/v1/orders/'.$order->order_code.'/details')->assertForbidden();
        $this->withHeader('X-Order-Token',$order->access_token)->getJson('/api/v1/orders/'.$order->order_code.'/details')->assertOk();
    }
    public function test_audit_guest_can_reserve_more_than_two_orders(): void {
        for($i=0;$i<3;$i++) $this->postJson('/api/v1/orders/checkout',['product_id'=>$this->product->id,'quantity'=>1,'price'=>1,'total_amount'=>1,'user_id'=>999,'status'=>'completed'])->assertOk()->assertJsonPath('data.total_amount',20000)->assertJsonPath('data.status','pending');
        $this->assertEquals(3,Order::where('status','pending')->count());
    }
    public function test_audit_same_transaction_fulfills_two_different_orders(): void {
        $a=$this->order(); $b=$this->order();
        $this->paid($a,'AUDIT-REPLAY'); $this->paid($b,'AUDIT-REPLAY');
        $this->assertEquals('completed',$a->fresh()->status);
        // Anti-Replay: đơn thứ hai không thể bị chiếm đoạt / hoàn tất bằng cùng mã giao dịch
        $this->assertEquals('pending',$b->fresh()->status);
        $this->assertEquals(1,\App\Models\Payment::where('transaction_code','AUDIT-REPLAY')->count());
    }
    public function test_audit_bad_quantity_rejected(): void {
        foreach([0,-1,51,1.5,'1 OR 1=1'] as $qty) $this->postJson('/api/v1/orders/checkout',['product_id'=>$this->product->id,'quantity'=>$qty])->assertUnprocessable();
    }
    public function test_audit_authorized_webhook_replay_matches_second_order(): void {
        config(['services.sepay.webhook_key'=>'audit-only-key']);
        $a=$this->order(); $b=$this->order();
        $payload=['transferType'=>'in','transferAmount'=>20000,'content'=>$a->memo.' '.$b->memo,'referenceCode'=>'AUDIT-WEBHOOK-REPLAY'];
        for($i=0;$i<2;$i++) $this->withHeader('X-Api-Key','audit-only-key')->postJson('/api/v1/payments/sepay/webhook',$payload)->assertOk();
        $this->assertEquals('completed',$a->fresh()->status);
        // Anti-Replay: Webhook không thể tái sử dụng referenceCode để thanh toán đơn thứ 2
        $this->assertEquals('pending',$b->fresh()->status);
        $this->assertEquals(1,\App\Models\Payment::where('transaction_code','AUDIT-WEBHOOK-REPLAY')->count());
    }
    public function test_audit_authenticated_checkout_preserves_owner(): void {
        $u=User::factory()->create(['role'=>'customer']);
        $token=$u->createToken('audit')->plainTextToken;
        $r=$this->withToken($token)->postJson('/api/v1/orders/checkout',['product_id'=>$this->product->id,'quantity'=>1]);
        $r->assertOk();
        $this->assertEquals($u->id, Order::where('order_code',$r->json('data.order_code'))->first()->user_id);
    }
}

