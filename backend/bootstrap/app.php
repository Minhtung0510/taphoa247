<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $trusted = env('TRUSTED_PROXIES');
        $proxies = $trusted
            ? array_filter(array_map('trim', explode(',', (string) $trusted)))
            : ['127.0.0.1', '::1'];

        $middleware->trustProxies(at: $proxies);
        $middleware->prepend(\App\Http\Middleware\ResolveClientIp::class);
        $middleware->append(\App\Http\Middleware\SecurityAndDdosProtection::class);
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
