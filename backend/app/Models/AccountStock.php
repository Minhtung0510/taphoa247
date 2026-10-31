<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class AccountStock extends Model
{
    use HasFactory;

    protected $table = 'account_stock';

    protected $fillable = [
        'product_id',
        'account_type',
        'credentials',
        'credentials_hash',
        'status',
        'order_id',
        'reserved_at',
        'sold_at',
    ];

    protected $hidden = [
        'credentials',
    ];

    protected $casts = [
        'reserved_at' => 'datetime',
        'sold_at' => 'datetime',
    ];

    public function setCredentialsAttribute($value)
    {
        $clean = trim((string) $value);
        $this->attributes['credentials'] = Crypt::encryptString($clean);
        $this->attributes['credentials_hash'] = hash('sha256', $clean);
    }

    public function getCredentialsAttribute($value)
    {
        if (empty($value)) {
            return '';
        }
        try {
            return Crypt::decryptString($value);
        } catch (\Throwable $e) {
            return $value;
        }
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
