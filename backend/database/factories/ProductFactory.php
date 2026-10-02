<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Category;
use App\Models\Collection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'slug' => fake()->unique()->slug(),
            'sku' => fake()->unique()->bothify('SKU-####'),
            'category_id' => Category::inRandomOrder()->first()?->id ?? Category::factory(),
            'collection_id' => Collection::inRandomOrder()->first()?->id ?? Collection::factory(),
            'shop_id' => User::where('role', 'seller')->inRandomOrder()->first()?->id,
            'summary' => fake()->sentence(),
            'description' => fake()->paragraphs(3, true),
            'price' => fake()->numberBetween(1000000, 50000000),
            'original_price' => fake()->optional(0.3)->numberBetween(5000000, 60000000),
            'material' => fake()->randomElement(['Da bò Ý', 'Gỗ sồi', 'Đá Marble', 'Pha lê K9', 'Vải nỉ cao cấp']),
            'dimensions' => fake()->regexify('[0-9]{4} x [0-9]{3} x [0-9]{3} mm'),
            'warranty' => '24 tháng',
            'care_instructions' => fake()->sentence(),
            'in_stock' => true,
            'stock_quantity' => fake()->numberBetween(0, 50),
            'is_featured' => fake()->boolean(20),
            'is_new' => fake()->boolean(30),
            'is_bestseller' => fake()->boolean(15),
            'rating_avg' => fake()->randomFloat(1, 3, 5),
            'rating_count' => fake()->numberBetween(0, 100),
            'status' => fake()->randomElement(['active', 'inactive', 'draft']),
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => ['status' => 'active', 'in_stock' => true, 'stock_quantity' => fake()->numberBetween(1, 50)]);
    }

    public function featured(): static
    {
        return $this->state(fn () => ['is_featured' => true]);
    }

    public function bestseller(): static
    {
        return $this->state(fn () => ['is_bestseller' => true]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn () => ['stock_quantity' => 0, 'in_stock' => false]);
    }
}