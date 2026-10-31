<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\WarrantyController;
use App\Http\Middleware\EnsureAdmin;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // 1. Public Catalog & Store (Được CDN Cloudflare & RAM Cache bảo vệ)
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/categories/{slug}', [CatalogController::class, 'category']);
    Route::get('/products', [CatalogController::class, 'products']);
    Route::get('/products/{slug}', [CatalogController::class, 'product']);
    Route::get('/store/stats', [CatalogController::class, 'stats']);
    Route::get('/store/settings', [CatalogController::class, 'settings']);
    Route::post('/coupons/check', [CouponController::class, 'check'])->middleware('throttle:30,1,coupon');
    // Route::post('/store/heart', [CatalogController::class, 'addHeart'])->middleware('throttle:30,1,heart');

    // 2. Checkout & Orders
    Route::post('/orders/checkout', [CheckoutController::class, 'checkout'])->middleware('throttle:60,1,checkout');
    Route::get('/orders/{orderCode}/status', [CheckoutController::class, 'status'])->middleware('throttle:120,1,status');
    Route::get('/orders/{orderCode}/stream', [CheckoutController::class, 'stream'])->middleware('throttle:10,1,stream');
    Route::post('/orders/{orderCode}/test-pay', [CheckoutController::class, 'testPay']);
    Route::post('/payments/sepay/webhook', [\App\Http\Controllers\Api\PaymentWebhookController::class, 'handleSePay']);
    Route::post('/payments/device/webhook', [\App\Http\Controllers\Api\DevicePaymentWebhookController::class, 'handleWebhook']);
    Route::post('/payments/device/heartbeat', [\App\Http\Controllers\Api\DevicePaymentWebhookController::class, 'handleHeartbeat']);

    // 3. Delivery & Check Acc
    Route::get('/orders/{orderCode}/details', [DeliveryController::class, 'details'])->middleware('throttle:60,1,details');
    Route::get('/orders/{orderCode}/download', [DeliveryController::class, 'downloadTxt'])->middleware('throttle:30,1,download');
    Route::get('/orders/{orderCode}/check-acc/{position}', [DeliveryController::class, 'checkAcc'])->middleware('throttle:60,1,checkacc');
    Route::get('/orders/{orderCode}/download-html', [DeliveryController::class, 'downloadHtml'])->middleware('throttle:30,1,downloadhtml');

    // 4. Warranty (Bảo hành)
    Route::get('/orders/{orderCode}/warranty-eligibility', [WarrantyController::class, 'eligibility'])->middleware('throttle:30,1,warr_elig');
    Route::post('/warranty/claims', [WarrantyController::class, 'claim'])->middleware('throttle:15,1,claim');
    Route::get('/warranty/claims/{claimCode}', [WarrantyController::class, 'claimStatus'])->middleware('throttle:30,1,warr_status');
    Route::get('/warranty/evidence/{id}', [WarrantyController::class, 'viewEvidence'])->name('warranty.evidence')->middleware('signed');

    // 5. Auth (Độc lập bộ đếm chống nghẽn)
    Route::post('/auth/send-otp', [AuthController::class, 'sendOtp'])->middleware('throttle:6,1,otp');
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:15,1,register');
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:15,1,login')->name('login');
    Route::get('/auth/discord/redirect', [AuthController::class, 'discordRedirect']);
    Route::post('/auth/discord/callback', [AuthController::class, 'discordCallback'])->middleware('throttle:15,1,discord');
    Route::post('/auth/discord/mock', [AuthController::class, 'discordMock'])->middleware('throttle:15,1,mock');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/user/orders', [AuthController::class, 'userOrders']);

        // 6. Admin Management API
        Route::prefix('admin')->middleware(EnsureAdmin::class)->group(function () {
            Route::get('/bootstrap', [AdminController::class, 'bootstrap']);
            Route::get('/dashboard', [AdminController::class, 'dashboard']);
            Route::get('/categories', [AdminController::class, 'categories']);
            Route::post('/categories', [AdminController::class, 'createCategory']);
            Route::put('/categories/{id}', [AdminController::class, 'updateCategory']);
            Route::delete('/categories/{id}', [AdminController::class, 'deleteCategory']);
            Route::get('/products', [AdminController::class, 'products']);
            Route::post('/products', [AdminController::class, 'createProduct']);
            Route::put('/products/{id}', [AdminController::class, 'updateProduct']);
            Route::delete('/products/{id}', [AdminController::class, 'deleteProduct']);
            Route::put('/products/{id}/price', [AdminController::class, 'updatePrice']);
            Route::post('/stock/import', [AdminController::class, 'importStock']);
            Route::get('/orders', [AdminController::class, 'orders']);
            Route::post('/orders/{code}/force-complete', [AdminController::class, 'forceCompleteOrder']);
            Route::post('/orders/{code}/reject', [AdminController::class, 'rejectOrder']);
            Route::get('/warranty', [AdminController::class, 'warrantyClaims']);
            Route::post('/warranty/{id}/approve', [AdminController::class, 'approveClaim']);
            Route::post('/warranty/{id}/reject', [AdminController::class, 'rejectClaim']);
            Route::get('/revenue', [AdminController::class, 'revenueAnalytics']);
            Route::get('/settings', [AdminController::class, 'getSettings']);
            Route::put('/settings', [AdminController::class, 'updateSettings']);
            Route::get('/coupons', [CouponController::class, 'index']);
            Route::post('/coupons', [CouponController::class, 'store']);
            Route::put('/coupons/{id}', [CouponController::class, 'update']);
            Route::delete('/coupons/{id}', [CouponController::class, 'destroy']);
            Route::patch('/coupons/{id}/toggle', [CouponController::class, 'toggle']);
        });
    });
});
