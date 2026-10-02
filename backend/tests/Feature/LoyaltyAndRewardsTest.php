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
use App\Http\Controllers\Api\Reward\LuckyWheelController;
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

        // Đơn hoàn thành không thể chuyển ngược (tránh hoàn thành lại để nhận xu lần nữa)
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'shipping'])
            ->assertStatus(422);
        $this->assertEquals(Order::STATUS_COMPLETED, $order->fresh()->order_status);

        // Lưu lại "completed" lần nữa không cộng xu thêm
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
    /** @test */
    public function admin_refund_restores_stock_voucher_and_spent_coins()
    {
        $voucher = Voucher::factory()->create([
            'code' => 'REF10', 'discount_type' => 'percent', 'discount_value' => 10,
            'min_order_amount' => 0, 'usage_limit' => 100, 'usage_limit_per_user' => 1, 'used_count' => 0,
            'is_active' => true, 'start_date' => now()->subDay(), 'end_date' => now()->addDay(),
        ]);
        $order = $this->placeOrder(['voucher_code' => 'REF10', 'coins_used' => 50]);
        $this->assertEquals(0, $this->user->fresh()->coins);
        $this->assertEquals(1, $voucher->fresh()->used_count);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'completed']);
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'refunded'])
            ->assertOk();

        $order->refresh();
        $this->assertEquals(Order::STATUS_REFUNDED, $order->order_status);
        $this->assertEquals('refunded', $order->payment_status);
        $this->assertEquals(10, $this->product->fresh()->stock_quantity);
        $this->assertEquals(0, $voucher->fresh()->used_count);
        // Xu đã dùng được trả lại, xu tích lũy bị thu hồi
        $this->assertEquals(50, $this->user->fresh()->coins);
    }

    /** @test */
    public function refunding_a_cancelled_order_does_not_restore_stock_twice()
    {
        $order = $this->placeOrder(['coins_used' => 50]);
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'cancelled'])->assertOk();
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'refunded'])->assertOk();

        $this->assertEquals(10, $this->product->fresh()->stock_quantity);
        $this->assertEquals(50, $this->user->fresh()->coins);
    }

    /** @test */
    public function cancelled_or_refunded_order_cannot_be_reopened()
    {
        $order = $this->placeOrder();
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'cancelled'])->assertOk();

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'completed'])
            ->assertStatus(422);

        $this->assertEquals(50, $this->user->fresh()->coins);
        $this->assertEquals(Order::STATUS_CANCELLED, $order->fresh()->order_status);
    }

    /** @test */
    public function admin_can_filter_orders_by_multiple_statuses()
    {
        $this->placeOrder();
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/orders?status=pending,processing')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    /** @test */
    public function approving_withdrawal_pays_only_the_requested_amount()
    {
        $referrer = User::factory()->create();
        foreach ([300000, 400000] as $amount) {
            AffiliateCommission::create([
                'user_id' => $referrer->id, 'order_id' => null, 'order_amount' => $amount * 20,
                'commission_rate' => 5, 'commission_amount' => $amount, 'status' => 'approved',
            ]);
        }
        $withdrawal = WithdrawalRequest::create([
            'user_id' => $referrer->id, 'amount' => 500000, 'bank_name' => 'VCB',
            'account_number' => '1', 'account_holder' => 'A', 'status' => 'pending',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/withdrawals/{$withdrawal->id}/approve")
            ->assertOk();

        $paid = AffiliateCommission::where('user_id', $referrer->id)->where('status', 'paid')->sum('commission_amount');
        $available = AffiliateCommission::where('user_id', $referrer->id)->where('status', 'approved')->sum('commission_amount');
        $this->assertEquals(500000, (float) $paid);
        $this->assertEquals(200000, (float) $available);

        // Tách khoản không làm tăng số "đơn được giới thiệu"
        $this->actingAs($referrer, 'sanctum')->getJson('/api/affiliate/stats')
            ->assertJsonPath('data.available_balance', 200000);
    }

    /** @test */
    public function withdrawal_cannot_be_approved_above_current_balance()
    {
        $referrer = User::factory()->create();
        AffiliateCommission::create([
            'user_id' => $referrer->id, 'order_id' => null, 'order_amount' => 4000000,
            'commission_rate' => 5, 'commission_amount' => 200000, 'status' => 'approved',
        ]);
        $withdrawal = WithdrawalRequest::create([
            'user_id' => $referrer->id, 'amount' => 300000, 'bank_name' => 'VCB',
            'account_number' => '1', 'account_holder' => 'A', 'status' => 'pending',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/withdrawals/{$withdrawal->id}/approve")
            ->assertStatus(422);

        $this->assertEquals('pending', $withdrawal->fresh()->status);
        $this->assertEquals(0, AffiliateCommission::where('status', 'paid')->count());
    }

    /** @test */
    public function lucky_wheel_awards_server_side_coins_once_per_day()
    {
        $this->postJson('/api/rewards/spin')->assertStatus(401);

        $res = $this->actingAs($this->user, 'sanctum')->postJson('/api/rewards/spin')->assertOk();
        $index = $res->json('data.segment_index');
        $won = LuckyWheelController::SEGMENTS[$index]['coins'];
        $this->assertEquals($won, $res->json('data.coins_won'));
        $this->assertEquals(50 + $won, $this->user->fresh()->coins);

        $this->actingAs($this->user, 'sanctum')->postJson('/api/rewards/spin')->assertStatus(429);
        $this->actingAs($this->user, 'sanctum')->getJson('/api/rewards/spin')
            ->assertJsonPath('data.can_spin', false);

        $this->travel(1)->days();
        $this->actingAs($this->user, 'sanctum')->getJson('/api/rewards/spin')
            ->assertJsonPath('data.can_spin', true);
    }

    /** @test */
    public function first_verified_review_awards_coins_once()
    {
        $order = $this->placeOrder();
        $order->update(['order_status' => Order::STATUS_COMPLETED]);
        $payload = ['customer_name' => 'Test', 'rating' => 5, 'comment' => 'Đẹp'];

        $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/products/{$this->product->id}/reviews", $payload)
            ->assertJsonPath('coins_awarded', 50);
        $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/products/{$this->product->id}/reviews", $payload)
            ->assertJsonPath('coins_awarded', 0);

        $this->assertEquals(100, $this->user->fresh()->coins);
    }

    /** @test */
    public function unverified_review_awards_no_coins()
    {
        $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/products/{$this->product->id}/reviews", ['customer_name' => 'T', 'rating' => 5, 'comment' => 'x'])
            ->assertJsonPath('coins_awarded', 0);

        $this->assertEquals(50, $this->user->fresh()->coins);
    }
}
