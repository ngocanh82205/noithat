<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'sku',
        'category_id',
        'collection_id',
        'shop_id',
        'summary',
        'description',
        'price',
        'original_price',
        'material',
        'dimensions',
        'warranty',
        'care_instructions',
        'in_stock',
        'stock_quantity',
        'is_featured',
        'is_new',
        'is_bestseller',
        'rating_avg',
        'rating_count',
        'status',
    ];

    protected $casts = [
        'price' => 'float',
        'original_price' => 'float',
        'in_stock' => 'boolean',
        'is_featured' => 'boolean',
        'is_new' => 'boolean',
        'is_bestseller' => 'boolean',
        'rating_avg' => 'float',
        'rating_count' => 'integer',
        'stock_quantity' => 'integer',
    ];

    protected $appends = [
        'is_active',
    ];

    public function getIsActiveAttribute(): bool
    {
        return ($this->status ?? 'active') === 'active';
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shop_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class)->where('is_approved', true);
    }
}
