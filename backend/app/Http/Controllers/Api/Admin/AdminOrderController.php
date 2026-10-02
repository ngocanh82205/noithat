<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminOrderController extends Controller
{
    /**
     * List all orders for admin
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['user', 'items.product', 'items.variant'])->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            // Hỗ trợ lọc nhiều trạng thái: ?status=pending,processing
            $query->whereIn('order_status', array_filter(explode(',', (string) $request->status)));
        }

        if ($request->filled('payment_status') && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('order_number', 'like', "%{$q}%")
                    ->orWhere('customer_name', 'like', "%{$q}%")
                    ->orWhere('customer_phone', 'like', "%{$q}%")
                    ->orWhere('customer_email', 'like', "%{$q}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $orders = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $orders->items(),
            'pagination' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ]
        ]);
    }

    /**
     * Show single order details
     */
    public function show($id): JsonResponse
    {
        $order = Order::with(['user', 'items.product.images', 'items.variant'])
            ->where('id', $id)
            ->orWhere('order_number', $id)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /**
     * Update order status
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $order = Order::with('items')->findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:pending,processing,confirmed,shipping,completed,cancelled,refunded',
            'payment_status' => 'nullable|in:pending,unpaid,paid,failed,refunded',
            'notes' => 'nullable|string',
        ]);

        $oldStatus = $order->order_status;
        $newStatus = $validated['status'];

        // Đơn đã hủy / hoàn tiền là trạng thái cuối (kho đã trả lại); chỉ cho phép hủy -> hoàn tiền
        $isTerminal = in_array($oldStatus, [Order::STATUS_CANCELLED, Order::STATUS_REFUNDED], true);
        $allowedFromTerminal = $oldStatus === Order::STATUS_CANCELLED && $newStatus === Order::STATUS_REFUNDED;
        if ($isTerminal && $newStatus !== $oldStatus && !$allowedFromTerminal) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng đã ' . ($oldStatus === Order::STATUS_CANCELLED ? 'hủy' : 'hoàn tiền') . ', không thể chuyển sang trạng thái khác.',
            ], 422);
        }

        // Handle cancellation - restore stock
        if ($newStatus === Order::STATUS_CANCELLED && $oldStatus !== Order::STATUS_CANCELLED) {
            if (!$order->canCancel()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể hủy đơn hàng ở trạng thái hiện tại.',
                ], 422);
            }

            $reason = $validated['notes'] ?? 'Hủy bởi quản trị viên';
            if (!$order->cancel($reason)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể hủy đơn hàng. Vui lòng thử lại.',
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Đã hủy đơn hàng #' . $order->order_number . ' và hoàn kho thành công!',
                'data' => $order->fresh(),
            ]);
        }

        // Hoàn tiền: trả kho/voucher/xu đã dùng, thu hồi xu tích lũy & hoa hồng
        if ($newStatus === Order::STATUS_REFUNDED && $oldStatus !== Order::STATUS_REFUNDED) {
            if (!$order->refund($validated['notes'] ?? '')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể hoàn tiền đơn hàng. Vui lòng thử lại.',
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Đã hoàn tiền đơn hàng #' . $order->order_number . ' và hoàn kho thành công!',
                'data' => $order->fresh(),
            ]);
        }

        DB::transaction(function () use ($order, $oldStatus, $newStatus, $validated) {
            $order->order_status = $newStatus;
            if (!empty($validated['payment_status'])) {
                $order->payment_status = $validated['payment_status'];
            }
            if (!empty($validated['notes'])) {
                $order->notes = $order->notes . "\n" . $validated['notes'];
            }

            // Thưởng tích lũy & hoa hồng gắn với vòng đời đơn hàng
            if ($newStatus === Order::STATUS_COMPLETED && $oldStatus !== Order::STATUS_COMPLETED) {
                $order->applyCompletionRewards();
            }

            $order->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái đơn hàng #' . $order->order_number . ' thành công!',
            'data' => $order,
        ]);
    }
}