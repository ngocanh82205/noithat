<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'order_number' => 'GSL-' . date('Ymd') . '-' . fake()->unique()->bothify('??????'),
            'user_id' => User::factory(),
            'customer_name' => fake()->name(),
            'customer_email' => fake()->unique()->safeEmail(),
            'customer_phone' => fake()->phoneNumber(),
            'shipping_address' => fake()->address(),
            'shipping_city' => fake()->randomElement(['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng']),
            'shipping_district' => fake()->city(),
            'shipping_method' => fake()->randomElement(['standard', 'express', 'install_pro']),
            'notes' => fake()->optional()->sentence(),
            'subtotal' => fake()->randomFloat(2, 1000000, 100000000),
            'shipping_fee' => fake()->randomElement([0, 250000, 500000, 300000]),
            'discount_amount' => fake()->randomFloat(2, 0, 5000000),
            'coins_used' => fake()->numberBetween(0, 100),
            'coins_discount' => fake()->numberBetween(0, 100) * 1000,
            'total_amount' => fake()->randomFloat(2, 1000000, 100000000),
            'payment_method' => fake()->randomElement(['cod', 'bank_transfer', 'vnpay', 'momo']),
            'payment_status' => fake()->randomElement(['pending', 'paid', 'refunded']),
            'referral_code' => null,
            'voucher_code' => null,
            'order_status' => fake()->randomElement(['pending', 'processing', 'confirmed', 'shipping', 'completed', 'cancelled']),
            'tracking_code' => 'VN' . fake()->bothify('????????') . 'GS',
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['order_status' => 'pending']);
    }

    public function completed(): static
    {
        return $this->state(fn () => ['order_status' => 'completed', 'payment_status' => 'paid']);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => ['order_status' => 'cancelled']);
    }

    public function forUser(User $user): static
    {
        return $this->state(fn () => ['user_id' => $user->id]);
    }
}