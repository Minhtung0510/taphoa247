<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\WarrantyController;
use App\Http\Middleware\EnsureAdmin;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // 1. Public Catalog & Store
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/categories/{slug}', [CatalogController::class, 'category']);
    Route::get('/products', [CatalogController::class, 'products']);
    Route::get('/products/{slug}', [CatalogController::class, 'product']);
    Route::get('/store/stats', [CatalogController::class, 'stats']);

    // 2. Checkout & Orders
    Route::post('/orders/checkout', [CheckoutController::class, 'checkout'])->middleware('throttle:15,1');
    Route::get('/orders/{orderCode}/status', [CheckoutController::class, 'status']);
    Route::get('/orders/{orderCode}/stream', [CheckoutController::class, 'stream']);
    Route::post('/orders/{orderCode}/test-pay', [CheckoutController::class, 'testPay']);

    // 3. Delivery & Check Acc
    Route::get('/orders/{orderCode}/details', [DeliveryController::class, 'details']);
    Route::get('/orders/{orderCode}/download', [DeliveryController::class, 'downloadTxt']);
    Route::get('/orders/{orderCode}/check-acc/{position}', [DeliveryController::class, 'checkAcc']);
    Route::get('/orders/{orderCode}/download-html', [DeliveryController::class, 'downloadHtml']);

    // 4. Warranty (Bảo hành)
    Route::get('/orders/{orderCode}/warranty-eligibility', [WarrantyController::class, 'eligibility']);
    Route::post('/warranty/claims', [WarrantyController::class, 'claim'])->middleware('throttle:10,1');
    Route::get('/warranty/claims/{claimCode}', [WarrantyController::class, 'claimStatus']);
    Route::get('/warranty/evidence/{id}', [WarrantyController::class, 'viewEvidence']);

    // 5. Auth
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // 6. Admin Management API
        Route::prefix('admin')->middleware(EnsureAdmin::class)->group(function () {
            Route::get('/dashboard', [AdminController::class, 'dashboard']);
            Route::get('/products', [AdminController::class, 'products']);
            Route::put('/products/{id}/price', [AdminController::class, 'updatePrice']);
            Route::post('/stock/import', [AdminController::class, 'importStock']);
            Route::get('/orders', [AdminController::class, 'orders']);
            Route::post('/orders/{code}/force-complete', [AdminController::class, 'forceCompleteOrder']);
            Route::get('/warranty', [AdminController::class, 'warrantyClaims']);
            Route::post('/warranty/{id}/approve', [AdminController::class, 'approveClaim']);
            Route::post('/warranty/{id}/reject', [AdminController::class, 'rejectClaim']);
        });
    });
});
