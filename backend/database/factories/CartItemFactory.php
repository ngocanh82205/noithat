<?php

namespace Database\Factories;

use App\Models\CartItem;
use App\Models\User;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

class CartItemFactory extends Factory
{
    protected $model = CartItem::class;

    public function definition(): array
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();

        return [
            'user_id' => $user->id,
            'session_id' => null,
            'product_id' => $product->id,
            'variant_id' => null,
            'quantity' => fake()->numberBetween(1, 5),
        ];
    }

    public function forUser(User $user): static
    {
        return $this->state(fn () => ['user_id' => $user->id, 'session_id' => null]);
    }

    public function forSession(string $sessionId): static
    {
        return $this->state(fn () => ['user_id' => null, 'session_id' => $sessionId]);
    }

    public function withVariant(ProductVariant $variant): static
    {
        return $this->state(fn () => ['variant_id' => $variant->id]);
    }
}