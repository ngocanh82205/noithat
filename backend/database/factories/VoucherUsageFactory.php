<?php

namespace Database\Factories;

use App\Models\VoucherUsage;
use App\Models\Voucher;
use App\Models\User;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class VoucherUsageFactory extends Factory
{
    protected $model = VoucherUsage::class;

    public function definition(): array
    {
        return [
            'voucher_id' => Voucher::factory(),
            'user_id' => User::factory(),
            'session_id' => null,
            'order_id' => Order::factory(),
            'discount_amount' => fake()->randomFloat(2, 10000, 5000000),
        ];
    }
}