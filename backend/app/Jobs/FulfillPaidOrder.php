<?php

namespace App\Jobs;

use App\Services\OrderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class FulfillPaidOrder implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 600;
    public int $uniqueFor = 900;
    public int $backoff = 60;

    public function __construct(public int $orderId)
    {
        $this->onQueue('fulfillment');
        $this->afterCommit();
    }

    public function uniqueId(): string { return (string) $this->orderId; }

    public function handle(OrderService $service): void
    {
        $lock = Cache::lock('fulfillment.order.'.$this->orderId, 900);
        if (!$lock->get()) {
            $this->release(30);
            return;
        }
        try { $service->processPaidOrder($this->orderId); }
        finally { $lock->release(); }
    }
}
