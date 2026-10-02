<?php

namespace App\Http\Controllers\Api\Faq;

use App\Http\Controllers\Controller;
use App\Models\ProductFaq;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductFaqController extends Controller
{
    // Lấy danh sách hỏi đáp của sản phẩm
    public function index(int $productId): JsonResponse
    {
        $faqs = ProductFaq::where('product_id', $productId)
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $faqs,
        ]);
    }

    // Khách hàng đặt câu hỏi mới
    public function store(Request $request, int $productId): JsonResponse
    {
        $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'question' => ['required', 'string', 'max:1000'],
        ]);

        $faq = ProductFaq::create([
            'product_id' => $productId,
            'user_id' => $request->user()?->id,
            'customer_name' => $request->customer_name,
            'question' => $request->question,
            'answer' => null,
            'is_approved' => true, // Tự động duyệt hoặc chờ kiểm duyệt
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Câu hỏi của bạn đã được gửi thành công. Kiến trúc sư GS Luxury sẽ phản hồi trong thời gian sớm nhất.',
            'data' => $faq,
        ], 201);
    }
}
