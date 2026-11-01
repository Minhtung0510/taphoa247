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
        'digishop_product_id',
        'shopmmo_product_id',
        'cloneus_product_id',
        'delivery_format',
        'price',
        'cost_price',
        'warranty_hours',
        'is_auto_warranty',
        'is_off_mode',
        'short_description',
        'details_markdown',
        'badges',
        'image_url',
        'options',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price'               => 'integer',
        'cost_price'          => 'integer',
        'warranty_hours'      => 'integer',
        'shopmmo_product_id'  => 'integer',
        'is_auto_warranty'    => 'boolean',
        'is_off_mode'         => 'boolean',
        'is_active'           => 'boolean',
        'sort_order'          => 'integer',
        'badges'              => 'array',
        'options'             => 'array',
    ];

    /**
     * Kiểm tra sản phẩm này có được fulfill qua Digishop Reseller API không.
     * Nếu có digishop_product_id, OrderService sẽ gọi reseller-create-order
     * thay vì lấy từ AccountStock.
     */
    public function isDigishop(): bool
    {
        return empty($this->cloneus_product_id) && !empty($this->digishop_product_id);
    }

    public function isCloneus(): bool
    {
        return !empty($this->cloneus_product_id);
    }

    /**
     * Kiểm tra sản phẩm này có được fulfill qua ShopMMO API không.
     * Ưu tiên sau Digishop (Digishop check trước).
     */
    public function isShopMmo(): bool
    {
        return !empty($this->shopmmo_product_id) && empty($this->digishop_product_id);
    }

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
