<?php

namespace App\Http\Controllers\Api\FlashSale;

use App\Http\Controllers\Controller;
use App\Models\FlashSale;
use Illuminate\Http\JsonResponse;

class FlashSaleController extends Controller
{
    // Lấy sự kiện Flash Sale đang hoạt động
    public function active(): JsonResponse
    {
        $flashSale = FlashSale::where('is_active', true)
            ->where('start_time', '<=', now())
            ->where('end_time', '>=', now())
            ->with(['items.product.images', 'items.product.category'])
            ->first();

        // Fallback to next upcoming or latest if none active
        if (!$flashSale) {
            $flashSale = FlashSale::where('is_active', true)
                ->with(['items.product.images', 'items.product.category'])
                ->latest()
                ->first();
        }

        return response()->json([
            'success' => true,
            'data' => $flashSale,
        ]);
    }
}
