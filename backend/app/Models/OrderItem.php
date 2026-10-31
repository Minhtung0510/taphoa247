<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'account_stock_id',
        'quantity',
        'unit_price',
        'subtotal',
        'position',
        'delivered_credentials',
        'warranty_duration_hours',
        'warranty_expires_at',
        'replacement_count',
        'digishop_order_id',
        'digishop_status',
        'shopmmo_order_id',
    ];

    protected $hidden = [
        'delivered_credentials',
    ];

    protected $casts = [
        'unit_price' => 'integer',
        'subtotal' => 'integer',
        'quantity' => 'integer',
        'position' => 'integer',
        'warranty_duration_hours' => 'integer',
        'warranty_expires_at' => 'datetime',
        'replacement_count' => 'integer',
    ];

    public function setDeliveredCredentialsAttribute($value)
    {
        if (empty($value)) {
            $this->attributes['delivered_credentials'] = null;
            return;
        }
        $this->attributes['delivered_credentials'] = Crypt::encryptString(trim((string) $value));
    }

    public function getDeliveredCredentialsAttribute($value)
    {
        if (empty($value)) {
            return null;
        }
        try {
            return Crypt::decryptString($value);
        } catch (\Throwable $e) {
            return $value;
        }
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function stock()
    {
        return $this->belongsTo(AccountStock::class, 'account_stock_id');
    }

    public function claimItems()
    {
        return $this->hasMany(ClaimItem::class);
    }

    public function isWarrantyValid(): bool
    {
        if ($this->replacement_count >= 3) {
            return false; // Tối đa 3 lượt bảo hành theo quy định của Shop
        }
        if (!$this->warranty_expires_at) {
            return false;
        }
        return now()->lessThanOrEqualTo($this->warranty_expires_at);
    }
}
