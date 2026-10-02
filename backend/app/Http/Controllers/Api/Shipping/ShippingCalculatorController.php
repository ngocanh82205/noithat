<?php

namespace App\Http\Controllers\Api\Shipping;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShippingCalculatorController extends Controller
{
    /**
     * Calculate Shipping fees using GHN API
     * Falls back to default rates if GHN fails
     */
    public function calculate(Request $request): JsonResponse
    {
        $city = $request->input('city', 'Hà Nội');
        $district = $request->input('district', '');
        $ward = $request->input('ward', '');
        $subtotal = (float) $request->input('subtotal', 0);
        $weight = $request->input('weight', 5000); // gram
        $length = $request->input('length', 50);
        $width = $request->input('width', 30);
        $height = $request->input('height', 20);

        // Try to get district_id from city/district name (would need mapping in real app)
        // For now, use GHN API directly if district_id provided
        $toDistrictId = $request->input('to_district_id');
        $toWardCode = $request->input('to_ward_code');

        $ghnStandard = null;
        $ghnExpress = null;

        if ($toDistrictId) {
            try {
                // Call GHN API for both services
                $ghnResponse = Http::withHeaders([
                    'Token' => config('services.ghn.token') ?? env('GHN_TOKEN'),
                    'Content-Type' => 'application/json',
                    'ShopId' => config('services.ghn.shop_id') ?? env('GHN_SHOP_ID'),
                ])->timeout(10)
                    ->post(config('services.ghn.endpoint') . '/v2/shipping-order/fee', [
                        'shop_id' => config('services.ghn.shop_id'),
                        'from_district_id' => config('services.ghn.from_district_id', 1444),
                        'from_ward_code' => config('services.ghn.from_ward_code', 101001),
                        'to_district_id' => $toDistrictId,
                        'to_ward_code' => $request->input('to_ward_code', ''),
                        'weight' => $request->input('weight', 5000),
                        'length' => $request->input('length', 50),
                        'width' => $request->input('width', 30),
                        'height' => $request->input('height', 20),
                        'service_type_id' => 2, // Standard
                        'cod' => false,
                    ]);

                if (!$ghnResponse->failed() && ($ghnResponse->json()['code'] ?? 0) === 200) {
                    $ghnStandard = $ghnResponse->json()['data'] ?? null;
                }

                // Call Express
                $ghnResponseExpress = Http::withHeaders([
                    'Token' => config('services.ghn.token') ?? env('GHN_TOKEN'),
                    'Content-Type' => 'application/json',
                    'ShopId' => config('services.ghn.shop_id') ?? env('GHN_SHOP_ID'),
                ])->timeout(10)
                    ->post(config('services.ghn.endpoint') . '/v2/shipping-order/fee', [
                        'shop_id' => config('services.ghn.shop_id'),
                        'from_district_id' => config('services.ghn.from_district_id', 1444),
                        'from_ward_code' => config('services.ghn.from_ward_code', 101001),
                        'to_district_id' => $toDistrictId,
                        'to_ward_code' => $request->input('to_ward_code', ''),
                        'weight' => $request->input('weight', 5000),
                        'length' => $request->input('length', 50),
                        'width' => $request->input('width', 30),
                        'height' => $request->input('height', 20),
                        'service_type_id' => 5, // Express
                        'cod' => false,
                    ]);

                if (!$ghnResponseExpress->failed() && ($ghnResponseExpress->json()['code'] ?? 0) === 200) {
                    $ghnExpress = $ghnResponseExpress->json()['data'] ?? null;
                }
            } catch (\Exception $e) {
                Log::warning('GHN API call failed in ShippingCalculator, using fallback', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Fallback rates if GHN not available
        $isHanoi = stripos($city, 'Hà Nội') !== false;
        $isHcm = stripos($city, 'Hồ Chí Minh') !== false || stripos($city, 'TP.HCM') !== false;

        $standardFee = $ghnStandard['total'] ?? ($isHanoi || $isHcm ? 150000 : 250000);
        $expressFee = $ghnExpress['total'] ?? ($isHanoi || $isHcm ? 300000 : 500000);
        $installFee = $isHanoi || $isHcm ? 200000 : 300000;

        // Estimates
        if ($isHanoi) {
            $standardEstimate = '1 - 2 ngày (Nội thành Hà Nội)';
            $expressEstimate = 'Giao & lắp đặt trong ngày (Hỏa tốc 4h)';
            $installEstimate = 'Đội ngũ kỹ sư GS Luxury lắp đặt hoàn thiện tận phòng';
        } elseif ($isHcm) {
            $standardEstimate = '2 - 3 ngày (Chi nhánh miền Nam)';
            $expressEstimate = '24 giờ (Hỏa tốc đường bộ cao tốc)';
            $installEstimate = 'Kỹ thuật viên đối tác GS Luxury lắp đặt theo lịch hẹn';
        } else {
            $standardEstimate = '3 - 5 ngày (Vận chuyển chuyên dụng toàn quốc)';
            $expressEstimate = '2 - 3 ngày (Chuyển phát nhanh Viettel Post / GHTK)';
            $installEstimate = 'Hỗ trợ video call hướng dẫn + đội thợ địa phương';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'city' => $city,
                'district' => $district,
                'ward' => $ward,
                'is_freeship_eligible' => false,
                'source' => $toDistrictId && ($ghnStandard || $ghnExpress) ? 'ghn_api' : 'fallback',
                'methods' => [
                    [
                        'id' => 'standard',
                        'name' => 'Vận chuyển Tiêu chuẩn Đồ gỗ',
                        'description' => 'Xe thùng chuyên dụng chống va đập, bọc màng PE 4 lớp',
                        'fee' => (int) $standardFee,
                        'estimated_delivery' => $standardEstimate,
                        'badge' => null,
                        'ghn_data' => $ghnStandard ? [
                            'main_fee' => $ghnStandard['main_service'] ?? 0,
                            'insurance_fee' => $ghnStandard['insurance'] ?? 0,
                            'estimated_delivery_time' => $ghnStandard['estimated_delivery_time'] ?? null,
                        ] : null,
                    ],
                    [
                        'id' => 'express',
                        'name' => 'Giao Hàng Hỏa Tốc',
                        'description' => 'Ưu tiên xếp xe xuất kho ngay lập tức, hẹn giờ chính xác',
                        'fee' => (int) $expressFee,
                        'estimated_delivery' => $expressEstimate,
                        'ghn_data' => $ghnExpress ? [
                            'main_fee' => $ghnExpress['main_service'] ?? 0,
                            'insurance_fee' => $ghnExpress['insurance'] ?? 0,
                            'estimated_delivery_time' => $ghnExpress['estimated_delivery_time'] ?? null,
                        ] : null,
                    ],
                    [
                        'id' => 'install_pro',
                        'name' => 'Giao Hàng & Lắp Đặt Hoàn Thiện VIP',
                        'description' => 'Kỹ sư lắp đặt, căn chỉnh thăng bằng, vệ sinh phòng sạch sẽ',
                        'fee' => $installFee,
                        'estimated_delivery' => $installEstimate,
                    ],
                ],
            ],
        ]);
    }
}