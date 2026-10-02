<?php

namespace App\Http\Controllers\Api\Review;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    // Gửi đánh giá cho sản phẩm
    public function store(Request $request, int $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);

        $validator = Validator::make($request->all(), [
            'customer_name' => ['required', 'string', 'max:255'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:255'],
            'comment' => ['required', 'string', 'max:2000'],
        ], [
            'customer_name.required' => 'Vui lòng nhập tên của bạn.',
            'rating.required' => 'Vui lòng chọn số sao đánh giá.',
            'comment.required' => 'Vui lòng chia sẻ cảm nhận về sản phẩm.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đánh giá không hợp lệ.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $review = Review::create([
            'product_id' => $product->id,
            'user_id' => $request->user()?->id,
            'customer_name' => $request->customer_name,
            'rating' => $request->rating,
            'title' => $request->title,
            'comment' => $request->comment,
            'is_verified_purchase' => true,
            'is_approved' => true,
        ]);

        // Recalculate product rating average
        $avgRating = $product->reviews()->avg('rating') ?: 5.0;
        $countReviews = $product->reviews()->count();
        $product->update([
            'rating_avg' => round($avgRating, 1),
            'rating_count' => $countReviews,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cảm ơn bạn đã đánh giá sản phẩm!',
            'data' => $review,
        ], 201);
    }
}
