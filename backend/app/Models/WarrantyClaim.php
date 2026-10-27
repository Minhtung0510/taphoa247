<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WarrantyClaim extends Model
{
    use HasFactory;

    protected $fillable = [
        'claim_code',
        'order_id',
        'user_id',
        'state',
        'attempt',
        'buyer_note',
        'admin_note',
        'resolved_by',
        'resolved_at',
    ];

    protected $casts = [
        'attempt' => 'integer',
        'resolved_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function resolvedByUser()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function claimItems()
    {
        return $this->hasMany(ClaimItem::class);
    }
}
