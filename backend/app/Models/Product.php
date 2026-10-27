<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'account_type',
        'price',
        'warranty_hours',
        'is_auto_warranty',
        'is_off_mode',
        'short_description',
        'details_markdown',
        'badges',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'integer',
        'warranty_hours' => 'integer',
        'is_auto_warranty' => 'boolean',
        'is_off_mode' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'badges' => 'array',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function stocks()
    {
        return $this->hasMany(AccountStock::class);
    }

    public function availableStocks()
    {
        return $this->hasMany(AccountStock::class)->where('status', 'available');
    }

    public function getAvailableStockCountAttribute(): int
    {
        return $this->availableStocks()->count();
    }
}
