<?php

namespace Tests\Unit;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Services\SePayService;
use App\Services\Web2MService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentGatewayTest extends TestCase
{
    use RefreshDatabase;

    public function test_sepay_service_implements_interface(): void
    {
        $sepay = new SePayService();
        $this->assertInstanceOf(PaymentGatewayInterface::class, $sepay);
        $this->assertEquals('TPB', $sepay->getBankCode());

        $qr = $sepay->generateQrUrl(50000, 'ACC-TPB12345');
        $this->assertStringContainsString('qr.sepay.vn/img', $qr);
        $this->assertStringContainsString('50000', $qr);
        $this->assertStringContainsString('ACC-TPB12345', $qr);
    }

    public function test_sepay_matching_transaction(): void
    {
        $category = Category::create(['name' => 'Valorant', 'slug' => 'valorant']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Acc Valorant',
            'slug' => 'acc-valo',
            'account_type' => 'valo_gold',
            'price' => 30000,
            'warranty_hours' => 2,
        ]);

        $order = Order::create([
            'order_code' => 'ACC-SEPAY001',
            'customer_name' => 'Tester',
            'memo' => 'ACC-SEPAY001',
            'total_amount' => 30000,
            'status' => 'pending',
            'payment_gateway' => 'sepay',
        ]);

        $sepay = new SePayService();

        // 1. Giao dịch hợp lệ
        $mockHistory = [
            'status' => 200,
            'transactions' => [
                [
                    'id' => 99991,
                    'bank_brand_name' => 'TPBank',
                    'amount_in' => 30000,
                    'transaction_content' => 'CHUYEN TIEN ACC-SEPAY001 MUA ACC',
                    'reference_number' => 'FT2600001',
                    'transaction_date' => '2026-10-27 20:30:00',
                ],
            ],
        ];

        $matched = $sepay->findMatchingTransaction($order, $mockHistory);
        $this->assertNotNull($matched);
        $this->assertEquals('FT2600001', $matched['transactionID']);
        $this->assertEquals(30000, $matched['creditAmount']);

        // 2. Giao dịch thiếu tiền (chỉ 20k thay vì 30k) -> Không khớp
        $mockHistoryUnderpaid = [
            'status' => 200,
            'transactions' => [
                [
                    'id' => 99992,
                    'amount_in' => 20000,
                    'transaction_content' => 'CHUYEN TIEN ACC-SEPAY001',
                    'reference_number' => 'FT2600002',
                ],
            ],
        ];
        $this->assertNull($sepay->findMatchingTransaction($order, $mockHistoryUnderpaid));

        // 3. Giao dịch sai memo -> Không khớp
        $mockHistoryWrongMemo = [
            'status' => 200,
            'transactions' => [
                [
                    'id' => 99993,
                    'amount_in' => 30000,
                    'transaction_content' => 'CHUYEN TIEN CHO BAN TIEN AN TRUA',
                    'reference_number' => 'FT2600003',
                ],
            ],
        ];
        $this->assertNull($sepay->findMatchingTransaction($order, $mockHistoryWrongMemo));
    }

    public function test_gateway_binding_in_container(): void
    {
        $gateway = app(PaymentGatewayInterface::class);
        $this->assertInstanceOf(PaymentGatewayInterface::class, $gateway);
    }
}
