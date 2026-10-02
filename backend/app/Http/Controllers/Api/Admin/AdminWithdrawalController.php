<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AffiliateCommission;
use App\Models\WithdrawalRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminWithdrawalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = WithdrawalRequest::with('user')
            ->latest();

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        $withdrawals = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $withdrawals,
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $withdrawal = WithdrawalRequest::with('user', 'processor')->find($id);

        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy yêu cầu rút tiền.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $withdrawal,
        ]);
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $withdrawal = WithdrawalRequest::find($id);

        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy yêu cầu rút tiền.',
            ], 404);
        }

        if ($withdrawal->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Yêu cầu này đã được xử lý.',
            ], 422);
        }

        try {
            $result = DB::transaction(function () use ($request, $withdrawal) {
                // Khóa lại yêu cầu để 2 admin không duyệt trùng cùng lúc
                $withdrawal = WithdrawalRequest::where('id', $withdrawal->id)->lockForUpdate()->first();
                if ($withdrawal->status !== 'pending') {
                    return ['status' => 422, 'message' => 'Yêu cầu này đã được xử lý.'];
                }

                $commissions = AffiliateCommission::where('user_id', $withdrawal->user_id)
                    ->where('status', 'approved')
                    ->orderBy('created_at')
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();

                $amount = round((float) $withdrawal->amount, 2);
                $available = round((float) $commissions->sum('commission_amount'), 2);
                if ($amount > $available) {
                    return [
                        'status' => 422,
                        'message' => 'Số dư hoa hồng khả dụng hiện tại (' . number_format($available, 0, ',', '.') . ' VNĐ) không đủ để duyệt yêu cầu này.',
                    ];
                }

                // Chỉ chuyển "paid" đúng số tiền rút (cũ trước). Khoản cuối nếu dư sẽ được tách đôi:
                // phần đã chi -> paid, phần còn lại giữ "approved" để rút lần sau.
                $remaining = $amount;
                foreach ($commissions as $commission) {
                    if ($remaining <= 0) {
                        break;
                    }
                    $value = round((float) $commission->commission_amount, 2);

                    if ($value <= $remaining) {
                        $commission->update(['status' => 'paid']);
                        $remaining = round($remaining - $value, 2);
                        continue;
                    }

                    AffiliateCommission::create([
                        'user_id' => $commission->user_id,
                        'order_id' => $commission->order_id,
                        'order_amount' => $commission->order_amount,
                        'commission_rate' => $commission->commission_rate,
                        'commission_amount' => round($value - $remaining, 2),
                        'status' => 'approved',
                    ]);
                    $commission->update([
                        'commission_amount' => $remaining,
                        'status' => 'paid',
                    ]);
                    $remaining = 0;
                }

                $withdrawal->update([
                    'status' => 'approved',
                    'admin_notes' => $request->admin_notes,
                    'processed_by' => $request->user()->id,
                    'processed_at' => now(),
                ]);

                return ['status' => 200, 'withdrawal' => $withdrawal];
            });

            if ($result['status'] !== 200) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                ], $result['status']);
            }

            return response()->json([
                'success' => true,
                'message' => 'Đã duyệt yêu cầu rút tiền thành công.',
                'data' => $result['withdrawal']->fresh(),
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Approve withdrawal failed', [
                'withdrawal_id' => $withdrawal->id,
                'message' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Không thể duyệt yêu cầu lúc này, vui lòng thử lại.',
            ], 500);
        }
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'admin_notes' => 'required|string|max:1000',
        ]);

        $withdrawal = WithdrawalRequest::find($id);

        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy yêu cầu rút tiền.',
            ], 404);
        }

        if ($withdrawal->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Yêu cầu này đã được xử lý.',
            ], 422);
        }

        $withdrawal->update([
            'status' => 'rejected',
            'admin_notes' => $request->admin_notes,
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã từ chối yêu cầu rút tiền.',
            'data' => $withdrawal->fresh(),
        ]);
    }
}