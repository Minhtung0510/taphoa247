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
     * Tạo đơn hàng với Pessimistic Lock & Soft-Reservation chống bán trùng
     */
    public function checkout(array $data): Order
    {
        $productId = (int) $data['product_id'];
        $quantity = min(50, max(1, (int) ($data['quantity'] ?? 1)));
        $customerName = htmlspecialchars(strip_tags(trim($data['customer_name'] ?? 'Khách Hàng')), ENT_QUOTES, 'UTF-8');
        $rawEmail = trim($data['customer_email'] ?? '');
        $customerEmail = filter_var($rawEmail, FILTER_VALIDATE_EMAIL) ?: null;
        $customerPhone = preg_replace('/[^0-9+\s\-]/', '', trim($data['customer_phone'] ?? ''));
        $userId = $data['user_id'] ?? null;
        $couponCode = !empty($data['coupon_code']) ? strtoupper(trim($data['coupon_code'])) : null;
        $optionId = $data['option_id'] ?? null;

        return DB::transaction(function () use ($productId, $quantity, $customerName, $customerEmail, $customerPhone, $userId, $couponCode, $optionId) {
            if ($userId) {
                \App\Models\User::whereKey($userId)->lockForUpdate()->first();
            }

            // Chống găm giữ kho (Anti-Stock Hoarding DoS): giới hạn tối đa 2 đơn pending chưa thanh toán
            $pendingQuery = Order::where('status', 'pending')->where('expires_at', '>', now());
            if ($userId) {
                $pendingQuery->where('user_id', $userId);
            } elseif (!empty($customerEmail)) {
                $pendingQuery->where('customer_email', $customerEmail);
            } else {
                $pendingQuery = null;
            }

            if ($pendingQuery && $pendingQuery->count() >= 2) {
                throw new InvalidArgumentException('Bạn đang có đơn hàng chờ thanh toán. Vui lòng hoàn tất thanh toán hoặc đợi đơn cũ hết hạn trước khi tạo đơn mới.');
            }

            $product = Product::where('id', $productId)->where('is_active', true)->first();
            if (!$product) {
                throw new InvalidArgumentException('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.');
            }

            $isValorant = ($product->category_id === 1) || ($product->category?->slug === 'valorant');
            $unitPrice = $product->price;
            $selectedOption = null;

            if ($isValorant) {
                $reservationLimit = max(1, (int) config('services.checkout.max_pending_reserved_accounts_per_user', 50));
                $activeOrders = Order::where('status', 'pending')->where('expires_at', '>', now());
                if ($userId) {
                    $activeOrders->where('user_id', $userId);
                } elseif ($customerEmail) {
                    $activeOrders->where('customer_email', $customerEmail);
                }

                $reservedCount = AccountStock::where('status', 'reserved')
                    ->whereIn('order_id', $activeOrders->select('id'))
                    ->count();
                if ($reservedCount + $quantity > $reservationLimit) {
                    throw new InvalidArgumentException("Bạn đang giữ {$reservedCount} tài khoản chưa thanh toán. Giới hạn giữ chỗ là {$reservationLimit} tài khoản.");
                }
            }

            // Xử lý biến thể (Options) cho sản phẩm
            if (!empty($product->options) && is_array($product->options)) {
                if ($optionId) {
                    foreach ($product->options as $opt) {
                        if ((string)($opt['id'] ?? '') === (string)$optionId) {
                            $selectedOption = $opt;
                            break;
                        }
                    }
                }
                if (!$selectedOption) {
                    foreach ($product->options as $opt) {
                        if (!empty($opt['is_available'])) {
                            $selectedOption = $opt;
                            break;
                        }
                    }
                }

                if ($selectedOption) {
                    if (empty($selectedOption['is_available'])) {
                        throw new InvalidArgumentException("Tùy chọn '{$selectedOption['name']}' hiện đang tạm hết hàng.");
                    }
                    $unitPrice = (int) $selectedOption['price'];
                }
            }

            // Pessimistic Locking chỉ áp dụng cho sản phẩm nạp kho sẵn (Valorant)
            if ($isValorant) {
                $availableStocks = AccountStock::where('product_id', $product->id)
                    ->where('status', 'available')
                    ->lockForUpdate()
                    ->limit($quantity)
                    ->get();

                if ($availableStocks->count() < $quantity) {
                    throw new InvalidArgumentException("Số lượng tồn kho không đủ (Hiện còn: {$availableStocks->count()} acc).");
                }
            } else {
                $availableStocks = collect([]);
            }

            $orderCodeSuffix = strtoupper(Str::random(8));
            $orderCode = 'ACC-' . $orderCodeSuffix;
            $memo = $orderCode;
            $accessToken = Str::random(40);
            $originalAmount = $unitPrice * $quantity;
            $discountAmount = 0;
            $appliedCoupon = null;

            // Xử lý mã giảm giá nếu có (dùng lockForUpdate chống race condition)
            if ($couponCode) {
                $coupon = \App\Models\Coupon::where('code', $couponCode)->lockForUpdate()->first();
                if ($coupon) {
                    [$valid, $discount, $msg] = $coupon->calculateDiscount($originalAmount);
                    if ($valid && $discount > 0) {
                        $discountAmount = $discount;
                        $appliedCoupon = $coupon;
                    } else {
                        throw new InvalidArgumentException($msg);
                    }
                } else {
                    throw new InvalidArgumentException("Mã giảm giá '{$couponCode}' không tồn tại hoặc đã hết hiệu lực.");
                }
            }

            $totalAmount = max(1000, $originalAmount - $discountAmount);
            $ttlSeconds = (int) env('PENDING_TTL_SECONDS', 900);
            $expiresAt = now()->addSeconds($ttlSeconds);

            $qrUrl = $this->paymentGateway->generateQrUrl($totalAmount, $memo);

            $order = Order::create([
                'order_code' => $orderCode,
                'access_token' => $accessToken,
                'user_id' => $userId,
                'customer_name' => $customerName,
                'customer_email' => $customerEmail,
                'customer_phone' => $customerPhone,
                'memo' => $memo,
                'coupon_code' => $appliedCoupon?->code,
                'discount_amount' => $discountAmount,
                'original_amount' => $originalAmount,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'payment_gateway' => strtolower((string) env('PAYMENT_GATEWAY', 'sepay')),
                'qr_url' => $qrUrl,
                'delivery_format' => $quantity > 5 ? 'txt_file' : 'inline',
                'expires_at' => $expiresAt,
            ]);

            // Tăng số lượt đã sử dụng của mã giảm giá
            if ($appliedCoupon) {
                $appliedCoupon->increment('used_count');
            }

            // Phân nhánh tạo OrderItem:
            if ($isValorant) {
                // Soft-Reservation: Đánh dấu giữ chỗ tạm thời cho đơn này để tránh bán trùng (Overselling)
                foreach ($availableStocks as $index => $stock) {
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
                        'unit_price' => $unitPrice,
                        'subtotal' => $unitPrice,
                        'position' => $index,
                        'warranty_duration_hours' => $product->warranty_hours,
                        'replacement_count' => 0,
                    ]);
                }
            } else {
                // Sản phẩm Auto-Buy qua Bot (AI, Canva, Capcut, Netflix, VPN):
                for ($index = 0; $index < $quantity; $index++) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'account_stock_id' => null,
                        'quantity' => 1,
                        'unit_price' => $unitPrice,
                        'subtotal' => $unitPrice,
                        'position' => $index,
                        'warranty_duration_hours' => $product->warranty_hours,
                        'replacement_count' => 0,
                    ]);
                }
            }

            return $order->load(['items.product']);
        });
    }
}
