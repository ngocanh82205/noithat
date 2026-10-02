<?php

namespace Database\Factories;

use App\Models\ProductVariant;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'name' => fake()->randomElement(['Đỏ', 'Xanh navy', 'Beige', 'Đen', 'Trắng', 'Nâu', 'Xám']),
            'sku' => fake()->unique()->bothify('VAR-####'),
            'color_name' => fake()->randomElement(['Đỏ', 'Xanh navy', 'Beige', 'Đen', 'Trắng', 'Nâu', 'Xám']),
            'color_hex' => fake()->hexColor(),
            'material' => fake()->randomElement(['Da bò Ý', 'Gỗ sồi', 'Vải nỉ']),
            'size' => fake()->randomElement(['S', 'M', 'L', 'XL', '1 seater', '2 seater', '3 seater']),
            'price' => fake()->numberBetween(500000, 10000000),
            'stock_quantity' => fake()->numberBetween(0, 20),
            'image_url' => null,
        ];
    }

    public function inStock(): static
    {
        return $this->state(fn () => ['stock_quantity' => fake()->numberBetween(1, 20)]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn () => ['stock_quantity' => 0]);
    }
}