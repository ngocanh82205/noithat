<?php

namespace Database\Factories;

use App\Models\Voucher;
use Illuminate\Database\Eloquent\Factories\Factory;

class VoucherFactory extends Factory
{
    protected $model = Voucher::class;

    public function definition(): array
    {
        $type = fake()->randomElement(['percent', 'fixed']);
        $value = $type === 'percent' ? fake()->numberBetween(5, 30) : fake()->numberBetween(50000, 2000000);

        return [
            'code' => fake()->unique()->bothify('VOUCHER-????'),
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'discount_type' => $type,
            'discount_value' => $value,
            'min_order_amount' => fake()->numberBetween(1000000, 20000000),
            'max_discount' => $type === 'percent' ? fake()->optional(0.5)->numberBetween(1000000, 10000000) : null,
            'usage_limit' => fake()->numberBetween(10, 500),
            'usage_limit_per_user' => fake()->numberBetween(1, 5),
            'used_count' => 0,
            'start_date' => now()->subDay(),
            'end_date' => now()->addDays(30),
            'is_active' => true,
        ];
    }

    public function percent(int $percent = 10): static
    {
        return $this->state(fn () => ['discount_type' => 'percent', 'discount_value' => $percent]);
    }

    public function fixed(int $amount = 500000): static
    {
        return $this->state(fn () => ['discount_type' => 'fixed', 'discount_value' => $amount]);
    }

    public function expired(): static
    {
        return $this->state(fn () => ['end_date' => now()->subDay()]);
    }

    public function usedUp(): static
    {
        return $this->state(fn () => ['used_count' => 999, 'usage_limit' => 100]);
    }

    public function minOrder(int $amount): static
    {
        return $this->state(fn () => ['min_order_amount' => $amount]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}