<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminReportsAndSearchTest extends TestCase
{
    use RefreshDatabase;

    private function orderWith(Product $product, int $qty, string $status, User $customer): Order
    {
        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'order_status' => $status,
            'total_amount' => $product->price * $qty,
        ]);
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'price' => $product->price,
            'quantity' => $qty,
            'total_price' => $product->price * $qty,
        ]);

        return $order;
    }

    /** @test */
    public function dashboard_top_products_are_ranked_by_units_sold_excluding_cancelled_orders()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create();
        $a = Product::factory()->active()->create(['name' => 'A']);
        $b = Product::factory()->active()->create(['name' => 'B']);

        $this->orderWith($a, 2, 'completed', $customer);
        $this->orderWith($b, 3, 'completed', $customer);
        $this->orderWith($a, 9, 'cancelled', $customer);

        $res = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/dashboard/stats')->assertOk();

        $top = collect($res->json('data.top_products'));
        $this->assertEquals('B', $top->first()['name']);
        $this->assertEquals(3, $top->firstWhere('name', 'B')['sold_count']);
        $this->assertEquals(2, $top->firstWhere('name', 'A')['sold_count']);
    }

    /** @test */
    public function admin_customers_total_spent_excludes_cancelled_and_refunded_orders()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['email' => 'vip@example.com']);
        $p = Product::factory()->active()->create(['price' => 1000000]);

        $this->orderWith($p, 5, 'completed', $customer);
        $this->orderWith($p, 7, 'cancelled', $customer);
        $this->orderWith($p, 11, 'refunded', $customer);

        $res = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/customers?q=vip@example.com')->assertOk();

        $this->assertEquals(5000000, (float) $res->json('data.0.total_spent'));
    }

    /** @test */
    public function visual_search_rule_based_returns_products_with_match_reason()
    {
        Product::factory()->active()->count(3)->create(['stock_quantity' => 5]);

        $res = $this->postJson('/api/visual-search', ['prompt' => 'sofa phòng khách', 'room_type' => 'living'])
            ->assertOk();

        $this->assertEquals('Phòng khách', $res->json('data.detected_room_type'));
        foreach ($res->json('data.products') as $product) {
            $this->assertNotEmpty($product['match_reason']);
        }
    }
}
