<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'phone',
        'email',
        'address',
        'preferred_date',
        'space_type',
        'budget_range',
        'message',
        'status',
    ];

    protected $casts = [
        'preferred_date' => 'date',
    ];
}
