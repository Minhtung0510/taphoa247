<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'transaction_code',
        'amount',
        'bank_code',
        'account_no',
        'memo_received',
        'raw_payload',
        'transaction_time',
    ];

    protected $casts = [
        'amount' => 'integer',
        'raw_payload' => 'array',
        'transaction_time' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
