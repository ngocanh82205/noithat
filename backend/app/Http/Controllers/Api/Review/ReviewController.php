<?php

namespace App\Http\Controllers\Api\Review;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    public const REVIEW_REWARD_COINS = 50;

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

        // Public route: resolve the Sanctum token explicitly, then verify the purchase from real completed orders
        $user = auth('sanctum')->user();
        $isVerifiedPurchase = $user !== null && Order::where('user_id', $user->id)
            ->where('order_status', Order::STATUS_COMPLETED)
            ->whereHas('items', fn ($q) => $q->where('product_id', $product->id))
            ->exists();

        // Thưởng xu cho đánh giá đầu tiên của khách đã mua & nhận hàng sản phẩm này
        $coinsAwarded = 0;
        if ($isVerifiedPurchase) {
            $alreadyReviewed = Review::where('product_id', $product->id)
                ->where('user_id', $user->id)
                ->exists();
            if (!$alreadyReviewed) {
                $coinsAwarded = self::REVIEW_REWARD_COINS;
            }
        }

        $review = Review::create([
            'product_id' => $product->id,
            'user_id' => $user?->id,
            'customer_name' => $request->customer_name,
            'rating' => $request->rating,
            'title' => $request->title,
            'comment' => $request->comment,
            'is_verified_purchase' => $isVerifiedPurchase,
            'is_approved' => true,
        ]);

        // Recalculate product rating average
        $avgRating = $product->reviews()->avg('rating') ?: 5.0;
        $countReviews = $product->reviews()->count();
        $product->update([
            'rating_avg' => round($avgRating, 1),
            'rating_count' => $countReviews,
        ]);

        if ($coinsAwarded > 0) {
            User::where('id', $user->id)->increment('coins', $coinsAwarded);
        }

        return response()->json([
            'success' => true,
            'message' => $coinsAwarded > 0
                ? "Cảm ơn bạn đã đánh giá sản phẩm! Bạn nhận được {$coinsAwarded} GS Coins."
                : 'Cảm ơn bạn đã đánh giá sản phẩm!',
            'data' => $review,
            'coins_awarded' => $coinsAwarded,
        ], 201);
    }
}
