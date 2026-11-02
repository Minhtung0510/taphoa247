<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class CatalogCache
{
    public static function version(): string
    {
        return (string) Cache::get('catalog.version', 'initial');
    }

    public static function invalidate(): void
    {
        Cache::forever('catalog.version', (string) Str::uuid());
        Cache::forget('catalog.categories');
    }
}
