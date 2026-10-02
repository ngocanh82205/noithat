<?php

namespace App\Http\Controllers\Api\Shipping;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GhnController extends Controller
{
    protected string $token;
    protected string $shopId;
    protected string $baseUrl;
    protected int $fromDistrictId;
    protected string $fromWardCode;

    public function __construct()
    {
        $this->token = config('services.ghn.token') ?? env('GHN_TOKEN', '2fc7d720-a764-11f1-a973-aee5264794df');
        $this->shopId = (string) (config('services.ghn.shop_id') ?? env('GHN_SHOP_ID', '216518'));
        $this->baseUrl = config('services.ghn.endpoint') ?? env('GHN_ENDPOINT', 'https://dev-online-gateway.ghn.vn/shiip/public-api');
        
        // Địa chỉ kho: Ký Túc Xá Trường Đại Học Tài Nguyên Và Môi Trường Hà Nội, Phường Phú Diễn, Quận Bắc Từ Liêm, Hà Nội
        // GHN District ID cho Bắc Từ Liêm, Hà Nội = 1482, Ward Phú Diễn = 11007
        $this->fromDistrictId = (int) (config('services.ghn.from_district_id') ?? env('GHN_FROM_DISTRICT_ID', 1482));
        $this->fromWardCode = (string) (config('services.ghn.from_ward_code') ?? env('GHN_FROM_WARD_CODE', '11007'));
    }

