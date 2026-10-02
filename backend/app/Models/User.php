<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'avatar',
        'address',
        'role',
        'coins',
        'referral_code',
        'referred_by',
        'shop_name',
        'shop_description',
        'shop_logo',
        'shop_rating',
        'is_shop_active',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_spin_at' => 'datetime',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function affiliateCommissions(): HasMany
    {
        return $this->hasMany(AffiliateCommission::class);
    }

    public function shopProducts(): HasMany
    {
        return $this->hasMany(Product::class, 'shop_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isSeller(): bool
    {
        return $this->role === 'seller' || $this->is_shop_active;
    }

    public function getReferralCode(): string
    {
        if (!$this->referral_code) {
            $this->referral_code = 'GS-' . strtoupper(substr(md5($this->id . $this->email), 0, 6));
            $this->saveQuietly();
        }
        return $this->referral_code;
    }
}