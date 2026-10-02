<?php

namespace App\Http\Controllers\Api\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CollectionController extends Controller
{
    // Danh sách bộ sưu tập
    public function index(Request $request): JsonResponse
    {
        $collections = Collection::query()
            ->withCount(['products' => function ($q) {
                $q->where('status', 'active');
            }])
            ->orderBy('is_featured', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $collections,
        ]);
    }

    // Chi tiết bộ sưu tập theo slug
    public function show(string $slug): JsonResponse
    {
        $collection = Collection::where('slug', $slug)
            ->with(['products' => function ($q) {
                $q->where('status', 'active')
                  ->with(['images', 'variants'])
                  ->orderBy('created_at', 'desc');
            }])
            ->first();

        if (!$collection) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy bộ sưu tập.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $collection,
        ]);
    }
}
