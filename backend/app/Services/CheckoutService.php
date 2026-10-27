<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use App\Models\AccountStock;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class CheckoutService
{
    public function __construct(
        protected PaymentGatewayInterface $paymentGateway
    ) {}

    /**
     * Tạo đơn hàng với Pessimistic Lock chống bán trùng
     */
    public function checkout(array $data): Order
    {
        $productId = (int) $data['product_id'];
        $quantity = max(1, (int) ($data['quantity'] ?? 1));
        $customerName = trim($data['customer_name'] ?? 'Khách Hàng');
        $customerEmail = trim($data['customer_email'] ?? '');
        $customerPhone = trim($data['customer_phone'] ?? '');
        $userId = $data['user_id'] ?? null;

        return DB::transaction(function () use ($productId, $quantity, $customerName, $customerEmail, $customerPhone, $userId) {
            $product = Product::where('id', $productId)->where('is_active', true)->first();
            if (!$product) {
                throw new InvalidArgumentException('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.');
            }

            // PESSIMISTIC LOCK: Khóa các bản ghi kho để giữ chỗ
            $stocks = AccountStock::where('product_id', $product->id)
                ->where('status', 'available')
                ->lockForUpdate()
                ->limit($quantity)
                ->get();

            if ($stocks->count() < $quantity) {
                throw new InvalidArgumentException("Số lượng tồn kho không đủ (Hiện còn: {$stocks->count()} acc).");
            }

            $orderCodeSuffix = strtoupper(Str::random(8));
            $orderCode = 'ACC-' . $orderCodeSuffix;
            $memo = $orderCode;
            $totalAmount = $product->price * $quantity;
            $ttlSeconds = (int) env('PENDING_TTL_SECONDS', 1800);
            $expiresAt = now()->addSeconds($ttlSeconds);

            $qrUrl = $this->paymentGateway->generateQrUrl($totalAmount, $memo);

            $order = Order::create([
                'order_code' => $orderCode,
                'user_id' => $userId,
                'customer_name' => $customerName,
                'customer_email' => $customerEmail,
                'customer_phone' => $customerPhone,
                'memo' => $memo,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'payment_gateway' => strtolower((string) env('PAYMENT_GATEWAY', 'sepay')),
                'qr_url' => $qrUrl,
                'delivery_format' => $quantity > 5 ? 'txt_file' : 'inline',
                'expires_at' => $expiresAt,
            ]);

            // Cập nhật trạng thái giữ chỗ kho (reserved)
            foreach ($stocks as $index => $stock) {
                $stock->update([
                    'status' => 'reserved',
                    'order_id' => $order->id,
                    'reserved_at' => now(),
                ]);

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'account_stock_id' => $stock->id,
                    'quantity' => 1,
                    'unit_price' => $product->price,
                    'subtotal' => $product->price,
                    'position' => $index,
                    'warranty_duration_hours' => $product->warranty_hours,
                    'replacement_count' => 0,
                ]);
            }

            return $order->load(['items.product', 'stocks']);
        });
    }
}
