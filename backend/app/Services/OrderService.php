<?php

namespace App\Services;

use App\Models\AccountStock;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Services\DigishopResellerService;
use App\Services\ShopMmoService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OrderService
{
    /** Persist payment first; all network fulfillment happens after the transaction commits. */
    public function fulfillOrder(Order $order, array $transactionData): bool
    {
        $acceptance = DB::transaction(function () use ($order, $transactionData) {
            $lockedOrder = Order::whereKey($order->id)->lockForUpdate()->first();
            if (!$lockedOrder) {
                return null;
            }

            if ($lockedOrder->status === 'completed') {
                return ['accepted' => true, 'new_payment' => false, 'finished' => true];
            }

            $txCode = (string) ($transactionData['transactionID'] ?? ('TX-' . $lockedOrder->order_code . '-' . time()));
            $amount = (int) ($transactionData['creditAmount'] ?? $lockedOrder->total_amount);
            $existingPayment = Payment::where('transaction_code', $txCode)->first();
            if ($existingPayment && (int) $existingPayment->order_id !== (int) $lockedOrder->id) {
                Log::critical("[Payment Replay Attack] Reused transaction code {$txCode} for order #{$lockedOrder->id}.");
                return null;
            }

            $alreadyPaid = $lockedOrder->paid_at !== null || in_array($lockedOrder->status, ['paid', 'processing'], true);
            if (!$alreadyPaid) {
                if (!in_array($lockedOrder->status, ['pending', 'timeout'], true) || $amount < (int) $lockedOrder->total_amount) {
                    return null;
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

                if ($lockedOrder->status === 'timeout' && $lockedOrder->coupon_released_at && $lockedOrder->coupon_code) {
                    Coupon::where('code', $lockedOrder->coupon_code)->increment('used_count');
                    $lockedOrder->coupon_released_at = null;
                }

                $lockedOrder->update([
                    'status' => 'processing',
                    'paid_at' => now(),
                    'coupon_released_at' => $lockedOrder->coupon_released_at,
                ]);
                return ['accepted' => true, 'new_payment' => true, 'finished' => false];
            }

            return ['accepted' => true, 'new_payment' => false, 'finished' => false];
        });

        if (!$acceptance || !$acceptance['accepted']) {
            return false;
        }
        if ($acceptance['finished']) {
            return true;
        }

        $paidOrder = Order::find($order->id);
        if (!$paidOrder) {
            return false;
        }
        if ($acceptance['new_payment']) {
            $this->sendFacebookPurchaseEvent($paidOrder);
        }

        $this->processPaidOrder($paidOrder->id);
        return true;
    }

    private function processPaidOrder(int $orderId): void
    {
        $items = OrderItem::with('product')->where('order_id', $orderId)->orderBy('position')->get();
        foreach ($items as $item) {
            if ($item->delivered_credentials !== null) {
                continue;
            }

            $product = $item->product;
            if ($product?->isCloneus()) {
                $this->fulfillExternalItem($item->id, 'cloneus');
            } elseif ($product?->isDigishop()) {
                $this->fulfillExternalItem($item->id, 'digishop');
            } elseif ($product?->isShopMmo()) {
                $this->fulfillExternalItem($item->id, 'shopmmo');
            } else {
                $this->fulfillStockItem($orderId, $item->id);
            }
        }

        DB::transaction(function () use ($orderId) {
            $lockedOrder = Order::whereKey($orderId)->lockForUpdate()->first();
            if (!$lockedOrder || !$lockedOrder->paid_at) {
                return;
            }
            $allDelivered = !$lockedOrder->items()->whereNull('delivered_credentials')->exists();
            $lockedOrder->update(['status' => $allDelivered ? 'completed' : 'processing']);
        });
    }

    private function fulfillStockItem(int $orderId, int $itemId): bool
    {
        return DB::transaction(function () use ($orderId, $itemId) {
            $order = Order::whereKey($orderId)->lockForUpdate()->first();
            $item = OrderItem::whereKey($itemId)->where('order_id', $orderId)->lockForUpdate()->first();
            if (!$order || !$order->paid_at || !$item) {
                return false;
            }
            if ($item->delivered_credentials !== null) {
                return true;
            }

            $stock = null;
            if ($item->account_stock_id) {
                $candidate = AccountStock::whereKey($item->account_stock_id)->lockForUpdate()->first();
                if ($candidate && in_array($candidate->status, ['reserved', 'sold'], true) && (int) $candidate->order_id === $orderId) {
                    $stock = $candidate;
                } else {
                    $item->account_stock_id = null;
                    $item->save();
                }
            }

            if (!$stock) {
                $stock = AccountStock::where('product_id', $item->product_id)
                    ->where('status', 'available')
                    ->lockForUpdate()
                    ->first();
            }

            if (!$stock) {
                $item->fulfillment_state = 'waiting_stock';
                $item->save();
                return false;
            }

            $item->account_stock_id = $stock->id;
            $item->delivered_credentials = $stock->credentials;
            $item->fulfillment_state = 'delivered';
            if ($item->warranty_duration_hours > 0 && !$item->warranty_expires_at) {
                $item->warranty_expires_at = now()->addHours($item->warranty_duration_hours);
            }
            $item->save();
            $stock->update(['status' => 'sold', 'order_id' => $orderId, 'sold_at' => now()]);
            return true;
        });
    }

    private function fulfillExternalItem(int $itemId, string $provider): void
    {
        $claim = DB::transaction(function () use ($itemId, $provider) {
            $item = OrderItem::whereKey($itemId)->lockForUpdate()->first();
            if (!$item || $item->delivered_credentials !== null) {
                return null;
            }
            $order = Order::whereKey($item->order_id)->first();
            $product = Product::find($item->product_id);
            if (!$order || !$order->paid_at || !$product) {
                return null;
            }

            $externalId = match ($provider) {
                'cloneus' => $item->cloneus_order_id,
                'digishop' => $item->digishop_order_id,
                default => $item->shopmmo_order_id,
            };
            if ($item->fulfillment_state === 'processing' && $externalId) {
                return ['action' => 'poll', 'external_id' => (string) $externalId, 'product' => $product, 'order_code' => $order->order_code];
            }
            if ($item->fulfillment_state === 'submitting') {
                if ($item->updated_at && $item->updated_at->lt(now()->subMinutes(15))) {
                    $item->fulfillment_state = 'needs_review';
                    $item->save();
                }
                return null;
            }
            if (in_array($item->fulfillment_state, ['processing', 'needs_review', 'delivered'], true)) {
                return null;
            }

            $item->fulfillment_state = 'submitting';
            $item->save();
            return [
                'action' => 'create',
                'product' => $product,
                'order_code' => $order->order_code,
                'quantity' => max(1, (int) $item->quantity),
                'idempotency_key' => 'taphoa247-' . substr(hash('sha256', $order->order_code . ':item:' . $item->id), 0, 40),
            ];
        });

        if (!$claim) {
            return;
        }

        $service = match ($provider) {
            'cloneus' => app(CloneusService::class),
            'digishop' => app(DigishopResellerService::class),
            default => app(ShopMmoService::class),
        };

        if ($claim['action'] === 'poll') {
            try {
                $result = $service->getOrder($claim['external_id']);
                $this->saveExternalResult($itemId, $provider, $claim['external_id'], $result['delivery_content'] ?? null, $result['status'] ?? 'processing');
            } catch (\Throwable $e) {
                Log::warning("[Fulfillment] Provider status check failed for item #{$itemId}.", ['provider' => $provider, 'error' => $e->getMessage()]);
            }
            return;
        }

        $product = $claim['product'];
        try {
            $result = match ($provider) {
                'cloneus' => $service->createOrder((string) $product->cloneus_product_id, (int) $claim['quantity']),
                'digishop' => $service->createOrder((string) $product->digishop_product_id, $claim['order_code']),
                default => $service->createOrder(
                    (int) $product->shopmmo_product_id,
                    (int) $claim['quantity'],
                    $claim['order_code'],
                    $claim['idempotency_key'],
                ),
            };
        } catch (\Throwable $e) {
            OrderItem::whereKey($itemId)->where('fulfillment_state', 'submitting')
                ->update(['fulfillment_state' => 'needs_review', 'updated_at' => now()]);
            Log::error("[Fulfillment] Provider create call uncertain; item requires review #{$itemId}.", ['provider' => $provider, 'error' => $e->getMessage()]);
            return;
        }

        if (empty($result['success']) || empty($result['order_id'])) {
            OrderItem::whereKey($itemId)->where('fulfillment_state', 'submitting')
                ->update(['fulfillment_state' => 'needs_review', 'updated_at' => now()]);
            Log::error("[Fulfillment] External order requires review for item #{$itemId}.", ['provider' => $provider]);
            return;
        }

        $this->saveExternalResult(
            $itemId,
            $provider,
            (string) $result['order_id'],
            $result['delivery_content'] ?? null,
            $result['status'] ?? 'processing',
        );
    }

    private function saveExternalResult(int $itemId, string $provider, string $externalId, ?string $credentials, string $status): void
    {
        DB::transaction(function () use ($itemId, $provider, $externalId, $credentials, $status) {
            $item = OrderItem::whereKey($itemId)->lockForUpdate()->first();
            if (!$item || $item->delivered_credentials !== null) {
                return;
            }

            if ($provider === 'cloneus') {
                $item->cloneus_order_id = $externalId;
                $item->cloneus_status = $status;
            } elseif ($provider === 'digishop') {
                $item->digishop_order_id = $externalId;
                $item->digishop_status = $status;
            } else {
                $item->shopmmo_order_id = $externalId;
            }
            $providerStatus = strtolower(trim($status));
            $terminalFailure = in_array($providerStatus, ['failed', 'failure', 'cancelled', 'canceled', 'rejected', 'refunded'], true);
            $item->fulfillment_state = $credentials
                ? 'delivered'
                : ($terminalFailure ? 'needs_review' : 'processing');
            $item->delivered_credentials = $credentials ?: null;
            if ($credentials && $item->warranty_duration_hours > 0 && !$item->warranty_expires_at) {
                $item->warranty_expires_at = now()->addHours($item->warranty_duration_hours);
            }
            $item->save();
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
        $idempotencyKey = 'taphoa247-' . substr(hash('sha256', $orderRef . ':item:' . $item->id), 0, 40);
        $result   = $shopmmo->createOrder($product->shopmmo_product_id, $qty, $orderRef, $idempotencyKey);

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
        $expiredOrderIds = Order::where('status', 'pending')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->pluck('id');

        $count = 0;
        foreach ($expiredOrderIds as $orderId) {
            DB::transaction(function () use ($orderId, &$count) {
                $order = Order::whereKey($orderId)->lockForUpdate()->first();
                if (!$order || $order->status !== 'pending' || !$order->expires_at || $order->expires_at->isFuture()) {
                    return;
                }

                // 1. Giải phóng kho hàng đã giữ chỗ (Valorant stocks)
                $stockIds = AccountStock::where('order_id', $order->id)
                    ->where('status', 'reserved')
                    ->pluck('id');

                AccountStock::whereIn('id', $stockIds)
                    ->update([
                        'status' => 'available',
                        'order_id' => null,
                        'reserved_at' => null,
                    ]);

                if ($stockIds->isNotEmpty()) {
                    OrderItem::where('order_id', $order->id)
                        ->whereIn('account_stock_id', $stockIds)
                        ->update(['account_stock_id' => null]);
                }

                // 2. Hoàn trả lượt sử dụng coupon (nếu đơn có áp mã giảm giá và CHƯA từng được hoàn)
                $releasedAt = null;
                if (!empty($order->coupon_code) && $order->coupon_released_at === null) {
                    Coupon::where('code', $order->coupon_code)
                        ->where('used_count', '>', 0)
                        ->decrement('used_count');
                    $releasedAt = now();
                }

                $order->update([
                    'status' => 'timeout',
                    'coupon_released_at' => $releasedAt ?: $order->coupon_released_at,
                ]);
                $count++;

                Log::info("[OrderService] Released expired order #{$order->order_code}" .
                    (!empty($order->coupon_code) && $releasedAt ? " (coupon {$order->coupon_code} refunded)" : ''));
            });
        }

        return $count;
    }

    /**
     * Tự động giao acc cho các đơn hàng đã thanh toán nhưng đang chờ nạp kho
     */
    public function fulfillWaitingStockOrders(): int
    {
        $completed = 0;
        Order::where('status', 'processing')->orderBy('id')->chunkById(50, function ($orders) use (&$completed) {
            foreach ($orders as $order) {
                $this->processPaidOrder($order->id);
                if ($order->fresh()?->status === 'completed') {
                    $completed++;
                }
            }
        });

        return $completed;
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
