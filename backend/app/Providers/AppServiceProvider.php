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
        \Illuminate\Support\Facades\Event::listen(\Illuminate\Database\Events\ConnectionEstablished::class, function ($event): void {
            $connection = $event->connection;
            if ($connection->getDriverName() !== 'sqlite' || app()->runningUnitTests()) {
                return;
            }

            try {
                $connection->statement('PRAGMA journal_mode=WAL');
                $connection->statement('PRAGMA synchronous=NORMAL');
                $connection->statement('PRAGMA busy_timeout=5000');
            } catch (\Throwable $exception) {
                \Illuminate\Support\Facades\Log::warning('Could not configure SQLite concurrency pragmas.', [
                    'error' => $exception->getMessage(),
                ]);
            }
        });

        foreach ([\App\Models\Product::class, \App\Models\Category::class] as $model) {
            $model::saved(fn () => \App\Services\CatalogCache::invalidate());
            $model::deleted(fn () => \App\Services\CatalogCache::invalidate());
        }

        Password::defaults(function () {
            return Password::min(8);
        });

        // Đảm bảo các URL sinh ra (đặc biệt là URL ký tạm thời Signed URLs) dùng scheme https:// khi chạy sau Cloudflare Tunnel
        if (
            $this->app->environment('production') ||
            request()->header('X-Forwarded-Proto') === 'https' ||
            str_starts_with((string) config('app.url'), 'https://')
        ) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }
    }
}
