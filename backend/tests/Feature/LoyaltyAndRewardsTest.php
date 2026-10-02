<?php

namespace Tests\Feature;

use App\Models\AffiliateCommission;
use App\Models\FlashSale;
use App\Models\FlashSaleProduct;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use App\Models\Voucher;
use App\Models\WithdrawalRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoyaltyAndRewardsTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $admin;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['coins' => 50]);
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->product = Product::factory()->active()->create([
            'name' => 'Test Sofa',
            'price' => 10000000,
            'stock_quantity' => 10,
        ]);
    }

    private function orderPayload(array $overrides = []): array
    {
        return array_merge([
            'customer_name' => 'Test User',
            'customer_email' => 'test@example.com',
            'customer_phone' => '0901234567',
            'shipping_address' => '123 Test Street',
            'shipping_city' => 'Hà Nội',
            'payment_method' => 'cod',
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
        ], $overrides);
    }

    private function placeOrder(array $overrides = [], ?User $as = null): Order
    {
        $this->actingAs($as ?? $this->user, 'sanctum')
            ->postJson('/api/orders', $this->orderPayload($overrides))
            ->assertStatus(201);

        return Order::latest('id')->first();
    }

    /** @test */
    public function coins_used_are_clamped_to_user_balance()
    {
        $order = $this->placeOrder(['coins_used' => 100000]);

        $this->assertEquals(50, $order->coins_used);
        $this->assertEquals(50000, $order->coins_discount);
        $this->assertEquals(0, $this->user->fresh()->coins);
    }

    /** @test */
    public function coins_used_are_capped_at_twenty_percent_of_subtotal()
    {
        $this->user->update(['coins' => 5000]);

        // 20% của 10.000.000₫ = 2.000.000₫ = 2.000 xu
        $order = $this->placeOrder(['coins_used' => 5000]);

        $this->assertEquals(2000, $order->coins_used);
        $this->assertEquals(3000, $this->user->fresh()->coins);
    }

    /** @test */
    public function cancelling_order_restores_exactly_the_coins_spent()
    {
        $order = $this->placeOrder(['coins_used' => 100000]);

        $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/orders/{$order->order_number}/cancel")
            ->assertOk();

        $this->assertEquals(50, $this->user->fresh()->coins);
    }

    /** @test */
    public function completing_order_awards_loyalty_coins_once()
    {
        $order = $this->placeOrder();
        $expectedCoins = (int) floor($order->total_amount / Order::LOYALTY_VND_PER_COIN);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'completed', 'payment_status' => 'paid'])
            ->assertOk();

        $this->assertEquals(50 + $expectedCoins, $this->user->fresh()->coins);
        $this->assertEquals($expectedCoins, $order->fresh()->coins_earned);

        // Re-saving "completed" (e.g. after a status round-trip) must not award twice
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'shipping'])
            ->assertOk();
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'completed'])
            ->assertOk();

        $this->assertEquals(50 + $expectedCoins, $this->user->fresh()->coins);
    }

    /** @test */
    public function refunding_order_revokes_loyalty_coins_and_commission()
    {
        $referrer = User::factory()->create(['referral_code' => 'REF-TEST']);
        $order = $this->placeOrder(['referral_code' => 'REF-TEST']);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'completed']);
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'refunded', 'payment_status' => 'refunded'])
            ->assertOk();

        $this->assertEquals(50, $this->user->fresh()->coins);
        $this->assertEquals(0, $order->fresh()->coins_earned);
        $this->assertDatabaseHas('affiliate_commissions', [
            'order_id' => $order->id,
            'user_id' => $referrer->id,
            'status' => 'cancelled',
        ]);
    }

    /** @test */
    public function affiliate_commission_is_pending_until_order_completed()
    {
        $referrer = User::factory()->create(['referral_code' => 'REF-TEST']);
        $order = $this->placeOrder(['referral_code' => 'REF-TEST']);

        $commission = AffiliateCommission::where('order_id', $order->id)->firstOrFail();
        $this->assertEquals('pending', $commission->status);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'completed'])
            ->assertOk();

        $this->assertEquals('approved', $commission->fresh()->status);
    }

    /** @test */
    public function user_cannot_submit_second_withdrawal_while_one_is_pending()
    {
        $referrer = User::factory()->create(['referral_code' => 'REF-TEST']);
        $order = $this->placeOrder(['referral_code' => 'REF-TEST']);
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'completed']);

        $payload = [
            'amount' => 200000,
            'bank_name' => 'VCB',
            'account_number' => '0123456789',
            'account_holder' => 'NGUYEN VAN A',
        ];

        $this->actingAs($referrer, 'sanctum')->postJson('/api/affiliate/withdraw', $payload)->assertOk();
        $this->actingAs($referrer, 'sanctum')->postJson('/api/affiliate/withdraw', $payload)->assertStatus(422);

        $this->assertEquals(1, WithdrawalRequest::where('user_id', $referrer->id)->count());
    }

    /** @test */
    public function voucher_apply_rejects_expired_voucher()
    {
        Voucher::factory()->expired()->create(['code' => 'OLD10', 'min_order_amount' => 0]);

        $this->postJson('/api/vouchers/apply', ['code' => 'OLD10', 'subtotal' => 5000000])
            ->assertStatus(404);
    }

    /** @test */
    public function voucher_record_usage_requires_admin()
    {
        $this->postJson('/api/vouchers/record-usage', [])->assertStatus(401);
        $this->actingAs($this->user, 'sanctum')->postJson('/api/vouchers/record-usage', [])->assertStatus(403);
    }

    /** @test */
    public function admin_can_update_and_toggle_voucher()
    {
        $voucher = Voucher::factory()->create(['code' => 'EDIT10', 'discount_type' => 'percent', 'discount_value' => 10, 'is_active' => true]);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/vouchers/{$voucher->id}", ['is_active' => false, 'discount_value' => 15])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->assertEquals(15, (float) $voucher->fresh()->discount_value);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/vouchers/{$voucher->id}", ['discount_value' => 150])
            ->assertStatus(422);

        $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/admin/vouchers/{$voucher->id}", ['is_active' => true])
            ->assertStatus(403);
    }

    /** @test */
    public function review_is_verified_only_after_completed_purchase()
    {
        $reviewPayload = ['customer_name' => 'Test', 'rating' => 5, 'comment' => 'Tuyệt vời'];

        $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/products/{$this->product->id}/reviews", $reviewPayload);
        $this->assertFalse((bool) Review::latest('id')->first()->is_verified_purchase);

        $order = $this->placeOrder();
        $order->update(['order_status' => Order::STATUS_COMPLETED]);

        $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/products/{$this->product->id}/reviews", $reviewPayload);
        $this->assertTrue((bool) Review::latest('id')->first()->is_verified_purchase);
    }
    /** @test */
    public function customer_cannot_self_cancel_paid_order()
    {
        $order = $this->placeOrder(['payment_method' => 'vnpay']);
        $order->update(['payment_status' => 'paid', 'order_status' => Order::STATUS_CONFIRMED]);

        $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/orders/{$order->order_number}/cancel")
            ->assertStatus(422);

        $this->assertEquals(Order::STATUS_CONFIRMED, $order->fresh()->order_status);
        $this->assertEquals(9, $this->product->fresh()->stock_quantity);
    }

    /** @test */
    public function cancelled_order_cannot_start_online_payment()
    {
        $order = $this->placeOrder(['payment_method' => 'vnpay']);
        $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/orders/{$order->order_number}/cancel")
            ->assertOk();

        $this->postJson('/api/vnpay/create-payment', ['order_id' => $order->id])->assertStatus(404);
    }

    /** @test */
    public function cancelling_order_releases_flash_sale_quota()
    {
        $sale = FlashSale::create([
            'name' => 'Flash',
            'start_time' => now()->subHour(),
            'end_time' => now()->addHour(),
            'is_active' => true,
        ]);
        $fsp = FlashSaleProduct::create([
            'flash_sale_id' => $sale->id,
            'product_id' => $this->product->id,
            'flash_price' => 8000000,
            'stock_for_sale' => 5,
            'sold_count' => 0,
        ]);

        $order = $this->placeOrder(['items' => [['product_id' => $this->product->id, 'quantity' => 2]]]);
        $this->assertEquals(2, $fsp->fresh()->sold_count);
        $this->assertEquals(16000000, $order->subtotal);

        $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/orders/{$order->order_number}/cancel")
            ->assertOk();

        $this->assertEquals(0, $fsp->fresh()->sold_count);
        $this->assertEquals(10, $this->product->fresh()->stock_quantity);
    }
}
