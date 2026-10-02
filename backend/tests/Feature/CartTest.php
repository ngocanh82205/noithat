<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\CartItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    protected User $userA;
    protected User $userB;
    protected Product $product;
    protected ProductVariant $variant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->userA = User::factory()->create();
        $this->userB = User::factory()->create();

        $this->product = Product::factory()->active()->create([
            'name' => 'Test Sofa',
            'price' => 10000000,
            'stock_quantity' => 10,
        ]);

        $this->variant = ProductVariant::factory()->inStock()->create([
            'product_id' => $this->product->id,
            'name' => 'Red',
            'price' => 11000000,
        ]);
    }

    /** @test */
    public function authenticated_user_can_add_item_to_cart()
    {
        $response = $this->actingAs($this->userA, 'sanctum')
            ->postJson('/api/cart', [
                'product_id' => $this->product->id,
                'variant_id' => $this->variant->id,
                'quantity' => 2,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'item' => ['id', 'product_id', 'variant_id', 'quantity', 'product', 'variant'],
                    'session_id'
                ]
            ]);

        $this->assertDatabaseHas('cart_items', [
            'user_id' => $this->userA->id,
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'quantity' => 2,
        ]);
    }

    /** @test */
    public function authenticated_user_can_add_item_to_cart_without_variant()
    {
        $response = $this->actingAs($this->userA, 'sanctum')
            ->postJson('/api/cart', [
                'product_id' => $this->product->id,
                'quantity' => 1,
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('cart_items', [
            'user_id' => $this->userA->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
        ]);
    }

    /** @test */
    public function user_cannot_update_another_users_cart_item()
    {
        $cartItem = CartItem::factory()->forUser($this->userA)->create([
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($this->userB, 'sanctum')
            ->putJson("/api/cart/{$cartItem->id}", [
                'quantity' => 5,
            ]);

        $response->assertStatus(404);

        $this->assertDatabaseHas('cart_items', [
            'id' => $cartItem->id,
            'quantity' => 1,
        ]);
    }

    /** @test */
    public function user_cannot_delete_another_users_cart_item()
    {
        $cartItem = CartItem::factory()->forUser($this->userA)->create([
            'product_id' => $this->product->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($this->userB, 'sanctum')
            ->deleteJson("/api/cart/{$cartItem->id}");

        $response->assertStatus(404);

        $this->assertDatabaseHas('cart_items', ['id' => $cartItem->id]);
    }

    /** @test */
    public function user_cannot_access_another_users_cart_item()
    {
        $cartItem = CartItem::factory()->forUser($this->userA)->create([
            'product_id' => $this->product->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($this->userB, 'sanctum')
            ->putJson("/api/cart/{$cartItem->id}", ['quantity' => 5]);

        $response->assertStatus(404);
    }

    /** @test */
    public function user_can_update_own_cart_item()
    {
        $cartItem = CartItem::factory()->forUser($this->userA)->create([
            'product_id' => $this->product->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($this->userA, 'sanctum')
            ->putJson("/api/cart/{$cartItem->id}", ['quantity' => 3]);

        $response->assertStatus(200)
            ->assertJsonPath('data.quantity', 3);

        $this->assertDatabaseHas('cart_items', [
            'id' => $cartItem->id,
            'quantity' => 3,
        ]);
    }

    /** @test */
    public function user_can_delete_own_cart_item()
    {
        $cartItem = CartItem::factory()->forUser($this->userA)->create([
            'product_id' => $this->product->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($this->userA, 'sanctum')
            ->deleteJson("/api/cart/{$cartItem->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('cart_items', ['id' => $cartItem->id]);
    }

    /** @test */
    public function user_can_clear_own_cart()
    {
        CartItem::factory()->count(3)->forUser($this->userA)->create();

        $response = $this->actingAs($this->userA, 'sanctum')
            ->deleteJson('/api/cart/clear');

        $response->assertStatus(200);
        $this->assertEquals(0, CartItem::where('user_id', $this->userA->id)->count());
    }
}