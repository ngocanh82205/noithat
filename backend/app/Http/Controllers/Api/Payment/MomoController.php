<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MomoController extends Controller
{
    /**
     * Tạo thanh toán MoMo, trả về payUrl để frontend redirect
     */
    public function createPayment(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
        ]);

        $order = Order::where('id', $request->order_id)
            ->where('payment_method', 'momo')
            ->where('payment_status', 'pending')
            // Không cho thanh toán đơn đã hủy (kho đã hoàn lại)
            ->whereNotIn('order_status', [Order::STATUS_CANCELLED, Order::STATUS_REFUNDED])
            ->firstOrFail();

        $partnerCode = config('services.momo.partner_code') ?? env('MOMO_PARTNER_CODE');
        $accessKey = config('services.momo.access_key') ?? env('MOMO_ACCESS_KEY');
        $secretKey = config('services.momo.secret_key') ?? env('MOMO_SECRET_KEY');
        $endpoint = config('services.momo.endpoint') ?? env('MOMO_ENDPOINT');
        $redirectUrl = config('services.momo.redirect_url') ?? env('MOMO_REDIRECT_URL');
        $ipnUrl = config('services.momo.ipn_url') ?? env('MOMO_IPN_URL');

        if (!$partnerCode || !$accessKey || !$secretKey || !$endpoint) {
            return response()->json([
                'success' => false,
                'message' => 'Cấu hình MoMo chưa đầy đủ.',
            ], 500);
        }

        $amount = (int) round($order->total_amount); // MoMo nhận VND nguyên (không dấu phẩy)
        
        // MoMo Sandbox giới hạn tối đa 50.000.000đ/giao dịch
        $isTestMode = str_contains($endpoint, 'test-payment.momo.vn');
        if ($isTestMode && $amount > 50000000) {
            $amount = 50000; // Dùng 50.000đ cho giao dịch test sandbox để không bị lỗi hạn mức MoMo
            Log::info("MoMo Sandbox: Tự động điều chỉnh số tiền test từ {$order->total_amount}đ thành 50.000đ để tương thích môi trường sandbox.");
        }

        $orderId = $order->order_number . '_' . time(); // requestId duy nhất
        $requestId = $order->order_number . '_' . time();
        $orderInfo = "Thanh toan don hang {$order->order_number}";
        $requestType = 'payWithMethod'; // MoMo wallet + ATM + QR
        $extraData = base64_encode(json_encode([
            'order_id' => $order->id,
            'order_number' => $order->order_number,
        ]));

        // Tạo raw signature theo đúng thứ tự tài liệu MoMo
        $rawHash = "accessKey={$accessKey}"
            . "&amount={$amount}"
            . "&extraData={$extraData}"
            . "&ipnUrl={$ipnUrl}"
            . "&orderId={$orderId}"
            . "&orderInfo={$orderInfo}"
            . "&partnerCode={$partnerCode}"
            . "&redirectUrl={$redirectUrl}"
            . "&requestId={$requestId}"
            . "&requestType={$requestType}";

        $signature = hash_hmac('sha256', $rawHash, $secretKey);

        $payload = [
            'partnerCode' => $partnerCode,
            'accessKey' => $accessKey,
            'requestId' => $requestId,
            'amount' => $amount,
            'orderId' => $orderId,
            'orderInfo' => $orderInfo,
            'redirectUrl' => $redirectUrl,
            'ipnUrl' => $ipnUrl,
            'extraData' => $extraData,
            'requestType' => $requestType,
            'signature' => $signature,
            'lang' => 'vi',
        ];

        try {
            $response = Http::timeout(30)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($endpoint, $payload);

            $data = $response->json();

            Log::info('MoMo createPayment request', [
                'order_id' => $order->id,
                'payload' => $payload,
                'response' => $data,
            ]);

            if ($response->failed() || ($data['resultCode'] ?? 1) !== 0) {
                return response()->json([
                    'success' => false,
                    'message' => $data['message'] ?? 'Tạo thanh toán MoMo thất bại.',
                    'momo_response' => $data,
                ], 400);
            }

            // Cập nhật order với requestId để đối chiếu sau
            $order->update([
                'momo_request_id' => $requestId,
                'momo_order_id' => $orderId,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tạo thanh toán MoMo thành công.',
                'data' => [
                    'payUrl' => $data['payUrl'],
                    'deeplink' => $data['deeplink'] ?? null,
                    'orderId' => $orderId,
                    'requestId' => $requestId,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('MoMo createPayment exception', [
                'order_id' => $order->id,
                'message' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Không thể kết nối cổng thanh toán MoMo lúc này. Vui lòng thử lại sau hoặc chọn phương thức khác.',
            ], 500);
        }
    }

    /**
     * Các trường MoMo ký trong chữ ký trả về (redirect & IPN), theo thứ tự a-z.
     * LƯU Ý: MoMo KHÔNG gửi accessKey trong redirect/IPN — accessKey lấy từ cấu hình cửa hàng.
     * (Trước đây code bắt buộc request có accessKey nên mọi giao dịch đều bị coi là lỗi
     *  và đơn không bao giờ được chuyển sang "đã thanh toán".)
     */
    private const SIGNED_FIELDS = [
        'amount', 'extraData', 'message', 'orderId', 'orderInfo', 'orderType',
        'partnerCode', 'payType', 'requestId', 'responseTime', 'resultCode', 'transId',
    ];

    private function verifySignature(array $data): bool
    {
        $accessKey = (string) config('services.momo.access_key');
        $secretKey = (string) config('services.momo.secret_key');
        if ($accessKey === '' || $secretKey === '' || empty($data['signature'])) {
            return false;
        }
        // Chỉ chấp nhận giao dịch của chính cửa hàng mình
        if (($data['partnerCode'] ?? null) !== config('services.momo.partner_code')) {
            return false;
        }

        $rawHash = 'accessKey=' . $accessKey;
        foreach (self::SIGNED_FIELDS as $field) {
            $rawHash .= '&' . $field . '=' . ($data[$field] ?? '');
        }

        return hash_equals(hash_hmac('sha256', $rawHash, $secretKey), (string) $data['signature']);
    }

    private function findOrder(array $data): ?Order
    {
        if (empty($data['orderId']) && empty($data['requestId'])) {
            return null;
        }

        return Order::where('momo_order_id', $data['orderId'] ?? '')
            ->orWhere('momo_request_id', $data['requestId'] ?? '')
            ->first();
    }

    /**
     * Ghi nhận kết quả thanh toán đã được xác thực chữ ký. Dùng chung cho IPN và trang trả về,
     * idempotent: đơn đã "paid" thì không bị ghi đè (IPN trùng / đến trễ).
     */
    private function applyResult(Order $order, array $data): void
    {
        if ($order->payment_status === 'paid') {
            return;
        }

        if ((int) $data['resultCode'] === 0) {
            $order->update(array_merge([
                'payment_status' => 'paid',
                'momo_trans_id' => $data['transId'] ?? null,
                'momo_response_time' => $data['responseTime'] ?? null,
                'momo_pay_type' => $data['payType'] ?? null,
                'momo_result_code' => $data['resultCode'],
                'momo_message' => $data['message'] ?? null,
            ],
                // Giống VNPAY: đơn đã thu tiền -> "đã xác nhận"; đơn đã hủy thì giữ nguyên để admin hoàn tiền
                in_array($order->order_status, [Order::STATUS_PENDING, Order::STATUS_PROCESSING], true)
                    ? ['order_status' => Order::STATUS_CONFIRMED]
                    : []
            ));
            Log::info('MoMo payment success', ['order_id' => $order->id, 'transId' => $data['transId'] ?? null]);
        } else {
            $order->update([
                'payment_status' => 'failed',
                'momo_result_code' => $data['resultCode'],
                'momo_message' => $data['message'] ?? null,
            ]);
            Log::info('MoMo payment failed', ['order_id' => $order->id, 'resultCode' => $data['resultCode']]);
        }
    }

    /**
     * IPN: MoMo gọi server-to-server sau khi khách thanh toán.
     */
    public function handleIPN(Request $request): JsonResponse
    {
        $data = $request->all();
        Log::info('MoMo IPN received', ['orderId' => $data['orderId'] ?? null, 'resultCode' => $data['resultCode'] ?? null]);

        foreach (['partnerCode', 'orderId', 'requestId', 'amount', 'resultCode', 'signature'] as $field) {
            if (!isset($data[$field])) {
                Log::warning('MoMo IPN missing field', ['field' => $field]);
                return response()->json(['resultCode' => 1, 'message' => "Missing field: {$field}"]);
            }
        }

        if (!$this->verifySignature($data)) {
            Log::warning('MoMo IPN invalid signature', ['orderId' => $data['orderId']]);
            return response()->json(['resultCode' => 1, 'message' => 'Invalid signature']);
        }

        $order = $this->findOrder($data);
        if (!$order) {
            Log::warning('MoMo IPN order not found', ['orderId' => $data['orderId'], 'requestId' => $data['requestId']]);
            return response()->json(['resultCode' => 1, 'message' => 'Order not found']);
        }

        if ($order->payment_status === 'paid') {
            return response()->json(['resultCode' => 0, 'message' => 'Order already paid']);
        }

        $this->applyResult($order, $data);

        // Luôn trả về resultCode 0 để MoMo biết đã nhận IPN (tránh retry)
        return response()->json(['resultCode' => 0, 'message' => 'IPN received']);
    }

    /**
     * Trang trả về: khách được MoMo chuyển về website kèm kết quả đã ký.
     * Sau khi xác thực chữ ký cũng ghi nhận kết quả (như VNPAY) để khách thấy ngay trạng thái đúng
     * kể cả khi IPN đến chậm hoặc không tới được (chạy local).
     */
    public function handleReturn(Request $request): JsonResponse
    {
        $data = $request->all();

        if (!isset($data['orderId'], $data['resultCode'], $data['signature'])) {
            return response()->json([
                'success' => false,
                'message' => 'Thiếu thông tin kết quả thanh toán từ MoMo.',
                'data' => ['signature_valid' => false],
            ]);
        }

        $isValidSignature = $this->verifySignature($data);
        $isSuccess = (int) $data['resultCode'] === 0;

        if ($isValidSignature && ($order = $this->findOrder($data))) {
            $this->applyResult($order, $data);
        }

        return response()->json([
            'success' => $isValidSignature && $isSuccess,
            'message' => !$isValidSignature
                ? 'Không xác thực được kết quả thanh toán (chữ ký không hợp lệ).'
                : ($isSuccess
                    ? 'Thanh toán MoMo thành công!'
                    : 'Thanh toán MoMo chưa thành công: ' . ($data['message'] ?? 'giao dịch bị hủy')),
            'data' => [
                'orderId' => $data['orderId'] ?? null,
                'requestId' => $data['requestId'] ?? null,
                'amount' => $data['amount'] ?? null,
                'resultCode' => $data['resultCode'] ?? null,
                'message' => $data['message'] ?? null,
                'transId' => $data['transId'] ?? null,
                'signature_valid' => $isValidSignature,
            ],
        ]);
    }
}