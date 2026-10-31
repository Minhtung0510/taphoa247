<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'discount_value',
        'max_discount_amount',
        'min_order_amount',
        'usage_limit',
        'used_count',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'integer',
        'max_discount_amount' => 'integer',
        'min_order_amount' => 'integer',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Tính toán mức giảm giá và kiểm tra tính hợp lệ
     *
     * @param int $subtotal Giá trị đơn hàng trước giảm giá (VND)
     * @return array [bool $valid, int $discountAmount, string $message]
     */
    public function calculateDiscount(int $subtotal): array
    {
        if (!$this->is_active) {
            return [false, 0, 'Mã giảm giá này hiện đang tạm ngưng sử dụng.'];
        }

        if ($this->expires_at && now()->gt($this->expires_at)) {
            return [false, 0, 'Mã giảm giá này đã hết hạn sử dụng.'];
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return [false, 0, 'Mã giảm giá đã hết lượt sử dụng.'];
        }

        if ($this->min_order_amount > 0 && $subtotal < $this->min_order_amount) {
            return [false, 0, 'Đơn hàng tối thiểu phải từ ' . number_format($this->min_order_amount) . 'đ để áp dụng mã này.'];
        }

        $discount = 0;
        if ($this->discount_type === 'percent') {
            $discount = (int) round(($subtotal * $this->discount_value) / 100);
            if ($this->max_discount_amount !== null && $this->max_discount_amount > 0) {
                $discount = min($discount, (int) $this->max_discount_amount);
            }
        } else {
            // Loại giảm số tiền cố định (fixed)
            $discount = (int) $this->discount_value;
        }

        // Đảm bảo không giảm vượt quá số tiền đơn hàng (giữ lại tối thiểu 0 hoặc 1000đ)
        $discount = min($discount, $subtotal);

        return [true, $discount, 'Áp dụng mã giảm giá thành công!'];
    }
}
