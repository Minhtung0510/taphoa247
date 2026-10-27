<?php

namespace App\Services;

use App\Models\AccountStock;
use App\Models\Order;
use App\Models\Payment;
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

            // Ghi nhận thanh toán
            Payment::firstOrCreate(
                ['transaction_code' => $txCode],
                [
                    'order_id' => $lockedOrder->id,
                    'amount' => $amount,
                    'bank_code' => config('services.web2m.bank_code', env('BANK_CODE', 'MBB')),
                    'account_no' => config('services.web2m.account_no', env('ACCOUNT_NO', '')),
                    'memo_received' => $transactionData['description'] ?? $lockedOrder->memo,
                    'raw_payload' => $transactionData,
                    'transaction_time' => now(),
                ]
            );

            // Cập nhật trạng thái từng Order Item và cắt kho
            foreach ($lockedOrder->items as $item) {
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
                    $item->warranty_expires_at = now()->addHours($item->warranty_duration_hours);
                    $item->save();

                    $stock->update([
                        'status' => 'sold',
                        'order_id' => $lockedOrder->id,
                        'sold_at' => now(),
                    ]);
                }
            }

            // Kiểm tra xem tất cả items đã được giao đủ acc chưa
            $allDelivered = $lockedOrder->items()->whereNull('delivered_credentials')->count() === 0;

            $lockedOrder->update([
                'status' => $allDelivered ? 'completed' : 'processing',
                'paid_at' => now(),
            ]);

            // Gửi Facebook Conversions API (CAPI) nếu có cấu hình
            $this->sendFacebookPurchaseEvent($lockedOrder);

            return true;
        });
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
