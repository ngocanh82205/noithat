<?php

namespace App\Http\Controllers\Api\Consultation;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ConsultationController extends Controller
{
    // Khách hàng gửi yêu cầu tư vấn thiết kế / may đo nội thất
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'preferred_date' => ['nullable', 'date'],
            'space_type' => ['nullable', 'string', 'max:100'],
            'budget_range' => ['nullable', 'string', 'max:100'],
            'message' => ['nullable', 'string', 'max:2000'],
        ], [
            'full_name.required' => 'Vui lòng nhập họ và tên của bạn.',
            'phone.required' => 'Vui lòng nhập số điện thoại để kiến trúc sư liên hệ.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $consultation = Consultation::create([
            'full_name' => $request->full_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'address' => $request->address,
            'preferred_date' => $request->preferred_date,
            'space_type' => $request->space_type,
            'budget_range' => $request->budget_range,
            'message' => $request->message,
            'status' => 'new',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cảm ơn quý khách đã gửi thông tin! Đội ngũ Kiến trúc sư GS Luxury sẽ liên hệ trong vòng 2 giờ.',
            'data' => $consultation,
        ], 201);
    }
}
