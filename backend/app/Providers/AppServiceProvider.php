<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(\App\Contracts\PaymentGatewayInterface::class, function () {
            $gateway = strtolower((string) env('PAYMENT_GATEWAY', 'sepay'));
            return match ($gateway) {
                'web2m' => app(\App\Services\Web2MService::class),
                default => app(\App\Services\SePayService::class),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
