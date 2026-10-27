<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClaimItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'warranty_claim_id',
        'order_item_id',
        'evidence_path',
        'evidence_hash',
        'evidence_mime',
        'replacement_stock_id',
        'error_description',
    ];

    public function claim()
    {
        return $this->belongsTo(WarrantyClaim::class, 'warranty_claim_id');
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function replacementStock()
    {
        return $this->belongsTo(AccountStock::class, 'replacement_stock_id');
    }
}
