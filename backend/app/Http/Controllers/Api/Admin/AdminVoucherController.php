<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Voucher;

class AdminVoucherController extends Controller
{
    public function index()
    {
        $vouchers = Voucher::latest()->get();

        return response()->json([
            'success' => true,
            'data' => $vouchers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:vouchers,code|max:50',
            'name' => 'required|string|max:255',
            'discount_type' => 'required|in:percent,fixed',
            'discount_value' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'is_active' => 'nullable|boolean',
        ]);

        $voucher = Voucher::create([
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'discount_type' => $validated['discount_type'],
            'discount_value' => $validated['discount_value'],
            'min_order_amount' => $validated['min_order_amount'] ?? 0,
            'max_discount' => $validated['max_discount'] ?? null,
            'usage_limit' => $validated['usage_limit'] ?? 100,
            'used_count' => 0,
            'start_date' => $validated['start_date'] ?? now(),
            'end_date' => $validated['end_date'] ?? now()->addMonths(3),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tạo mã giảm giá mới thành công!',
            'data' => $voucher,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $voucher = Voucher::findOrFail($id);

        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:50|unique:vouchers,code,' . $voucher->id,
            'name' => 'sometimes|required|string|max:255',
            'discount_type' => 'sometimes|required|in:percent,fixed',
            'discount_value' => 'sometimes|required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:0',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'is_active' => 'sometimes|boolean',
        ]);

        // Các cột NOT NULL: bỏ qua nếu client gửi null (giữ nguyên giá trị cũ)
        foreach (['min_order_amount', 'usage_limit', 'usage_limit_per_user'] as $key) {
            if (array_key_exists($key, $validated) && $validated[$key] === null) {
                unset($validated[$key]);
            }
        }

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper($validated['code']);
        }

        $type = $validated['discount_type'] ?? $voucher->discount_type;
        $value = (float) ($validated['discount_value'] ?? $voucher->discount_value);
        if ($type === 'percent' && $value > 100) {
            return response()->json([
                'success' => false,
                'message' => 'Giảm theo phần trăm không được vượt quá 100%.',
            ], 422);
        }

        $start = array_key_exists('start_date', $validated) ? $validated['start_date'] : $voucher->start_date;
        $end = array_key_exists('end_date', $validated) ? $validated['end_date'] : $voucher->end_date;
        if ($start && $end && strtotime((string) $end) < strtotime((string) $start)) {
            return response()->json([
                'success' => false,
                'message' => 'Ngày kết thúc phải sau ngày bắt đầu.',
            ], 422);
        }

        $voucher->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật mã giảm giá thành công!',
            'data' => $voucher->fresh(),
        ]);
    }

    public function destroy($id)
    {
        $voucher = Voucher::findOrFail($id);
        $voucher->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa mã giảm giá!',
        ]);
    }
}
