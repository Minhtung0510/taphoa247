<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

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
        Password::defaults(function () {
            return Password::min(8);
        });
    }
}
