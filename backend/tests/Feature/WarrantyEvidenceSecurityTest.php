<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ClaimItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\WarrantyClaim;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class WarrantyEvidenceSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected ClaimItem $claimItem;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        $filePath = 'warranty_evidence/test_claim/sample.jpg';
        Storage::put($filePath, 'fake-image-content-for-test');

        $cat = Category::create(['name' => 'WarrantyCat', 'slug' => 'warranty-cat']);
        $product = Product::create([
            'category_id' => $cat->id,
            'name' => 'Warranty Product',
            'slug' => 'warranty-product',
            'account_type' => 'steam',
            'price' => 50000,
            'warranty_hours' => 24,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_code' => 'ORD-WARRANTY-123',
            'customer_name' => 'Test Customer',
            'customer_email' => 'customer@example.com',
            'total_amount' => 50000,
            'status' => 'completed',
            'memo' => 'MEMO123',
            'access_token' => 'order-token-123',
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'position' => 0,
            'quantity' => 1,
            'unit_price' => 50000,
            'subtotal' => 50000,
            'status' => 'delivered',
            'warranty_expires_at' => now()->addHours(24),
        ]);

        $claim = WarrantyClaim::create([
            'order_id' => $order->id,
            'claim_code' => 'CLM-TEST-001',
            'state' => 'waiting_admin',
            'attempt' => 1,
            'buyer_note' => 'Account password incorrect',
        ]);

        $this->claimItem = ClaimItem::create([
            'warranty_claim_id' => $claim->id,
            'order_item_id' => $orderItem->id,
            'evidence_path' => $filePath,
            'evidence_hash' => hash('sha256', 'fake-image-content-for-test'),
            'evidence_mime' => 'image/jpeg',
            'error_description' => 'Password incorrect',
        ]);
    }

    public function test_view_evidence_without_signed_url_returns_403(): void
    {
        $response = $this->get('/api/v1/warranty/evidence/' . $this->claimItem->id);
        $response->assertStatus(403);
    }

    public function test_view_evidence_with_invalid_signature_returns_403(): void
    {
        $validUrl = URL::temporarySignedRoute(
            'warranty.evidence',
            now()->addMinutes(10),
            ['id' => $this->claimItem->id]
        );

        $tamperedUrl = $validUrl . '&extra=tampered';
        $response = $this->get($tamperedUrl);
        $response->assertStatus(403);
    }

    public function test_view_evidence_with_expired_signed_url_returns_403(): void
    {
        // Expired in past
        $expiredUrl = URL::temporarySignedRoute(
            'warranty.evidence',
            now()->subMinutes(1),
            ['id' => $this->claimItem->id]
        );

        $response = $this->get($expiredUrl);
        $response->assertStatus(403);
    }

    public function test_view_evidence_with_valid_signed_url_returns_200(): void
    {
        $validUrl = URL::temporarySignedRoute(
            'warranty.evidence',
            now()->addMinutes(10),
            ['id' => $this->claimItem->id]
        );

        $response = $this->get($validUrl);
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'image/jpeg');
        $this->assertEquals('fake-image-content-for-test', file_get_contents($response->getFile()->getPathname()));
    }

    public function test_claim_item_appends_signed_evidence_url(): void
    {
        $url = $this->claimItem->evidence_url;
        $this->assertNotNull($url);
        $this->assertStringContainsString('signature=', $url);

        $response = $this->get($url);
        $response->assertStatus(200);
    }
}
