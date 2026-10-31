<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    /**
     * Kiểm tra và tính toán mã giảm giá công khai cho khách hàng khi mua
     */
    public function check(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:64',
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'nullable|integer|min:1|max:50',
        ]);

        $code = strtoupper(trim($validated['code']));
        $quantity = max(1, (int) ($validated['quantity'] ?? 1));

        $product = Product::find($validated['product_id']);
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không hợp lệ.',
            ], 404);
        }

        $subtotal = $product->price * $quantity;

        $coupon = Coupon::where('code', $code)->first();
        if (!$coupon) {
            return response()->json([
                'success' => false,
                'message' => 'Mã giảm giá không tồn tại hoặc đã hết hiệu lực.',
            ], 404);
        }

        [$valid, $discount, $message] = $coupon->calculateDiscount($subtotal);
        if (!$valid) {
            return response()->json([
                'success' => false,
                'message' => $message,
            ], 422);
        }

        $finalAmount = max(1000, $subtotal - $discount);

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'code' => $coupon->code,
                'description' => $coupon->description,
                'discount_type' => $coupon->discount_type,
                'discount_value' => $coupon->discount_value,
                'discount_amount' => $discount,
                'original_amount' => $subtotal,
                'final_amount' => $finalAmount,
            ],
        ]);
    }

    /**
     * Danh sách tất cả mã giảm giá (Dành cho Admin)
     */
    public function index(): JsonResponse
    {
        $coupons = Coupon::latest()->get();

        $stats = [
            'total_coupons' => $coupons->count(),
            'active_coupons' => $coupons->where('is_active', true)->count(),
            'total_used' => $coupons->sum('used_count'),
        ];

        return response()->json([
            'success' => true,
            'data' => $coupons,
            'stats' => $stats,
        ]);
    }

    /**
     * Tạo mã giảm giá mới (Dành cho Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:64|unique:coupons,code',
            'description' => 'nullable|string|max:255',
            'discount_type' => 'required|in:percent,fixed',
            'discount_value' => 'required|integer|min:1',
            'max_discount_amount' => 'nullable|integer|min:0',
            'min_order_amount' => 'nullable|integer|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['min_order_amount'] = $validated['min_order_amount'] ?? 0;
        $validated['is_active'] = $request->boolean('is_active', true);

        $coupon = Coupon::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tạo mã giảm giá mới thành công!',
            'data' => $coupon,
        ]);
    }

    /**
     * Cập nhật mã giảm giá (Dành cho Admin)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);

        $validated = $request->validate([
            'code' => "required|string|max:64|unique:coupons,code,{$id}",
            'description' => 'nullable|string|max:255',
            'discount_type' => 'required|in:percent,fixed',
            'discount_value' => 'required|integer|min:1',
            'max_discount_amount' => 'nullable|integer|min:0',
            'min_order_amount' => 'nullable|integer|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['min_order_amount'] = $validated['min_order_amount'] ?? 0;
        if ($request->has('is_active')) {
            $validated['is_active'] = $request->boolean('is_active');
        }

        $coupon->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật mã giảm giá thành công!',
            'data' => $coupon,
        ]);
    }

    /**
     * Xóa mã giảm giá (Dành cho Admin)
     */
    public function destroy(int $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa mã giảm giá thành công!',
        ]);
    }

    /**
     * Bật / Tắt trạng thái mã giảm giá (Dành cho Admin)
     */
    public function toggle(int $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->is_active = !$coupon->is_active;
        $coupon->save();

        return response()->json([
            'success' => true,
            'message' => $coupon->is_active ? 'Đã kích hoạt mã giảm giá!' : 'Đã tạm ngưng mã giảm giá!',
            'data' => $coupon,
        ]);
    }
}
