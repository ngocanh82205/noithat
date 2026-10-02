<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ProductFaq;

class AdminFaqController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductFaq::with('product')->latest();

        if ($request->get('filter') === 'unanswered') {
            $query->whereNull('answer');
        }

        $faqs = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $faqs->items(),
            'pagination' => [
                'current_page' => $faqs->currentPage(),
                'last_page' => $faqs->lastPage(),
                'total' => $faqs->total(),
            ]
        ]);
    }

    public function answer(Request $request, $id)
    {
        $faq = ProductFaq::findOrFail($id);

        $validated = $request->validate([
            'answer' => 'required|string',
            'answered_by' => 'nullable|string',
        ]);

        $faq->answer = $validated['answer'];
        $faq->answered_by = $validated['answered_by'] ?? ($request->user() ? $request->user()->name : 'Kiến trúc sư GS Luxury');
        $faq->is_approved = true;
        $faq->save();

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi câu trả lời cho khách hàng!',
            'data' => $faq->load('product'),
        ]);
    }

    public function destroy($id)
    {
        $faq = ProductFaq::findOrFail($id);
        $faq->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa câu hỏi!',
        ]);
    }
}
