<?php

namespace App\Console\Commands;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Console\Command;

class PollPaymentsCommand extends Command
{
    protected $signature = 'payments:poll';
    protected $description = 'Kiểm tra biến động số dư ngân hàng qua SePay / Web2M để tự động giao acc cho các đơn hàng';

    public function handle(PaymentGatewayInterface $gateway, OrderService $orderService): int
    {
        // 1. Tự động nhả các đơn hàng quá hạn 30 phút
        $released = $orderService->releaseExpiredOrders();
        if ($released > 0) {
            $this->info("Đã giải phóng {$released} đơn hàng quá hạn.");
        }

        // 2. Tự động kiểm tra đơn hàng đang chờ kho
        $waitingFulfilled = $orderService->fulfillWaitingStockOrders();
        if ($waitingFulfilled > 0) {
            $this->info("Đã hoàn tất {$waitingFulfilled} đơn hàng chờ nạp kho.");
        }

        // 3. Find active orders and recently expired orders that may have a late bank transfer.
        $latePaymentCutoff = now()->subMinutes(max(0, (int) config('services.payments.late_payment_grace_minutes', 1440)));
        $pendingOrders = Order::where(function ($query) use ($latePaymentCutoff) {
            $query->where(function ($pending) {
                $pending->where('status', 'pending')
                    ->where(function ($expiry) {
                        $expiry->whereNull('expires_at')->orWhere('expires_at', '>', now());
                    });
            })->orWhere(function ($timeout) use ($latePaymentCutoff) {
                $timeout->where('status', 'timeout')
                    ->whereNotNull('expires_at')
                    ->where('expires_at', '>', $latePaymentCutoff);
            });
        })
            ->get();

        if ($pendingOrders->isEmpty()) {
            return 0; // Không có đơn pending, không cần gọi API ngân hàng
        }

        $this->line("Đang kiểm tra " . $pendingOrders->count() . " đơn hàng chờ thanh toán...");

        // Gọi Gateway đúng 1 lần cho tất cả đơn
        $history = $gateway->fetchHistory();

        $fulfilled = 0;
        foreach ($pendingOrders as $order) {
            $matchedTx = $gateway->findMatchingTransaction($order, $history);
            if ($matchedTx) {
                $this->info("⚡ Đã ghi nhận thanh toán cho đơn {$order->order_code} (Số tiền: {$order->total_amount}đ)");
                $orderService->fulfillOrder($order, $matchedTx);
                $fulfilled++;
            }
        }

        if ($fulfilled > 0) {
            $this->info("🎉 Đã ghi nhận {$fulfilled} giao dịch thanh toán hợp lệ.");
        }

        return 0;
    }
}
