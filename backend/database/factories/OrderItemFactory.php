<?php

namespace Database\Factories;

use App\Models\OrderItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        $product = Product::factory()->create();
        $price = $product->price;

        return [
            'order_id' => Order::factory(),
            'product_id' => $product->id,
            'variant_id' => null,
            'product_name' => $product->name,
            'variant_name' => null,
            'product_image' => $product->images->first()?->image_url ?? null,
            'price' => $price,
            'quantity' => fake()->numberBetween(1, 5),
            'total_price' => $price * fake()->numberBetween(1, 5),
        ];
    }

    public function forOrder(Order $order): static
    {
        return $this->state(fn () => ['order_id' => $order->id]);
    }

    public function withVariant(ProductVariant $variant): static
    {
        return $this->state(fn () => [
            'variant_id' => $variant->id,
            'product_id' => $variant->product_id,
            'product_name' => $variant->product->name,
            'variant_name' => $variant->name,
            'price' => $variant->price,
            'total_price' => $variant->price * $this->attributes['quantity'] ?? 1,
        ]);
    }
}