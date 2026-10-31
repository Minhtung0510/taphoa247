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

    protected $appends = ['evidence_url'];

    public function getEvidenceUrlAttribute(): ?string
    {
        if (empty($this->evidence_path) || $this->evidence_path === 'no_file') {
            return null;
        }

        return \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'warranty.evidence',
            now()->addMinutes(10),
            ['id' => $this->id]
        );
    }

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
