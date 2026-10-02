<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MomoPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Order $order;
    protected string $secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    protected string $accessKey = 'F8BBA842ECF85';
    protected string $partnerCode = 'MOMO';

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure MoMo config is loaded for tests
        config([
            'services.momo.partner_code' => 'MOMO',
            'services.momo.access_key' => 'F8BBA842ECF85',
            'services.momo.secret_key' => 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
            'services.momo.endpoint' => 'https://test-payment.momo.vn/v2/gateway/api/create',
            'services.momo.redirect_url' => 'http://localhost:3000/order-success',
            'services.momo.ipn_url' => 'https://tressy-stephany-quartered.ngrok-free.dev/api/momo/ipn',
        ]);

        $this->user = User::factory()->create();

        $this->order = Order::factory()->create([
            'user_id' => $this->user->id,
            'payment_method' => 'momo',
            'payment_status' => 'pending',
            'total_amount' => 10000000,
            'momo_request_id' => 'GSL-20260909-ABC123_1725840000',
            'momo_order_id' => 'GSL-20260909-ABC123_1725840000',
        ]);
    }

    protected function getBaseIpnData(array $overrides = []): array
    {
        // Use simple extraData without special characters
        $extraData = base64_encode(json_encode([
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
        ]));

        return array_merge([
            // Đúng như dữ liệu thật MoMo gửi về: KHÔNG có accessKey
            'partnerCode' => $this->partnerCode,
            'requestId' => $this->order->momo_request_id,
            'orderId' => $this->order->momo_order_id,
            'amount' => '10000000',
            'orderInfo' => 'Thanh toan don hang ' . $this->order->order_number,
            'orderType' => 'momo_wallet',
            'transId' => '1234567890',
            'resultCode' => '0',
            'message' => 'Success',
            'payType' => 'qr',
            'responseTime' => '1725840000000',
            'extraData' => $extraData,
        ], $overrides);
    }

    protected function generateSignature(array $data): string
    {
        $rawHash = "accessKey={$this->accessKey}"
            . "&amount={$data['amount']}"
            . "&extraData={$data['extraData']}"
            . "&message={$data['message']}"
            . "&orderId={$data['orderId']}"
            . "&orderInfo={$data['orderInfo']}"
            . "&orderType={$data['orderType']}"
            . "&partnerCode={$data['partnerCode']}"
            . "&payType={$data['payType']}"
            . "&requestId={$data['requestId']}"
            . "&responseTime={$data['responseTime']}"
            . "&resultCode={$data['resultCode']}"
            . "&transId={$data['transId']}";

        // Use the same secret key resolution as the controller
        $secretKey = config('services.momo.secret_key') ?? env('MOMO_SECRET_KEY') ?? 'K951B6PE1waDMi640xX08PD3vg6EkVlz';

        return hash_hmac('sha256', $rawHash, $secretKey);
    }

    /** @test */
    public function ipn_with_invalid_signature_should_be_rejected_and_not_update_payment_status()
    {
        $data = $this->getBaseIpnData([
            'signature' => 'invalid_signature_that_does_not_match',
        ]);

        $response = $this->postJson('/api/momo/ipn', $data);

        $response->assertStatus(200)
            ->assertJson(['resultCode' => 1, 'message' => 'Invalid signature']);

        // KIỂM TRA QUAN TRỌNG: payment_status KHÔNG được cập nhật thành 'paid'
        $this->assertEquals('pending', $this->order->fresh()->payment_status);
    }

    /** @test */
    public function ipn_with_valid_signature_and_result_code_0_should_update_payment_status_to_paid()
    {
        $data = $this->getBaseIpnData();
        $data['signature'] = $this->generateSignature($data);

        $response = $this->postJson('/api/momo/ipn', $data);

        $response->assertStatus(200)
            ->assertJson(['resultCode' => 0, 'message' => 'IPN received']);

        // payment_status ĐƯỢC cập nhật thành 'paid'
        $this->assertEquals('paid', $this->order->fresh()->payment_status);
        $this->assertEquals('1234567890', $this->order->fresh()->momo_trans_id);
    }

    /** @test */
    public function ipn_with_valid_signature_but_failed_result_code_should_update_payment_status_to_failed()
    {
        $data = $this->getBaseIpnData([
            'resultCode' => '9000',
            'message' => 'Insufficient funds',
        ]);
        $data['signature'] = $this->generateSignature($data);

        $response = $this->postJson('/api/momo/ipn', $data);

        $response->assertStatus(200)
            ->assertJson(['resultCode' => 0, 'message' => 'IPN received']);

        // payment_status ĐƯỢC cập nhật thành 'failed'
        $this->assertEquals('failed', $this->order->fresh()->payment_status);
        $this->assertEquals('9000', $this->order->fresh()->momo_result_code);
    }

    /** @test */
    public function ipn_for_non_existent_order_should_return_order_not_found()
    {
        $data = $this->getBaseIpnData([
            'requestId' => 'GSL-FAKE',
            'orderId' => 'GSL-FAKE',
            'orderInfo' => 'Thanh toan don hang GSL-FAKE',
            'extraData' => base64_encode(json_encode([
                'order_id' => 999999,
                'order_number' => 'GSL-FAKE',
            ])),
        ]);
        $data['signature'] = $this->generateSignature($data);

        $response = $this->postJson('/api/momo/ipn', $data);

        $response->assertStatus(200)
            ->assertJson(['resultCode' => 1, 'message' => 'Order not found']);
    }

    /** @test */
    public function return_url_with_invalid_signature_should_show_warning()
    {
        $data = $this->getBaseIpnData();
        $data['signature'] = 'invalid_signature_for_return_url';

        // Use POST to avoid URL encoding issues with base64 extraData
        $response = $this->postJson('/api/momo/return', $data);

        $response->assertStatus(200)
            ->assertJson([
                'success' => false,
                'message' => 'Không xác thực được kết quả thanh toán (chữ ký không hợp lệ).',
            ]);
    }

    /** @test */
    public function return_url_with_valid_signature_should_show_success()
    {
        $data = $this->getBaseIpnData();
        $data['signature'] = $this->generateSignature($data);

        // Use POST to avoid URL encoding issues with base64 extraData
        $response = $this->postJson('/api/momo/return', $data);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Thanh toán MoMo thành công!',
                'data' => [
                    'signature_valid' => true,
                ],
            ]);
    }
    /** @test */
    public function successful_ipn_confirms_processing_order()
    {
        $this->order->update(['order_status' => Order::STATUS_PROCESSING]);
        $data = $this->getBaseIpnData();
        $data['signature'] = $this->generateSignature($data);

        $this->postJson('/api/momo/ipn', $data)->assertJson(['resultCode' => 0]);

        $this->assertEquals(Order::STATUS_CONFIRMED, $this->order->fresh()->order_status);
    }

    /** @test */
    public function successful_ipn_does_not_reopen_cancelled_order()
    {
        $this->order->update(['order_status' => Order::STATUS_CANCELLED]);
        $data = $this->getBaseIpnData();
        $data['signature'] = $this->generateSignature($data);

        $this->postJson('/api/momo/ipn', $data)->assertJson(['resultCode' => 0]);

        $order = $this->order->fresh();
        $this->assertEquals('paid', $order->payment_status);
        $this->assertEquals(Order::STATUS_CANCELLED, $order->order_status);
    }

    /** @test */
    public function late_failed_ipn_does_not_overwrite_paid_order()
    {
        $this->order->update(['payment_status' => 'paid']);
        $data = $this->getBaseIpnData(['resultCode' => '9000', 'message' => 'Failed']);
        $data['signature'] = $this->generateSignature($data);

        $this->postJson('/api/momo/ipn', $data)->assertJson(['resultCode' => 0]);

        $this->assertEquals('paid', $this->order->fresh()->payment_status);
    }
    /** @test */
    public function return_url_without_access_key_like_real_momo_marks_order_paid()
    {
        $this->order->update(['order_status' => Order::STATUS_PROCESSING]);
        $data = $this->getBaseIpnData();
        $this->assertArrayNotHasKey('accessKey', $data);
        $data['signature'] = $this->generateSignature($data);

        $this->getJson('/api/momo/return?' . http_build_query($data))
            ->assertOk()
            ->assertJson(['success' => true, 'data' => ['signature_valid' => true]]);

        $order = $this->order->fresh();
        $this->assertEquals('paid', $order->payment_status);
        $this->assertEquals(Order::STATUS_CONFIRMED, $order->order_status);
    }

    /** @test */
    public function return_url_with_cancelled_payment_reports_failure_and_marks_failed()
    {
        $data = $this->getBaseIpnData(['resultCode' => '1006', 'message' => 'Giao dịch bị từ chối bởi người dùng.']);
        $data['signature'] = $this->generateSignature($data);

        $this->getJson('/api/momo/return?' . http_build_query($data))
            ->assertOk()
            ->assertJson(['success' => false, 'data' => ['signature_valid' => true]])
            ->assertJsonPath('message', 'Thanh toán MoMo chưa thành công: Giao dịch bị từ chối bởi người dùng.');

        $this->assertEquals('failed', $this->order->fresh()->payment_status);
    }

    /** @test */
    public function ipn_from_another_partner_code_is_rejected()
    {
        $data = $this->getBaseIpnData(['partnerCode' => 'OTHERSHOP']);
        $data['signature'] = $this->generateSignature($data);

        $this->postJson('/api/momo/ipn', $data)->assertJson(['resultCode' => 1, 'message' => 'Invalid signature']);
        $this->assertEquals('pending', $this->order->fresh()->payment_status);
    }
}
