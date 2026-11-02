<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class SendPurchaseEvent implements ShouldQueue
{
    use Dispatchable, Queueable;
    public int $tries = 1;
    public int $timeout = 15;
    public function __construct(public int $orderId)
    {
        $this->onQueue('metrics');
        $this->afterCommit();
    }
    public function handle(OrderService $service): void
    {
        $order = Order::find($this->orderId);
        if ($order?->paid_at) $service->sendFacebookPurchaseEvent($order);
    }
}
