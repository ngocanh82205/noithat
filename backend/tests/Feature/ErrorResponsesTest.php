<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ErrorResponsesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.debug' => false]);
    }

    /** @test */
    public function unauthenticated_request_returns_vietnamese_message()
    {
        $this->getJson('/api/cart')
            ->assertStatus(401)
            ->assertExactJson(['success' => false, 'message' => 'Vui lòng đăng nhập để tiếp tục.']);
    }

    /** @test */
    public function missing_model_does_not_leak_internal_class_names()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $res = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/orders/999999')->assertStatus(404);

        $res->assertJson(['success' => false, 'message' => 'Không tìm thấy dữ liệu yêu cầu.']);
        $this->assertStringNotContainsString('App\\Models', $res->getContent());
    }

    /** @test */
    public function unknown_route_and_wrong_method_are_reported_in_vietnamese()
    {
        $this->getJson('/api/khong-ton-tai')->assertStatus(404)->assertJsonPath('message', 'Không tìm thấy dữ liệu yêu cầu.');
        $this->deleteJson('/api/products')->assertStatus(405)->assertJsonPath('message', 'Phương thức yêu cầu không được hỗ trợ.');
    }

    /** @test */
    public function validation_errors_are_vietnamese_and_message_is_the_first_specific_error()
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/affiliate/withdraw', ['amount' => 1000])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Số tiền rút tối thiểu là 200.000₫.')
            ->assertJsonPath('errors.bank_name.0', 'Vui lòng nhập tên ngân hàng.');
    }

    /** @test */
    public function out_of_stock_order_message_names_the_product()
    {
        $user = User::factory()->create();
        $product = Product::factory()->active()->create(['name' => 'Sofa Test', 'stock_quantity' => 1]);

        $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'customer_name' => 'A',
            'customer_email' => 'a@example.com',
            'customer_phone' => '0900000000',
            'shipping_address' => 'X',
            'payment_method' => 'cod',
            'items' => [['product_id' => $product->id, 'quantity' => 5]],
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Sản phẩm Sofa Test chỉ còn 1 trong kho. Không đủ số lượng yêu cầu (5).');
    }

    /** @test */
    public function unexpected_server_errors_hide_details_in_production()
    {
        \Illuminate\Support\Facades\Route::get('/api/__boom', fn () => throw new \RuntimeException('SQLSTATE secret detail'));

        $res = $this->getJson('/api/__boom')->assertStatus(500);

        $res->assertJson(['success' => false, 'message' => 'Hệ thống đang bận, vui lòng thử lại sau.']);
        $this->assertStringNotContainsString('secret', $res->getContent());
    }
}
