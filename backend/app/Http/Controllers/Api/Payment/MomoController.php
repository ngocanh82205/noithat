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
     * Xử lý IPN (Instant Payment Notification) từ MoMo
     * Đây là nơi DUY NHẤT được phép cập nhật payment_status
     */
    public function handleIPN(Request $request): JsonResponse
    {
        $data = $request->all();

        Log::info('MoMo IPN received', ['data' => $data]);

        // Kiểm tra bắt buộc các trường
        $requiredFields = ['partnerCode', 'orderId', 'requestId', 'amount', 'resultCode', 'signature', 'accessKey'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                Log::warning('MoMo IPN missing field', ['field' => $field, 'data' => $data]);
                return response()->json(['resultCode' => 1, 'message' => "Missing field: {$field}"]);
            }
        }

        $secretKey = config('services.momo.secret_key') ?? env('MOMO_SECRET_KEY');

        // Tạo raw signature để verify (KHÔNG bao gồm signature field)
        $rawHash = "accessKey={$data['accessKey']}"
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

        $expectedSignature = hash_hmac('sha256', $rawHash, $secretKey);

        if ($expectedSignature !== $data['signature']) {
            Log::warning('MoMo IPN invalid signature', [
                'received' => $data['signature'],
                'expected' => $expectedSignature,
                'rawHash' => $rawHash,
            ]);
            return response()->json(['resultCode' => 1, 'message' => 'Invalid signature']);
        }

        // Tìm order bằng requestId hoặc orderId
        $order = Order::where('momo_request_id', $data['requestId'])
            ->orWhere('momo_order_id', $data['orderId'])
            ->first();

        if (!$order) {
            Log::warning('MoMo IPN order not found', [
                'requestId' => $data['requestId'],
                'orderId' => $data['orderId'],
            ]);
            return response()->json(['resultCode' => 1, 'message' => 'Order not found']);
        }

        // IPN trùng / đến trễ: đơn đã thanh toán thì không ghi đè (tránh bị chuyển thành "failed")
        if ($order->payment_status === 'paid') {
            return response()->json(['resultCode' => 0, 'message' => 'Order already paid']);
        }

        // Chỉ cập nhật khi thanh toán thành công (resultCode == 0)
        if ((int) $data['resultCode'] === 0) {
            $order->update(array_merge([
                'payment_status' => 'paid',
                'momo_trans_id' => $data['transId'] ?? null,
                'momo_response_time' => $data['responseTime'] ?? null,
                'momo_pay_type' => $data['payType'] ?? null,
            ],
                // Giống VNPAY: đơn đã thu tiền -> "đã xác nhận"; đơn đã hủy thì giữ nguyên để admin hoàn tiền
                in_array($order->order_status, [Order::STATUS_PENDING, Order::STATUS_PROCESSING], true)
                    ? ['order_status' => Order::STATUS_CONFIRMED]
                    : []
            ));

            Log::info('MoMo IPN payment success', [
                'order_id' => $order->id,
                'transId' => $data['transId'] ?? null,
            ]);
        } else {
            $order->update([
                'payment_status' => 'failed',
                'momo_result_code' => $data['resultCode'],
                'momo_message' => $data['message'] ?? null,
            ]);

            Log::info('MoMo IPN payment failed', [
                'order_id' => $order->id,
                'resultCode' => $data['resultCode'],
                'message' => $data['message'] ?? null,
            ]);
        }

        // Luôn trả về resultCode 0 để MoMo biết đã nhận IPN (tránh retry)
        return response()->json(['resultCode' => 0, 'message' => 'IPN received']);
    }

    /**
     * Xử lý Return URL (khách quay lại từ MoMo)
     * CHỈ hiển thị kết quả, KHÔNG cập nhật DB
     */
    public function handleReturn(Request $request): JsonResponse
    {
        $data = $request->all();

        $secretKey = config('services.momo.secret_key') ?? env('MOMO_SECRET_KEY');

        // Kiểm tra các trường cần thiết cho chữ ký
        $signatureFields = ['accessKey', 'amount', 'extraData', 'message', 'orderId', 'orderInfo', 'orderType', 'partnerCode', 'payType', 'requestId', 'responseTime', 'resultCode', 'transId'];
        foreach ($signatureFields as $field) {
            if (!isset($data[$field])) {
                Log::warning('MoMo Return missing field for signature', ['field' => $field, 'data' => $data]);
                return response()->json([
                    'success' => false,
                    'message' => "Thiếu trường dữ liệu: {$field}",
                    'data' => ['signature_valid' => false],
                ]);
            }
        }

        $rawHash = "accessKey={$data['accessKey']}"
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

        $expectedSignature = hash_hmac('sha256', $rawHash, $secretKey);

        $isValidSignature = ($expectedSignature === ($data['signature'] ?? ''));
        $isSuccess = ((int) ($data['resultCode'] ?? 1) === 0);

        return response()->json([
            'success' => $isValidSignature && $isSuccess,
            'message' => $isValidSignature
                ? ($isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại: ' . ($data['message'] ?? 'Unknown error'))
                : 'Chữ ký không hợp lệ - có thể URL bị giả mạo.',
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