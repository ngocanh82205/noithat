<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $customer;
    protected User $staff;
    protected User $seller;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->customer = User::factory()->create(['role' => 'customer']);
        $this->staff = User::factory()->create(['role' => 'staff']);
        $this->seller = User::factory()->create(['role' => 'seller']);

        Product::factory()->count(3)->create();
        Order::factory()->count(2)->create();
    }

    /** @test */
    public function admin_can_access_admin_routes()
    {
        $routes = [
            '/api/admin/dashboard/stats',
            '/api/admin/products',
            '/api/admin/orders',
            '/api/admin/vouchers',
            '/api/admin/faqs',
            '/api/admin/customers',
            '/api/admin/withdrawals',
        ];

        foreach ($routes as $route) {
            $response = $this->actingAs($this->admin, 'sanctum')
                ->getJson($route);

            $this->assertNotEquals(403, $response->status(), "Admin should access {$route}");
        }
    }

    /** @test */
    public function customer_cannot_access_any_admin_route()
    {
        $routes = [
            '/api/admin/dashboard/stats',
            '/api/admin/products',
            '/api/admin/orders',
            '/api/admin/vouchers',
            '/api/admin/faqs',
            '/api/admin/customers',
            '/api/admin/withdrawals',
        ];

        foreach ($routes as $route) {
            $response = $this->actingAs($this->customer, 'sanctum')
                ->getJson($route);

            $response->assertStatus(403, "Customer should NOT access {$route} but got {$response->status()}");
        }
    }

    /** @test */
    public function staff_cannot_access_admin_routes()
    {
        $routes = [
            '/api/admin/dashboard/stats',
            '/api/admin/products',
            '/api/admin/orders',
        ];

        foreach ($routes as $route) {
            $response = $this->actingAs($this->staff, 'sanctum')
                ->getJson($route);

            $response->assertStatus(403, "Staff should NOT access {$route} but got {$response->status()}");
        }
    }

    /** @test */
    public function seller_cannot_access_admin_routes()
    {
        $routes = [
            '/api/admin/dashboard/stats',
            '/api/admin/products',
            '/api/admin/orders',
        ];

        foreach ($routes as $route) {
            $response = $this->actingAs($this->seller, 'sanctum')
                ->getJson($route);

            $response->assertStatus(403, "Seller should NOT access {$route} but got {$response->status()}");
        }
    }

    /** @test */
    public function unauthenticated_user_cannot_access_admin_routes()
    {
        $routes = [
            '/api/admin/dashboard/stats',
            '/api/admin/products',
            '/api/admin/orders',
        ];

        foreach ($routes as $route) {
            $response = $this->getJson($route);

            $response->assertStatus(401, "Unauthenticated should NOT access {$route}");
        }
    }

    /** @test */
    public function admin_can_perform_crud_on_products()
    {
        // Create
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/products', [
                'name' => 'New Product',
                'slug' => 'new-product',
                'sku' => 'NP-001',
                'price' => 5000000,
                'category_id' => 1,
                'status' => 'active',
            ]);
        $response->assertStatus(201);
        $productId = $response->json('data.id');

        // Read
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/admin/products/{$productId}");
        $response->assertStatus(200);

        // Update
        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/products/{$productId}", [
                'name' => 'Updated Product',
                'price' => 6000000,
            ]);
        $response->assertStatus(200);

        // Delete
        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/admin/products/{$productId}");
        $response->assertStatus(200);
    }

    /** @test */
    public function customer_cannot_perform_admin_product_actions()
    {
        $product = Product::factory()->create();

        $actions = [
            ['method' => 'post', 'url' => '/api/admin/products', 'data' => ['name' => 'Test']],
            ['method' => 'put', 'url' => "/api/admin/products/{$product->id}", 'data' => ['name' => 'Test']],
            ['method' => 'delete', 'url' => "/api/admin/products/{$product->id}", 'data' => []],
        ];

        foreach ($actions as $action) {
            $response = $this->actingAs($this->customer, 'sanctum')
                ->json($action['method'], $action['url'], $action['data']);

            $response->assertStatus(403);
        }
    }

    /** @test */
    public function admin_can_update_order_status()
    {
        $order = Order::factory()->create(['order_status' => 'processing']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'confirmed',
                'payment_status' => 'paid',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('confirmed', $order->fresh()->order_status);
    }

    /** @test */
    public function customer_cannot_update_order_status()
    {
        $order = Order::factory()->create();

        $response = $this->actingAs($this->customer, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'completed',
            ]);

        $response->assertStatus(403);
    }
}