<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Product $product;
    protected ProductVariant $variant;
    protected Voucher $validVoucher;
    protected Voucher $expiredVoucher;
    protected Voucher $usedUpVoucher;
    protected Voucher $minOrderVoucher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $this->product = Product::factory()->active()->create([
            'name' => 'Test Sofa',
            'price' => 10000000,
            'stock_quantity' => 10,
        ]);

        $this->variant = ProductVariant::factory()->inStock()->create([
            'product_id' => $this->product->id,
            'name' => 'Red',
            'price' => 11000000,
            'stock_quantity' => 5,
        ]);

        // Valid voucher: 10% off, min 1M, max 5M, limit 100
        $this->validVoucher = Voucher::factory()->create([
            'code' => 'VALID10',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'min_order_amount' => 1000000,
            'max_discount' => 5000000,
            'usage_limit' => 100,
            'usage_limit_per_user' => 1,
            'used_count' => 0,
            'is_active' => true,
            'start_date' => now()->subDay(),
            'end_date' => now()->addDays(30),
        ]);

        // Expired voucher
        $this->expiredVoucher = Voucher::factory()->expired()->create([
            'code' => 'EXPIRED10',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'min_order_amount' => 1000000,
            'usage_limit' => 100,
            'usage_limit_per_user' => 1,
            'used_count' => 0,
        ]);

        // Used up voucher
        $this->usedUpVoucher = Voucher::factory()->usedUp()->create([
            'code' => 'USEDUP10',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'min_order_amount' => 1000000,
            'usage_limit' => 5,
            'usage_limit_per_user' => 1,
            'used_count' => 5,
        ]);

        // Min order voucher
        $this->minOrderVoucher = Voucher::factory()->minOrder(20000000)->create([
            'code' => 'MINORDER50',
            'discount_type' => 'fixed',
            'discount_value' => 500000,
            'usage_limit' => 100,
            'usage_limit_per_user' => 1,
            'used_count' => 0,
        ]);
    }

    /** @test */
    public function user_can_place_order_with_valid_voucher()
    {
        $data = [
            'customer_name' => 'Test User',
            'customer_email' => 'test@example.com',
            'customer_phone' => '0901234567',
            'shipping_address' => '123 Test Street',
            'shipping_city' => 'Hà Nội',
            'payment_method' => 'cod',
            'voucher_code' => 'VALID10',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['order' => ['id', 'order_number', 'total_amount', 'discount_amount', 'items']]
            ]);

        $order = Order::latest()->first();
        $this->assertEquals(1, $order->items->count());
        $this->assertEquals('VALID10', $order->voucher_code);
        $this->assertGreaterThan(0, $order->discount_amount);

        // Check voucher usage recorded
        $this->assertDatabaseHas('voucher_usages', [
            'voucher_id' => $this->validVoucher->id,
            'user_id' => $this->user->id,
            'order_id' => $order->id,
        ]);
        $this->assertEquals(1, $this->validVoucher->fresh()->used_count);
    }

    /** @test */
    public function order_rejected_when_voucher_expired()
    {
        $data = [
            'customer_name' => 'Test User',
            'customer_email' => 'test@example.com',
            'customer_phone' => '0901234567',
            'shipping_address' => '123 Test Street',
            'shipping_city' => 'Hà Nội',
            'payment_method' => 'cod',
            'voucher_code' => 'EXPIRED10',
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', $data);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Mã giảm giá không tồn tại hoặc đã hết hạn sử dụng.',
            ]);
    }

    /** @test */
    public function order_rejected_when_voucher_usage_limit_exceeded()
    {
        $data = [
            'customer_name' => 'Test User',
            'customer_email' => 'test@example.com',
            'customer_phone' => '0901234567',
            'shipping_address' => '123 Test Street',
            'shipping_city' => 'Hà Nội',
            'payment_method' => 'cod',
            'voucher_code' => 'USEDUP10',
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', $data);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Mã giảm giá đã hết lượt sử dụng.',
            ]);
    }

    /** @test */
    public function order_rejected_when_order_below_voucher_min_amount()
    {
        $data = [
            'customer_name' => 'Test User',
            'customer_email' => 'test@example.com',
            'customer_phone' => '0901234567',
            'shipping_address' => '123 Test Street',
            'shipping_city' => 'Hà Nội',
            'payment_method' => 'cod',
            'voucher_code' => 'MINORDER50',
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', $data);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => ['voucher_code']
            ]);
    }

    /** @test */
    public function order_rejected_when_product_out_of_stock()
    {
        $this->product->update(['stock_quantity' => 0]);

        $data = [
            'customer_name' => 'Test User',
            'customer_email' => 'test@example.com',
            'customer_phone' => '0901234567',
            'shipping_address' => '123 Test Street',
            'shipping_city' => 'Hà Nội',
            'payment_method' => 'cod',
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', $data);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => ['items']
            ]);
    }

    /** @test */
    public function order_rejected_when_variant_out_of_stock()
    {
        $this->variant->update(['stock_quantity' => 0]);

        $data = [
            'customer_name' => 'Test User',
            'customer_email' => 'test@example.com',
            'customer_phone' => '0901234567',
            'shipping_address' => '123 Test Street',
            'shipping_city' => 'Hà Nội',
            'payment_method' => 'cod',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', $data);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => ['items']
            ]);
    }

    /** @test */
    public function order_rejected_when_quantity_exceeds_stock()
    {
        $data = [
            'customer_name' => 'Test User',
            'customer_email' => 'test@example.com',
            'customer_phone' => '0901234567',
            'shipping_address' => '123 Test Street',
            'shipping_city' => 'Hà Nội',
            'payment_method' => 'cod',
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 20],
            ],
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', $data);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => ['items']
            ]);
    }

    /** @test */
    public function order_decrements_stock_after_successful_placement()
    {
        $initialStock = $this->product->stock_quantity;

        $data = [
            'customer_name' => 'Test User',
            'customer_email' => 'test@example.com',
            'customer_phone' => '0901234567',
            'shipping_address' => '123 Test Street',
            'shipping_city' => 'Hà Nội',
            'payment_method' => 'cod',
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 3],
            ],
        ];

        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', $data)
            ->assertStatus(201);

        $this->assertEquals(
            $initialStock - 3,
            $this->product->fresh()->stock_quantity
        );
    }

    /** @test */
    public function user_cannot_use_voucher_more_than_per_user_limit()
    {
        // First order uses voucher
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', [
                'customer_name' => 'Test User',
                'customer_email' => 'test@example.com',
                'customer_phone' => '0901234567',
                'shipping_address' => '123 Test Street',
                'shipping_city' => 'Hà Nội',
                'payment_method' => 'cod',
                'voucher_code' => 'VALID10',
                'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
            ]);

        // Second order with same voucher should fail
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', [
                'customer_name' => 'Test User',
                'customer_email' => 'test@example.com',
                'customer_phone' => '0901234567',
                'shipping_address' => '123 Test Street',
                'shipping_city' => 'Hà Nội',
                'payment_method' => 'cod',
                'voucher_code' => 'VALID10',
                'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Bạn đã sử dụng mã này 1 lần. Không thể áp dụng thêm.',
            ]);
    }
}