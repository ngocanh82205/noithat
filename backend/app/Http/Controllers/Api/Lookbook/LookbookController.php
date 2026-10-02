<?php

namespace App\Http\Controllers\Api\Lookbook;

use App\Http\Controllers\Controller;
use App\Models\Lookbook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LookbookController extends Controller
{
    // Lấy danh sách lookbooks hoặc lookbook đang hoạt động (kèm hotspots và sản phẩm)
    public function index(Request $request): JsonResponse
    {
        $lookbooks = Lookbook::query()
            ->where('is_active', true)
            ->with([
                'items.product.images',
                'items.product.variants',
                'items.product.category',
            ])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $lookbooks,
        ]);
    }

    // Lấy chi tiết 1 lookbook theo slug
    public function show(string $slug): JsonResponse
    {
        $lookbook = Lookbook::where('slug', $slug)
            ->where('is_active', true)
            ->with([
                'items.product.images',
                'items.product.variants',
                'items.product.category',
            ])
            ->first();

        if (!$lookbook) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy phối cảnh không gian.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $lookbook,
        ]);
    }
}
