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

        DB::beginTransaction();
        try {
            // Mark withdrawal as approved
            $withdrawal->update([
                'status' => 'approved',
                'admin_notes' => $request->admin_notes,
                'processed_by' => $request->user()->id,
                'processed_at' => now(),
            ]);

            // Update affiliate commissions status from approved to paid
            AffiliateCommission::where('user_id', $withdrawal->user_id)
                ->where('status', 'approved')
                ->orderBy('created_at')
                ->each(function ($commission) use ($withdrawal) {
                    $commission->update(['status' => 'paid']);
                });

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Đã duyệt yêu cầu rút tiền thành công.',
                'data' => $withdrawal->fresh(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Không thể duyệt yêu cầu: ' . $e->getMessage(),
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