    /**
     * Lấy danh sách tỉnh/thành phố từ GHN Master Data
     * API: GET /master-data/province
     */
    public function getProvinces(): JsonResponse
    {
        try {
            $response = Http::withHeaders([
                'Token' => $this->token,
                'Content-Type' => 'application/json',
            ])->timeout(15)
                ->get("{$this->baseUrl}/master-data/province");

            if ($response->failed()) {
                Log::error('GHN getProvinces failed', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể lấy danh sách tỉnh/thành phố từ GHN.',
                ], 502);
            }

            $data = $response->json();

            if (($data['code'] ?? 0) !== 200) {
                Log::warning('GHN getProvinces returned error code', ['response' => $data]);
                return response()->json([
                    'success' => false,
                    'message' => $data['message'] ?? 'Lỗi từ GHN API.',
                ], 502);
            }

            $provinces = collect($data['data'] ?? [])->map(function ($item) {
                return [
                    'id' => $item['ProvinceID'] ?? $item['province_id'] ?? null,
                    'name' => $item['ProvinceName'] ?? $item['name'] ?? null,
                    'code' => $item['Code'] ?? $item['code'] ?? null,
                    'name_extension' => $item['NameExtension'] ?? $item['name_extension'] ?? [],
                ];
            })->filter(fn($p) => !empty($p['id']))->values()->toArray();

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách tỉnh/thành phố thành công.',
                'data' => $provinces,
            ]);

        } catch (\Exception $e) {
            Log::error('GHN getProvinces exception', ['message' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối đến GHN API.',
            ], 500);
        }
    }

    /**
     * Lấy danh sách quận/huyện theo tỉnh/thành phố từ GHN Master Data
     * API: GET /master-data/district?province_id={id}
     */
    public function getDistricts(Request $request): JsonResponse
    {
        $request->validate([
            'province_id' => ['required', 'integer'],
        ]);

        $provinceId = $request->input('province_id');

        try {
            $response = Http::withHeaders([
                'Token' => $this->token,
                'Content-Type' => 'application/json',
            ])->timeout(15)
                ->get("{$this->baseUrl}/master-data/district", [
                    'province_id' => $provinceId,
                ]);

            if ($response->failed()) {
                Log::error('GHN getDistricts failed', [
                    'status' => $response->status(),
                    'province_id' => $provinceId,
                    'body' => $response->json(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể lấy danh sách quận/huyện từ GHN.',
                ], 502);
            }

            $data = $response->json();

            if (($data['code'] ?? 0) !== 200) {
                Log::warning('GHN getDistricts returned error code', ['response' => $data]);
                return response()->json([
                    'success' => false,
                    'message' => $data['message'] ?? 'Lỗi từ GHN API.',
                ], 502);
            }

            $districts = collect($data['data'] ?? [])->map(function ($item) {
                return [
                    'id' => $item['DistrictID'] ?? $item['district_id'] ?? null,
                    'name' => $item['DistrictName'] ?? $item['name'] ?? null,
                    'code' => $item['Code'] ?? $item['code'] ?? null,
                    'province_id' => $item['ProvinceID'] ?? $item['province_id'] ?? null,
                ];
            })->filter(fn($d) => !empty($d['id']))->values()->toArray();

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách quận/huyện thành công.',
                'data' => $districts,
            ]);

        } catch (\Exception $e) {
            Log::error('GHN getDistricts exception', [
                'province_id' => $provinceId,
                'message' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối đến GHN API.',
            ], 500);
        }
    }

    /**
     * Lấy danh sách phường/xã theo quận/huyện
     * API: GET /master-data/ward?district_id={id}
     */
    public function getWards(Request $request): JsonResponse
    {
        $request->validate([
            'district_id' => ['required', 'integer'],
        ]);

        $districtId = $request->input('district_id');

        try {
            $response = Http::withHeaders([
                'Token' => $this->token,
                'Content-Type' => 'application/json',
            ])->timeout(15)
                ->get("{$this->baseUrl}/master-data/ward", [
                    'district_id' => $districtId,
                ]);

            if ($response->failed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể lấy danh sách phường/xã từ GHN.',
                ], 502);
            }

            $data = $response->json();

            if (($data['code'] ?? 0) !== 200) {
                return response()->json([
                    'success' => false,
                    'message' => $data['message'] ?? 'Lỗi từ GHN API.',
                ], 502);
            }

            $wards = collect($data['data'] ?? [])->map(function ($item) {
                return [
                    'id' => $item['WardCode'] ?? $item['ward_code'] ?? null,
                    'name' => $item['WardName'] ?? $item['name'] ?? null,
                    'code' => $item['Code'] ?? $item['code'] ?? null,
                    'district_id' => $item['DistrictID'] ?? $item['district_id'] ?? null,
                ];
            })->filter(fn($w) => !empty($w['id']))->values()->toArray();

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách phường/xã thành công.',
                'data' => $wards,
            ]);

        } catch (\Exception $e) {
            Log::error('GHN getWards exception', [
                'district_id' => $districtId,
                'message' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối đến GHN API.',
            ], 500);
        }
    }

    /**
     * Tính phí vận chuyển thực tế từ GHN
     * API: POST /v2/shipping-order/fee
     * 
     * @param Request $request {
     *   to_district_id (int, required): District ID nhận hàng,
     *   to_ward_code (string, optional): Ward code nhận hàng,
     *   weight (int, optional): Khối lượng gram (mặc định 5000),
     *   length (int, optional): Chiều dài cm (mặc định 50),
     *   width (int, optional): Chiều rộng cm (mặc định 30),
     *   height (int, optional): Chiều cao cm (mặc định 20),
     *   insurance_value (int, optional): Giá trị bảo hiểm VND (mặc định 0),
     *   service_type_id (int, optional): 2=Standard, 5=Express (mặc định 2),
     *   cod (bool, optional): Thu hộ COD (mặc định false)
     * }
     */
    public function calculateFee(Request $request): JsonResponse
    {
        $request->validate([
            'to_district_id' => ['required', 'integer'],
            'to_ward_code' => ['nullable', 'string'],
            'weight' => ['nullable', 'integer', 'min:1'],
            'length' => ['nullable', 'integer', 'min:1'],
            'width' => ['nullable', 'integer', 'min:1'],
            'height' => ['nullable', 'integer', 'min:1'],
            'insurance_value' => ['nullable', 'integer', 'min:0'],
            'service_type_id' => ['nullable', 'integer', 'in:2,5'],
            'cod' => ['nullable', 'boolean'],
        ]);

        $payload = [
            'shop_id' => (int) $this->shopId,
            'from_district_id' => $this->fromDistrictId,
            'from_ward_code' => $this->fromWardCode,
            'to_district_id' => $request->input('to_district_id'),
            'to_ward_code' => $request->input('to_ward_code') ?? '',
            'weight' => $request->input('weight', 5000), // 5kg default
            'length' => $request->input('length', 50),
            'width' => $request->input('width', 30),
            'height' => $request->input('height', 20),
            'insurance_value' => $request->input('insurance_value', 0),
            'service_type_id' => $request->input('service_type_id', 2), // 2=Standard, 5=Express
            'cod' => $request->boolean('cod', false),
        ];

        try {
            $response = Http::withHeaders([
                'Token' => $this->token,
                'Content-Type' => 'application/json',
                'ShopId' => $this->shopId,
            ])->timeout(15)
                ->post("{$this->baseUrl}/v2/shipping-order/fee", $payload);

            if ($response->failed()) {
                Log::error('GHN calculateFee failed', [
                    'status' => $response->status(),
                    'payload' => $payload,
                    'body' => $response->json(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể tính phí vận chuyển từ GHN.',
                ], 502);
            }

            $data = $response->json();

            if (($data['code'] ?? 0) !== 200) {
                Log::warning('GHN calculateFee returned error code', ['response' => $data, 'payload' => $payload]);
                return response()->json([
                    'success' => false,
                    'message' => $data['message'] ?? 'Lỗi từ GHN API.',
                ], 502);
            }

            $feeData = $data['data'] ?? [];

            return response()->json([
                'success' => true,
                'message' => 'Tính phí vận chuyển thành công.',
                'data' => [
                    'total_fee' => $feeData['total'] ?? 0,
                    'main_fee' => $feeData['main_service'] ?? 0,
                    'insurance_fee' => $feeData['insurance'] ?? 0,
                    'cod_fee' => $feeData['cod'] ?? 0,
                    'vat' => $feeData['vat'] ?? 0,
                    'estimated_pick_time' => $feeData['estimated_pick_time'] ?? null,
                    'estimated_delivery_time' => $feeData['estimated_delivery_time'] ?? null,
                    'service_type_id' => $payload['service_type_id'],
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('GHN calculateFee exception', [
                'payload' => $payload,
                'message' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối đến GHN API.',
            ], 500);
        }
    }

    /**
     * Tính phí cho cả 2 loại dịch vụ (Standard + Express) cùng lúc
     */
    public function calculateBothServices(Request $request): JsonResponse
    {
        $request->validate([
            'to_district_id' => ['required', 'integer'],
            'to_ward_code' => ['nullable', 'string'],
            'weight' => ['nullable', 'integer', 'min:1'],
            'length' => ['nullable', 'integer', 'min:1'],
            'width' => ['nullable', 'integer', 'min:1'],
            'height' => ['nullable', 'integer', 'min:1'],
            'insurance_value' => ['nullable', 'integer', 'min:0'],
            'cod' => ['nullable', 'boolean'],
        ]);

        $toDistrictId = (int) $request->input('to_district_id');

        try {
            // Bước 1: hỏi GHN xem tuyến này thực sự hỗ trợ dịch vụ nào
            // (không phải tuyến nào cũng bật sẵn Standard/Express)
            $availableServices = $this->getAvailableServices($toDistrictId);

            if (empty($availableServices)) {
                Log::warning('GHN: khong co dich vu nao kha dung cho tuyen nay', [
                    'to_district_id' => $toDistrictId,
                    'from_district_id' => $this->fromDistrictId,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'GHN chưa hỗ trợ tính phí tự động cho khu vực này.',
                ], 502);
            }

            $standard = in_array(2, $availableServices)
                ? $this->callGhnFeeApi($request, 2)
                : ['success' => false];

            $express = in_array(5, $availableServices)
                ? $this->callGhnFeeApi($request, 5)
                : ['success' => false];

            if (!$standard['success'] && !$express['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể tính phí cho khu vực này (dịch vụ GHN khả dụng nhưng gọi phí thất bại).',
                ], 502);
            }

            return response()->json([
                'success' => true,
                'message' => 'Tính phí thành công.',
                'data' => [
                    'standard' => $standard['success'] ? $standard['data'] : null,
                    'express' => $express['success'] ? $express['data'] : null,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('GHN calculateBothServices exception', ['message' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối đến GHN API.',
            ], 500);
        }
    }

    /**
     * Kiểm tra các dịch vụ (service_type_id) mà GHN thực sự hỗ trợ
     * cho tuyến từ kho -> quận/huyện nhận hàng.
     * API: POST /v2/shipping-order/available-services
     *
     * Đây là bước BẮT BUỘC phải gọi trước khi tính phí, vì không phải
     * tuyến đường nào cũng bật sẵn service_type_id=2 (Standard) hay 5
     * (Express) - GHN chỉ cho tính phí với đúng service đã được kích
     * hoạt cho tuyến đó.
     *
     * @return int[] Danh sách service_type_id khả dụng, ví dụ [2, 5]
     */
    protected function getAvailableServices(int $toDistrictId): array
    {
        try {
            $response = Http::withHeaders([
                'Token' => $this->token,
                'Content-Type' => 'application/json',
                'ShopId' => $this->shopId,
            ])->timeout(15)
                ->post("{$this->baseUrl}/v2/shipping-order/available-services", [
                    'shop_id' => (int) $this->shopId,
                    'from_district' => $this->fromDistrictId,
                    'to_district' => $toDistrictId,
                ]);

            if ($response->failed()) {
                Log::warning('GHN getAvailableServices failed', [
                    'status' => $response->status(),
                    'to_district_id' => $toDistrictId,
                    'body' => $response->json(),
                ]);
                return [];
            }

            $data = $response->json();

            if (($data['code'] ?? 0) !== 200) {
                Log::warning('GHN getAvailableServices returned error code', [
                    'response' => $data,
                    'to_district_id' => $toDistrictId,
                ]);
                return [];
            }

            return collect($data['data'] ?? [])
                ->pluck('service_type_id')
                ->filter()
                ->map(fn($id) => (int) $id)
                ->values()
                ->toArray();

        } catch (\Exception $e) {
            Log::error('GHN getAvailableServices exception', [
                'to_district_id' => $toDistrictId,
                'message' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Tạo vận đơn GHN thật (chỉ gọi SAU KHI đơn hàng đã được xác nhận,
     * KHÔNG được gọi lúc khách mới đang xem checkout).
     * API: POST /v2/shipping-order/create
     */
    public function createShippingOrder(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => ['required', 'integer', 'exists:orders,id'],
        ]);

        $order = \App\Models\Order::with('items.product')->findOrFail($request->input('order_id'));

        if (empty($order->shipping_district_id) || empty($order->shipping_ward_code)) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng này chưa có mã Quận/Huyện, Phường/Xã (GHN) - không thể tạo vận đơn tự động. Vui lòng kiểm tra lại địa chỉ đơn hàng.',
            ], 422);
        }

        if (!empty($order->tracking_code)) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng này đã có mã vận đơn GHN rồi: ' . $order->tracking_code,
            ], 422);
        }

        $items = $order->items->map(function ($item) {
            return [
                'name' => $item->product->name ?? 'Sản phẩm',
                'quantity' => $item->quantity,
                'price' => (int) $item->price,
            ];
        })->values()->toArray();

        $availableServices = $this->getAvailableServices((int) $order->shipping_district_id);
        $serviceTypeId = in_array(2, $availableServices) ? 2 : ($availableServices[0] ?? 2);

        $payload = [
            'shop_id' => (int) $this->shopId,
            'from_district_id' => $this->fromDistrictId,
            'from_ward_code' => (string) $this->fromWardCode,
            'to_name' => $order->customer_name,
            'to_phone' => $order->customer_phone,
            'to_address' => $order->shipping_address,
            'to_ward_code' => (string) $order->shipping_ward_code,
            'to_district_id' => (int) $order->shipping_district_id,
            'weight' => 5000,
            'length' => 50,
            'width' => 30,
            'height' => 20,
            'service_type_id' => $serviceTypeId,
            'payment_type_id' => $order->payment_method === 'cod' ? 2 : 1, // 2 = người nhận trả phí ship khi COD, 1 = shop trả trước
            'cod_amount' => $order->payment_method === 'cod' ? (int) $order->total_amount : 0,
            'content' => 'Nội thất GS Luxury',
            'items' => $items,
            'note' => $order->notes ?? '',
        ];

        try {
            $response = Http::withHeaders([
                'Token' => $this->token,
                'Content-Type' => 'application/json',
                'ShopId' => $this->shopId,
            ])->timeout(20)
                ->post("{$this->baseUrl}/v2/shipping-order/create", $payload);

            $data = $response->json();

            if ($response->failed() || ($data['code'] ?? 0) !== 200) {
                Log::error('GHN createShippingOrder failed', [
                    'order_id' => $order->id,
                    'payload' => $payload,
                    'response' => $data,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => $data['message'] ?? 'GHN từ chối tạo vận đơn cho đơn hàng này.',
                ], 502);
            }

            $ghnOrderCode = $data['data']['order_code'] ?? null;

            $order->update([
                'tracking_code' => $ghnOrderCode,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Đã tạo vận đơn GHN thành công.',
                'data' => [
                    'tracking_code' => $ghnOrderCode,
                    'expected_delivery_time' => $data['data']['expected_delivery_time'] ?? null,
                    'total_fee' => $data['data']['total_fee'] ?? null,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('GHN createShippingOrder exception', [
                'order_id' => $order->id,
                'message' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối đến GHN API khi tạo vận đơn.',
            ], 500);
        }
    }

    protected function callGhnFeeApi(Request $request, int $serviceTypeId): array
    {
        $payload = [
            'shop_id' => (int) $this->shopId,
            'from_district_id' => $this->fromDistrictId,
            'from_ward_code' => $this->fromWardCode,
            'to_district_id' => $request->input('to_district_id'),
            'to_ward_code' => $request->input('to_ward_code') ?? '',
            'weight' => $request->input('weight', 5000),
            'length' => $request->input('length', 50),
            'width' => $request->input('width', 30),
            'height' => $request->input('height', 20),
            'insurance_value' => $request->input('insurance_value', 0),
            'service_type_id' => $serviceTypeId,
            'cod' => $request->boolean('cod', false),
        ];

        $response = Http::withHeaders([
            'Token' => $this->token,
            'Content-Type' => 'application/json',
            'ShopId' => $this->shopId,
        ])->timeout(15)
            ->post("{$this->baseUrl}/v2/shipping-order/fee", $payload);

        if ($response->failed() || ($response->json()['code'] ?? 0) !== 200) {
            return ['success' => false];
        }

        $feeData = $response->json()['data'] ?? [];
        return [
            'success' => true,
            'data' => [
                'total_fee' => $feeData['total'] ?? 0,
                'main_fee' => $feeData['main_service'] ?? 0,
                'insurance_fee' => $feeData['insurance'] ?? 0,
                'cod_fee' => $feeData['cod'] ?? 0,
                'vat' => $feeData['vat'] ?? 0,
                'estimated_delivery_time' => $feeData['estimated_delivery_time'] ?? null,
                'service_type_id' => $serviceTypeId,
            ],
        ];
    }

    /**
     * Internal method to calculate fee for OrderController
     * Accepts array instead of Request object
     */
    public function calculateFeeInternal(array $data): ?array
    {
        $payload = [
            'shop_id' => (int) $this->shopId,
            'from_district_id' => $this->fromDistrictId,
            'from_ward_code' => $this->fromWardCode,
            'to_district_id' => $data['to_district_id'] ?? 0,
            'to_ward_code' => $data['to_ward_code'] ?? '',
            'weight' => $data['weight'] ?? 5000,
            'length' => $data['length'] ?? 50,
            'width' => $data['width'] ?? 30,
            'height' => $data['height'] ?? 20,
            'insurance_value' => $data['insurance_value'] ?? 0,
            'service_type_id' => $data['service_type_id'] ?? 2,
            'cod' => $data['cod'] ?? false,
        ];

        $response = Http::withHeaders([
            'Token' => $this->token,
            'Content-Type' => 'application/json',
            'ShopId' => $this->shopId,
        ])->timeout(15)
            ->post("{$this->baseUrl}/v2/shipping-order/fee", $payload);

        if ($response->failed() || ($response->json()['code'] ?? 0) !== 200) {
            return null;
        }

        $feeData = $response->json()['data'] ?? [];
        return [
            'total_fee' => $feeData['total'] ?? 0,
            'main_fee' => $feeData['main_service'] ?? 0,
            'insurance_fee' => $feeData['insurance'] ?? 0,
            'cod_fee' => $feeData['cod'] ?? 0,
            'vat' => $feeData['vat'] ?? 0,
            'estimated_delivery_time' => $feeData['estimated_delivery_time'] ?? null,
            'service_type_id' => $payload['service_type_id'],
        ];
    }
}