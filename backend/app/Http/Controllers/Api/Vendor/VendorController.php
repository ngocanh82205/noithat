<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorController extends Controller
{
    /**
     * Register / Onboard a new Seller Shop
     */
    public function registerShop(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập để mở gian hàng người bán.',
            ], 401);
        }

        $validated = $request->validate([
            'shop_name' => 'required|string|max:100',
            'shop_description' => 'required|string|max:500',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:255',
        ]);

        $user->update([
            'shop_name' => $validated['shop_name'],
            'shop_description' => $validated['shop_description'],
            'phone' => $validated['phone'],
            'address' => $validated['address'],
            'is_shop_active' => true,
            'role' => $user->role === 'admin' ? 'admin' : 'seller',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Chúc mừng! Gian hàng đối tác "' . $validated['shop_name'] . '" đã được kích hoạt thành công trên hệ thống GS Luxury.',
            'data' => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * Get Seller Dashboard KPIs and orders (real data from orders table)
     */
    public function getShopStats(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || (!$user->is_shop_active && !$user->isAdmin())) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản chưa đăng ký gian hàng hoặc không có quyền truy cập.',
            ], 403);
        }

        // Get vendor's product IDs
        $productIds = Product::where('shop_id', $user->id)->pluck('id');
        
        if ($productIds->isEmpty() && $user->isAdmin()) {
            $productIds = Product::pluck('id');
        }

        // Total products
        $totalProducts = $productIds->count();

        // Get orders containing vendor's products
        $orderIds = OrderItem::whereIn('product_id', $productIds)
            ->pluck('order_id')
            ->unique();

        // Total orders (unique orders containing vendor's products)
        $totalOrders = $orderIds->count();

        // Monthly revenue (current month)
        $currentMonthStart = now()->startOfMonth();
        $monthlyRevenue = Order::whereIn('id', $orderIds)
            ->where('created_at', '>=', $currentMonthStart)
            ->where('order_status', '!=', Order::STATUS_CANCELLED)
            ->sum('total_amount');

        // All time revenue
        $allTimeRevenue = Order::whereIn('id', $orderIds)
            ->where('order_status', '!=', Order::STATUS_CANCELLED)
            ->sum('total_amount');

        // Fulfillment rate (completed / total non-cancelled)
        $nonCancelledOrders = Order::whereIn('id', $orderIds)
            ->where('order_status', '!=', Order::STATUS_CANCELLED)
            ->count();
        $completedOrders = Order::whereIn('id', $orderIds)
            ->where('order_status', Order::STATUS_COMPLETED)
            ->count();
        $fulfillmentRate = $nonCancelledOrders > 0 
            ? round(($completedOrders / $nonCancelledOrders) * 100, 1) 
            : 0;

        // Recent payouts (from completed orders in last 30 days)
        $recentPayouts = Order::whereIn('id', $orderIds)
            ->where('order_status', Order::STATUS_COMPLETED)
            ->where('created_at', '>=', now()->subDays(30))
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'date' => $order->created_at->format('Y-m-d'),
                    'amount' => (float) $order->total_amount,
                    'status' => 'paid',
                    'bank' => 'Chuyển khoản ngân hàng',
                    'order_number' => $order->order_number,
                ];
            })
            ->values()
            ->toArray();

        // Average rating (placeholder - could be from reviews)
        $shopRating = $user->shop_rating ?? 4.95;

        // Response rate (placeholder - could be from response time metrics)
        $responseRate = 98.5;

        return response()->json([
            'success' => true,
            'data' => [
                'shop_name' => $user->shop_name ?: 'Gian hàng chính hãng GS Luxury Studio',
                'shop_rating' => (float) $shopRating,
                'response_rate' => $responseRate . '%',
                'total_products' => $totalProducts,
                'total_orders' => $totalOrders,
                'monthly_revenue' => (float) $monthlyRevenue,
                'all_time_revenue' => (float) $allTimeRevenue,
                'fulfillment_rate' => $fulfillmentRate . '%',
                'recent_payouts' => $recentPayouts,
            ],
        ]);
    }
}