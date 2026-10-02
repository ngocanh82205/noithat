<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'variant_id',
        'product_name',
        'variant_name',
        'product_image',
        'price',
        'quantity',
        'total_price',
    ];

    protected $casts = [
        'price' => 'float',
        'quantity' => 'integer',
        'total_price' => 'float',
    ];

    protected $appends = [
        'unit_price',
        'subtotal',
    ];

    public function getUnitPriceAttribute(): float
    {
        return (float) ($this->price ?? 0);
    }

    public function getSubtotalAttribute(): float
    {
        return (float) ($this->total_price ?? (($this->price ?? 0) * ($this->quantity ?? 1)));
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }
}
