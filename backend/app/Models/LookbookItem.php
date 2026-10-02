<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LookbookItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'lookbook_id',
        'product_id',
        'x_position',
        'y_position',
        'note',
    ];

    protected $casts = [
        'x_position' => 'float',
        'y_position' => 'float',
    ];

    public function lookbook(): BelongsTo
    {
        return $this->belongsTo(Lookbook::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
