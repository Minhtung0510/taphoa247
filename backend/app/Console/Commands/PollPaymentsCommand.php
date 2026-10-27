<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\OrderService;
use App\Services\Web2MService;
use Illuminate\Console\Command;

class PollPaymentsCommand extends Command
{
    protected $signature = 'payments:poll';
    protected $description = 'Kiểm tra biến động số dư ngân hàng MBBank qua Web2M để tự động giao acc cho các đơn hàng';

    public function handle(Web2MService $web2m, OrderService $orderService): int
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

        // 3. Tìm các đơn pending
        $pendingOrders = Order::where('status', 'pending')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->get();

        if ($pendingOrders->isEmpty()) {
            return 0; // Không có đơn pending, không cần gọi API ngân hàng
        }

        $this->line("Đang kiểm tra " . $pendingOrders->count() . " đơn hàng chờ thanh toán...");

        // Gọi Web2M đúng 1 lần cho tất cả đơn
        $history = $web2m->fetchHistory();

        $fulfilled = 0;
        foreach ($pendingOrders as $order) {
            $matchedTx = $web2m->findMatchingTransaction($order, $history);
            if ($matchedTx) {
                $this->info("⚡ Đã khớp thanh toán cho đơn {$order->order_code} (Số tiền: {$order->total_amount}đ)");
                $orderService->fulfillOrder($order, $matchedTx);
                $fulfilled++;
            }
        }

        if ($fulfilled > 0) {
            $this->info("🎉 Đã tự động hoàn tất {$fulfilled} đơn hàng thành công!");
        }

        return 0;
    }
}
