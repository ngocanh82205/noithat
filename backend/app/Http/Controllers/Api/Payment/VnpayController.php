<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VnpayController extends Controller
{
    /**
     * Tạo URL thanh toán VNPAY
     */
    public function createPayment(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
        ]);

        $order = Order::where('id', $request->order_id)
            ->where('payment_method', 'vnpay')
            ->where('payment_status', 'pending')
            // Không cho thanh toán đơn đã hủy (kho đã hoàn lại)
            ->whereNotIn('order_status', [Order::STATUS_CANCELLED, Order::STATUS_REFUNDED])
            ->firstOrFail();

        $vnp_TmnCode = config('services.vnpay.tmn_code') ?? env('VNPAY_TMN_CODE');
        $vnp_HashSecret = config('services.vnpay.hash_secret') ?? env('VNPAY_HASH_SECRET');
        $vnp_Url = config('services.vnpay.url') ?? env('VNPAY_URL');
        $vnp_Returnurl = config('services.vnpay.return_url') ?? env('VNPAY_RETURN_URL');

        if (!$vnp_TmnCode || !$vnp_HashSecret || !$vnp_Url) {
            return response()->json([
                'success' => false,
                'message' => 'Cấu hình VNPAY chưa đầy đủ trên hệ thống.',
            ], 500);
        }

        $vnp_TxnRef = $order->order_number . '_' . time();
        $vnp_OrderInfo = "Thanh toan don hang {$order->order_number}";
        $vnp_OrderType = 'other';
        $vnp_Amount = (int) round($order->total_amount) * 100; // VNPAY tính theo đơn vị VND x 100
        $vnp_Locale = 'vn';
        $vnp_IpAddr = $request->ip() ?: '127.0.0.1';

        $tz = new \DateTimeZone('Asia/Ho_Chi_Minh');
        $now = new \DateTime('now', $tz);
        $vnp_CreateDate = $now->format('YmdHis');
        $vnp_ExpireDate = (clone $now)->modify('+15 minutes')->format('YmdHis');

        $inputData = [
            'vnp_Version' => '2.1.0',
            'vnp_TmnCode' => $vnp_TmnCode,
            'vnp_Amount' => $vnp_Amount,
            'vnp_Command' => 'pay',
            'vnp_CreateDate' => $vnp_CreateDate,
            'vnp_CurrCode' => 'VND',
            'vnp_IpAddr' => $vnp_IpAddr,
            'vnp_Locale' => $vnp_Locale,
            'vnp_OrderInfo' => $vnp_OrderInfo,
            'vnp_OrderType' => $vnp_OrderType,
            'vnp_ReturnUrl' => $vnp_Returnurl,
            'vnp_TxnRef' => $vnp_TxnRef,
            'vnp_ExpireDate' => $vnp_ExpireDate,
        ];

        if (!empty($request->bank_code)) {
            $inputData['vnp_BankCode'] = $request->bank_code;
        }

        ksort($inputData);
        $query = '';
        $i = 0;
        $hashdata = '';

        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashdata .= '&' . urlencode($key) . '=' . urlencode($value);
            } else {
                $hashdata .= urlencode($key) . '=' . urlencode($value);
                $i = 1;
            }
            $query .= urlencode($key) . '=' . urlencode($value) . '&';
        }

        $vnp_PaymentUrl = $vnp_Url . '?' . $query;
        if (isset($vnp_HashSecret)) {
            $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
            $vnp_PaymentUrl .= 'vnp_SecureHash=' . $vnpSecureHash;
        }

        // Lưu thông tin vnp_txn_ref vào đơn hàng
        $order->update([
            'vnp_txn_ref' => $vnp_TxnRef,
        ]);

        Log::info('VNPAY payment url created', [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'vnp_TxnRef' => $vnp_TxnRef,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tạo link thanh toán VNPAY thành công.',
            'data' => [
                'payment_url' => $vnp_PaymentUrl,
                'vnp_TxnRef' => $vnp_TxnRef,
            ],
        ]);
    }

    /**
     * Xử lý callback khi người dùng được chuyển hướng về từ VNPAY
     */
    public function handleReturn(Request $request): JsonResponse
    {
        $vnp_HashSecret = config('services.vnpay.hash_secret') ?? env('VNPAY_HASH_SECRET');
        $inputData = [];

        foreach ($request->all() as $key => $value) {
            if (substr($key, 0, 4) == 'vnp_') {
                $inputData[$key] = $value;
            }
        }

        $vnp_SecureHash = $inputData['vnp_SecureHash'] ?? '';
        unset($inputData['vnp_SecureHash']);
        unset($inputData['vnp_SecureHashType']);

        ksort($inputData);
        $i = 0;
        $hashData = '';
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashData .= '&' . urlencode($key) . '=' . urlencode($value);
            } else {
                $hashData .= urlencode($key) . '=' . urlencode($value);
                $i = 1;
            }
        }

        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        if ($secureHash !== $vnp_SecureHash) {
            Log::warning('VNPAY Return: Invalid signature', ['input' => $request->all()]);
            return response()->json([
                'success' => false,
                'message' => 'Chữ ký không hợp lệ.',
            ], 400);
        }

        $vnp_TxnRef = $request->get('vnp_TxnRef');
        $vnp_ResponseCode = $request->get('vnp_ResponseCode');
        $vnp_TransactionNo = $request->get('vnp_TransactionNo');
        $vnp_BankCode = $request->get('vnp_BankCode');
        $vnp_PayDate = $request->get('vnp_PayDate');
        $vnp_CardType = $request->get('vnp_CardType');

        $order = Order::where('vnp_txn_ref', $vnp_TxnRef)->first();
        if (!$order) {
            // Thử tìm theo prefix mã đơn hàng
            $parts = explode('_', $vnp_TxnRef);
            $orderNumber = $parts[0] ?? null;
            $order = $orderNumber ? Order::where('order_number', $orderNumber)->first() : null;
        }

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đơn hàng tương ứng.',
            ], 404);
        }

        $order->update([
            'vnp_response_code' => $vnp_ResponseCode,
            'vnp_transaction_no' => $vnp_TransactionNo,
            'vnp_bank_code' => $vnp_BankCode,
            'vnp_pay_date' => $vnp_PayDate,
            'vnp_card_type' => $vnp_CardType,
        ]);

        if ($vnp_ResponseCode == '00') {
            // Đơn đã hủy trước khi tiền về: chỉ ghi nhận đã thu tiền để admin hoàn tiền, không mở lại đơn
            $order->update(array_merge(
                ['payment_status' => 'paid'],
                $order->order_status === Order::STATUS_CANCELLED ? [] : ['order_status' => Order::STATUS_CONFIRMED]
            ));

            return response()->json([
                'success' => true,
                'message' => 'Thanh toán đơn hàng thành công.',
                'data' => [
                    'order_number' => $order->order_number,
                    'status' => 'paid',
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Giao dịch VNPAY không thành công hoặc đã bị hủy (Mã lỗi: ' . $vnp_ResponseCode . ').',
            'data' => [
                'order_number' => $order->order_number,
                'response_code' => $vnp_ResponseCode,
            ],
        ], 400);
    }

    /**
     * IPN Server-to-Server từ VNPAY
     */
    public function handleIPN(Request $request): JsonResponse
    {
        $vnp_HashSecret = config('services.vnpay.hash_secret') ?? env('VNPAY_HASH_SECRET');
        $inputData = [];

        foreach ($request->all() as $key => $value) {
            if (substr($key, 0, 4) == 'vnp_') {
                $inputData[$key] = $value;
            }
        }

        $vnp_SecureHash = $inputData['vnp_SecureHash'] ?? '';
        unset($inputData['vnp_SecureHash']);
        unset($inputData['vnp_SecureHashType']);

        ksort($inputData);
        $i = 0;
        $hashData = '';
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashData .= '&' . urlencode($key) . '=' . urlencode($value);
            } else {
                $hashData .= urlencode($key) . '=' . urlencode($value);
                $i = 1;
            }
        }

        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        if ($secureHash !== $vnp_SecureHash) {
            return response()->json([
                'RspCode' => '97',
                'Message' => 'Invalid signature',
            ]);
        }

        $vnp_TxnRef = $request->get('vnp_TxnRef');
        $vnp_ResponseCode = $request->get('vnp_ResponseCode');
        $vnp_TransactionNo = $request->get('vnp_TransactionNo');
        $vnp_Amount = $request->get('vnp_Amount');

        $order = Order::where('vnp_txn_ref', $vnp_TxnRef)->first();
        if (!$order) {
            $parts = explode('_', $vnp_TxnRef);
            $orderNumber = $parts[0] ?? null;
            $order = $orderNumber ? Order::where('order_number', $orderNumber)->first() : null;
        }

        if (!$order) {
            return response()->json([
                'RspCode' => '01',
                'Message' => 'Order not found',
            ]);
        }

        $expectedAmount = (int) round($order->total_amount) * 100;
        if ($expectedAmount != (int)$vnp_Amount) {
            return response()->json([
                'RspCode' => '04',
                'Message' => 'Invalid amount',
            ]);
        }

        if ($order->payment_status === 'paid') {
            return response()->json([
                'RspCode' => '02',
                'Message' => 'Order already confirmed',
            ]);
        }

        $order->update([
            'vnp_response_code' => $vnp_ResponseCode,
            'vnp_transaction_no' => $vnp_TransactionNo,
            'vnp_bank_code' => $request->get('vnp_BankCode'),
            'vnp_pay_date' => $request->get('vnp_PayDate'),
            'vnp_card_type' => $request->get('vnp_CardType'),
        ]);

        if ($vnp_ResponseCode == '00') {
            // Đơn đã hủy trước khi tiền về: chỉ ghi nhận đã thu tiền để admin hoàn tiền, không mở lại đơn
            $order->update(array_merge(
                ['payment_status' => 'paid'],
                $order->order_status === Order::STATUS_CANCELLED ? [] : ['order_status' => Order::STATUS_CONFIRMED]
            ));
        }

        return response()->json([
            'RspCode' => '00',
            'Message' => 'Confirm Success',
        ]);
    }
}
