<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'service' => 'DTFF Service API',
        'status' => 'healthy',
        'time' => now()->toIso8601String(),
    ]);
});
