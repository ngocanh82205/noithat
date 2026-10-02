<?php

namespace App\Http\Controllers\Api\Voucher;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VoucherController extends Controller
{
    // Lấy danh sách Voucher đang áp dụng
    public function index(): JsonResponse
    {
        $vouchers = Voucher::where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now());
            })
            ->orderBy('discount_value', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $vouchers,
        ]);
    }

    // Áp dụng mã Voucher cho giá trị đơn hàng
    public function apply(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
            'subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        $code = strtoupper(trim($request->code));
        $subtotal = (float) $request->subtotal;

        $voucher = Voucher::where('code', $code)
            ->where('is_active', true)
            ->first();

        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Mã giảm giá không tồn tại hoặc đã hết hạn sử dụng.',
            ], 404);
        }

        if ($voucher->usage_limit > 0 && $voucher->used_count >= $voucher->usage_limit) {
            return response()->json([
                'success' => false,
                'message' => 'Mã giảm giá đã hết lượt sử dụng.',
            ], 400);
        }

        // Check per-user/session usage limit
        $user = Auth::user();
        $sessionId = $request->header('X-Session-ID');

        if ($user) {
            $userUsageCount = VoucherUsage::where('voucher_id', $voucher->id)
                ->where('user_id', $user->id)
                ->count();
            if ($userUsageCount >= $voucher->usage_limit_per_user) {
                return response()->json([
                    'success' => false,
                    'message' => "Bạn đã sử dụng mã này {$voucher->usage_limit_per_user} lần. Không thể áp dụng thêm.",
                ], 400);
            }
        } elseif ($sessionId) {
            $sessionUsageCount = VoucherUsage::where('voucher_id', $voucher->id)
                ->where('session_id', $sessionId)
                ->count();
            if ($sessionUsageCount >= $voucher->usage_limit_per_user) {
                return response()->json([
                    'success' => false,
                    'message' => "Phiên này đã sử dụng mã {$voucher->usage_limit_per_user} lần. Không thể áp dụng thêm.",
                ], 400);
            }
        }

        if ($subtotal < $voucher->min_order_amount) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng tối thiểu ' . number_format($voucher->min_order_amount, 0, ',', '.') . '₫ mới có thể áp dụng mã này.',
            ], 400);
        }

        $discount = $voucher->calculateDiscount($subtotal);

        return response()->json([
            'success' => true,
            'message' => "Áp dụng mã {$voucher->code} thành công!",
            'data' => [
                'voucher' => $voucher,
                'discount_amount' => $discount,
                'final_total' => max(0, $subtotal - $discount),
                'user_usage_count' => $user ? $userUsageCount : ($sessionId ? $sessionUsageCount : 0),
                'usage_limit_per_user' => $voucher->usage_limit_per_user,
            ],
        ]);
    }

    // Ghi nhận việc sử dụng voucher khi đặt hàng thành công
    public function recordUsage(Request $request): JsonResponse
    {
        $request->validate([
            'voucher_id' => ['required', 'exists:vouchers,id'],
            'order_id' => ['required', 'exists:orders,id'],
            'discount_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $user = Auth::user();
        $sessionId = $request->header('X-Session-ID');

        $usage = VoucherUsage::create([
            'voucher_id' => $request->voucher_id,
            'user_id' => $user?->id,
            'session_id' => !$user ? $sessionId : null,
            'order_id' => $request->order_id,
            'discount_amount' => $request->discount_amount,
        ]);

        // Increment voucher used_count
        Voucher::where('id', $request->voucher_id)->increment('used_count');

        return response()->json([
            'success' => true,
            'message' => 'Đã ghi nhận sử dụng voucher.',
            'data' => $usage,
        ]);
    }
}