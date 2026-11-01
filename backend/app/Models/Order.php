<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_code',
        'access_token',
        'user_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'memo',
        'coupon_code',
        'discount_amount',
        'original_amount',
        'total_amount',
        'status',
        'payment_gateway',
        'qr_url',
        'delivery_format',
        'paid_at',
        'expires_at',
        'coupon_released_at',
    ];

    protected $casts = [
        'discount_amount' => 'integer',
        'original_amount' => 'integer',
        'total_amount' => 'integer',
        'paid_at' => 'datetime',
        'expires_at' => 'datetime',
        'coupon_released_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function stocks()
    {
        return $this->hasMany(AccountStock::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function warrantyClaims()
    {
        return $this->hasMany(WarrantyClaim::class);
    }

    public function isPaid(): bool
    {
        return in_array($this->status, ['paid', 'processing', 'completed'], true);
    }

    public function canAcceptPayment(): bool
    {
        if ($this->status === 'pending') {
            return !$this->isExpired();
        }

        $graceMinutes = max(0, (int) config('services.payments.late_payment_grace_minutes', 1440));
        return $this->status === 'timeout'
            && $graceMinutes > 0
            && $this->expires_at
            && $this->expires_at->greaterThan(now()->subMinutes($graceMinutes));
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isExpired(): bool
    {
        return $this->isPending() && $this->expires_at && now()->greaterThan($this->expires_at);
    }
}
