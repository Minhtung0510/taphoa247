<?php

namespace App\Services;

use App\Models\AccountStock;
use App\Models\Order;
use App\Models\Payment;
use App\Services\DigishopResellerService;
use App\Services\ShopMmoService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OrderService
{
    /**
     * Hoàn tất đơn hàng khi nhận được thanh toán (Idempotent)
     */
    public function fulfillOrder(Order $order, array $transactionData): bool
    {
        return DB::transaction(function () use ($order, $transactionData) {
            // Lock order for update to prevent concurrent fulfillment
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->first();
            if (!$lockedOrder || $lockedOrder->isPaid()) {
                return true; // Idempotent: đã thanh toán rồi thì trả về thành công
            }

            $txCode = (string) ($transactionData['transactionID'] ?? ('TX-' . $lockedOrder->order_code . '-' . time()));
            $amount = (int) ($transactionData['creditAmount'] ?? $lockedOrder->total_amount);

            // CHỐNG TÁI SỬ DỤNG GIAO DỊCH (Anti-Replay Attack)
            $existingPayment = Payment::where('transaction_code', $txCode)->first();
            if ($existingPayment && (int) $existingPayment->order_id !== (int) $lockedOrder->id) {
                Log::critical("[Payment Replay Attack] Mã giao dịch {$txCode} đã được dùng cho đơn #{$existingPayment->order_id}, cố tình tái sử dụng cho đơn #{$lockedOrder->id}!");
                return false;
            }

            if (!$existingPayment) {
                Payment::create([
                    'transaction_code' => $txCode,
                    'order_id' => $lockedOrder->id,
                    'amount' => $amount,
                    'bank_code' => config('services.web2m.bank_code', env('BANK_CODE', 'TPB')),
                    'account_no' => config('services.web2m.account_no', env('ACCOUNT_NO', '')),
                    'memo_received' => $transactionData['description'] ?? $lockedOrder->memo,
                    'raw_payload' => $transactionData,
                    'transaction_time' => now(),
                ]);
            }

            // Cập nhật trạng thái từng Order Item và cắt kho
            foreach ($lockedOrder->items as $item) {
                $product = $item->product;

                // ── Nánh 1: Sản phẩm Digishop Reseller API ──────────────────────
                if ($product && $product->isDigishop()) {
                    $this->fulfillDigishopItem($item, $product, $lockedOrder->order_code);
                    continue;
                }

                // ── Nánh 2: Sản phẩm ShopMMO API ────────────────────────────────────
                if ($product && $product->isShopMmo()) {
                    $this->fulfillShopMmoItem($item, $product, $lockedOrder->order_code);
                    continue;
                }

                // ── Nánh 3: Sản phẩm kho sẵn (Valorant / AccountStock) ─────────────
                $stock = $item->stock;

                // Nếu item chưa gán stock (ví dụ trường hợp trước đó thiếu kho)
                if (!$stock) {
                    $stock = AccountStock::where('product_id', $item->product_id)
                        ->where('status', 'available')
                        ->lockForUpdate()
                        ->first();

                    if ($stock) {
                        $item->account_stock_id = $stock->id;
                    }
                }

                if ($stock) {
                    $item->delivered_credentials = $stock->credentials;
                    $item->warranty_expires_at   = now()->addHours($item->warranty_duration_hours);
                    $item->save();

                    $stock->update([
                        'status'  => 'sold',
                        'order_id'=> $lockedOrder->id,
                        'sold_at' => now(),
                    ]);
                }
            }

            // Kiểm tra xem tất cả items đã được giao đủ acc chưa
            $allDelivered = $lockedOrder->items()->whereNull('delivered_credentials')->count() === 0;

            $lockedOrder->update([
                'status'  => $allDelivered ? 'completed' : 'processing',
                'paid_at' => now(),
            ]);

            // Gửi Facebook Conversions API (CAPI) nếu có cấu hình
            $this->sendFacebookPurchaseEvent($lockedOrder);

            return true;
        });
    }

    /**
     * Fulfill một OrderItem qua ShopMMO API.
     */
    protected function fulfillShopMmoItem(
        \App\Models\OrderItem $item,
        \App\Models\Product   $product,
        string                $orderRef
    ): void {
        $shopmmo  = app(ShopMmoService::class);
        $qty      = max(1, (int) $item->quantity);
        $result   = $shopmmo->createOrder($product->shopmmo_product_id, $qty, $orderRef);

        if ($result['success']) {
            $deliveryContent = $result['delivery_content'];

            $item->shopmmo_order_id     = $result['order_id'];
            $item->delivered_credentials = $deliveryContent ?: null;
            if ($deliveryContent && $item->warranty_duration_hours > 0) {
                $item->warranty_expires_at = now()->addHours($item->warranty_duration_hours);
            }
            $item->save();

            Log::info("[ShopMMO] Item #{$item->id} fulfilled. Order={$result['order_id']}");
        } else {
            Log::error("[ShopMMO] Item #{$item->id} FAILED: {$result['error']}", [
                'product_id'         => $product->id,
                'shopmmo_product_id' => $product->shopmmo_product_id,
                'order_ref'          => $orderRef,
            ]);
        }
    }

    /**
     * Fulfill một OrderItem qua Digishop Reseller API.
     * Gọi reseller-create-order, lưu delivery_content vào delivered_credentials.
     */
    protected function fulfillDigishopItem(
        \App\Models\OrderItem $item,
        \App\Models\Product   $product,
        string                $orderRef
    ): void {
        $digishop = app(DigishopResellerService::class);
        $result   = $digishop->createOrder($product->digishop_product_id, $orderRef);

        if ($result['success']) {
            $deliveryContent = $result['delivery_content'];

            // Nếu chưa có delivery_content ngay (trạng thái processing), polling tối đa 10 lần
            if (empty($deliveryContent) && !empty($result['order_id'])) {
                $digishopOrderId = $result['order_id'];
                for ($i = 0; $i < 10 && empty($deliveryContent); $i++) {
                    sleep(2);
                    $orderInfo       = $digishop->getOrder($digishopOrderId);
                    $deliveryContent = $orderInfo['delivery_content'] ?? null;
                }
            }

            $item->digishop_order_id = $result['order_id'];
            $item->digishop_status   = $result['status'] ?? 'completed';
            // OrderItem setter tự động encrypt — không cần Crypt::encryptString thủ công
            $item->delivered_credentials = $deliveryContent ?: null;
            if ($deliveryContent && $item->warranty_duration_hours > 0) {
                $item->warranty_expires_at = now()->addHours($item->warranty_duration_hours);
            }
            $item->save();

            Log::info("[Digishop] Item #{$item->id} fulfilled. Order={$result['order_id']}");
        } else {
            // Lưu lỗi vào log, order sẽ ở trạng thái processing
            Log::error("[Digishop] Item #{$item->id} FAILED: {$result['error']}", [
                'product_id'         => $product->id,
                'digishop_product_id'=> $product->digishop_product_id,
                'order_ref'          => $orderRef,
            ]);
        }
    }

    /**
     * Tự động giải phóng các đơn hàng quá hạn 30 phút (TTL)
     */
    public function releaseExpiredOrders(): int
    {
        $expiredOrders = Order::where('status', 'pending')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->get();

        $count = 0;
        foreach ($expiredOrders as $order) {
            DB::transaction(function () use ($order, &$count) {
                AccountStock::where('order_id', $order->id)
                    ->where('status', 'reserved')
                    ->update([
                        'status' => 'available',
                        'order_id' => null,
                        'reserved_at' => null,
                    ]);

                $order->update(['status' => 'timeout']);
                $count++;
            });
        }

        return $count;
    }

    /**
     * Tự động giao acc cho các đơn hàng đã thanh toán nhưng đang chờ nạp kho
     */
    public function fulfillWaitingStockOrders(): int
    {
        $processingOrders = Order::where('status', 'processing')->get();
        $fulfilledCount = 0;

        foreach ($processingOrders as $order) {
            $updated = DB::transaction(function () use ($order) {
                $missingItems = $order->items()->whereNull('delivered_credentials')->get();
                $allResolved = true;

                foreach ($missingItems as $item) {
                    $stock = AccountStock::where('product_id', $item->product_id)
                        ->where('status', 'available')
                        ->lockForUpdate()
                        ->first();

                    if ($stock) {
                        $item->account_stock_id = $stock->id;
                        $item->delivered_credentials = $stock->credentials;
                        $item->warranty_expires_at = now()->addHours($item->warranty_duration_hours);
                        $item->save();

                        $stock->update([
                            'status' => 'sold',
                            'order_id' => $order->id,
                            'sold_at' => now(),
                        ]);
                    } else {
                        $allResolved = false;
                    }
                }

                if ($allResolved) {
                    $order->update(['status' => 'completed']);
                    return true;
                }
                return false;
            });

            if ($updated) {
                $fulfilledCount++;
            }
        }

        return $fulfilledCount;
    }

    /**
     * Gửi Facebook Conversions API (CAPI) deduplicated bằng event_id = order_code
     */
    protected function sendFacebookPurchaseEvent(Order $order): void
    {
        $pixelId = env('FACEBOOK_PIXEL_ID');
        $accessToken = env('FACEBOOK_CAPI_TOKEN');

        if (!$pixelId || !$accessToken) {
            return;
        }

        try {
            $url = "https://graph.facebook.com/v19.0/{$pixelId}/events";
            Http::timeout(5)->post($url, [
                'access_token' => $accessToken,
                'data' => [
                    [
                        'event_name' => 'Purchase',
                        'event_time' => time(),
                        'event_id' => $order->order_code, // Deduplication key
                        'action_source' => 'website',
                        'user_data' => [
                            'em' => $order->customer_email ? hash('sha256', strtolower(trim($order->customer_email))) : null,
                            'ph' => $order->customer_phone ? hash('sha256', preg_replace('/[^0-9]/', '', $order->customer_phone)) : null,
                        ],
                        'custom_data' => [
                            'currency' => 'VND',
                            'value' => $order->total_amount,
                            'order_id' => $order->order_code,
                        ],
                    ],
                ],
            ]);
        } catch (\Throwable $e) {
            Log::warning('[Facebook CAPI] Lỗi gửi sự kiện: ' . $e->getMessage());
        }
    }
}
