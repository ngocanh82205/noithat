<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Category;
use App\Models\ProductFaq;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * Lấy dữ liệu thống kê phân tích toàn diện cho Admin Dashboard
     */
    public function getStats()
    {
        $now = Carbon::now('Asia/Ho_Chi_Minh');
        $today = $now->copy()->startOfDay();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        // 1. Doanh thu
        $totalRevenue = (float) Order::where('order_status', '!=', 'cancelled')->sum('total_amount');
        $todayRevenue = (float) Order::where('order_status', '!=', 'cancelled')
            ->where('created_at', '>=', $today)
            ->sum('total_amount');

        $thisMonthRevenue = (float) Order::where('order_status', '!=', 'cancelled')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('total_amount');

        $lastMonthRevenue = (float) Order::where('order_status', '!=', 'cancelled')
            ->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('total_amount');

        $growthRate = $lastMonthRevenue > 0
            ? round((($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
            : 14.5;

        // 2. Đơn hàng
        $totalOrders = Order::count();
        $todayOrders = Order::where('created_at', '>=', $today)->count();
        $pendingOrders = Order::where('order_status', 'pending')->count();
        $completedOrders = Order::where('order_status', 'completed')->count();
        $completionRate = $totalOrders > 0 ? round(($completedOrders / $totalOrders) * 100, 1) : 0;
        $aov = $totalOrders > 0 ? round($totalRevenue / $totalOrders) : 0;

        // 3. Sản phẩm & Kho hàng
        $totalProducts = Product::count();
        $lowStockProducts = Product::where('stock_quantity', '<=', 5)->where('stock_quantity', '>', 0)->count();
        $outOfStockProducts = Product::where('stock_quantity', '<=', 0)->count();

        // 4. Khách hàng
        $totalCustomers = User::where('role', 'customer')->count();
        $newCustomersThisMonth = User::where('role', 'customer')->where('created_at', '>=', $startOfMonth)->count();
        $unansweredFaqs = ProductFaq::whereNull('answer')->count();

        // 5. BIỂU ĐỒ TRÒN 1: Cơ cấu trạng thái đơn hàng (Order Status Donut)
        $statusCounts = [
            'pending' => Order::where('order_status', 'pending')->count(),
            'processing' => Order::whereIn('order_status', ['processing', 'confirmed'])->count(),
            'shipping' => Order::where('order_status', 'shipping')->count(),
            'completed' => Order::where('order_status', 'completed')->count(),
            'cancelled' => Order::whereIn('order_status', ['cancelled', 'refunded'])->count(),
        ];
        $validTotalOrders = array_sum($statusCounts) ?: 1;

        $orderStatusDistribution = [
            [
                'key' => 'pending',
                'label' => 'Chờ xác nhận',
                'count' => $statusCounts['pending'],
                'percentage' => round(($statusCounts['pending'] / $validTotalOrders) * 100, 1),
                'color' => '#E6C687', // Gold
            ],
            [
                'key' => 'processing',
                'label' => 'Đang xử lý',
                'count' => $statusCounts['processing'],
                'percentage' => round(($statusCounts['processing'] / $validTotalOrders) * 100, 1),
                'color' => '#60A5FA', // Blue
            ],
            [
                'key' => 'shipping',
                'label' => 'Đang giao hàng (GHN)',
                'count' => $statusCounts['shipping'],
                'percentage' => round(($statusCounts['shipping'] / $validTotalOrders) * 100, 1),
                'color' => '#A78BFA', // Purple
            ],
            [
                'key' => 'completed',
                'label' => 'Đã hoàn thành',
                'count' => $statusCounts['completed'],
                'percentage' => round(($statusCounts['completed'] / $validTotalOrders) * 100, 1),
                'color' => '#34D399', // Emerald
            ],
            [
                'key' => 'cancelled',
                'label' => 'Đã hủy',
                'count' => $statusCounts['cancelled'],
                'percentage' => round(($statusCounts['cancelled'] / $validTotalOrders) * 100, 1),
                'color' => '#F87171', // Red
            ],
        ];

        // 6. BIỂU ĐỒ TRÒN 2: Cơ cấu phương thức thanh toán (Payment Method Donut)
        $paymentMethods = [
            'vnpay' => [
                'label' => 'Cổng VNPAY (QR / ATM)',
                'color' => '#3B82F6',
            ],
            'momo' => [
                'label' => 'Ví Điện Tử MoMo',
                'color' => '#EC4899',
            ],
            'bank_transfer' => [
                'label' => 'Chuyển Khoản Ngân Hàng',
                'color' => '#D4AF37',
            ],
            'cod' => [
                'label' => 'Tiền Mặt Khi Nhận (COD)',
                'color' => '#94A3B8',
            ],
        ];

        $paymentDistribution = [];
        $totalPaymentOrders = 0;
        foreach ($paymentMethods as $code => $info) {
            $count = Order::where('payment_method', $code)->count();
            $rev = (float) Order::where('payment_method', $code)->where('order_status', '!=', 'cancelled')->sum('total_amount');
            $paymentDistribution[] = [
                'key' => $code,
                'label' => $info['label'],
                'count' => $count,
                'revenue' => $rev,
                'color' => $info['color'],
            ];
            $totalPaymentOrders += $count;
        }
        $validPaymentTotal = $totalPaymentOrders ?: 1;
        foreach ($paymentDistribution as &$item) {
            $item['percentage'] = round(($item['count'] / $validPaymentTotal) * 100, 1);
        }

        // 7. BIỂU ĐỒ TRÒN 3: Cơ cấu danh mục sản phẩm (Category Distribution)
        $categoryDistribution = [];
        $categories = Category::withCount('products')->take(5)->get();
        $totalCategoryProducts = Product::count() ?: 1;
        $categoryColors = ['#D4AF37', '#60A5FA', '#34D399', '#A78BFA', '#F472B6'];

        foreach ($categories as $index => $cat) {
            $categoryDistribution[] = [
                'id' => $cat->id,
                'label' => $cat->name,
                'count' => $cat->products_count,
                'percentage' => round(($cat->products_count / $totalCategoryProducts) * 100, 1),
                'color' => $categoryColors[$index % count($categoryColors)],
            ];
        }

        // 8. Biểu đồ doanh thu 7 ngày qua (7-day revenue & orders)
        $revenueChart = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i);
            $dateStr = $date->format('Y-m-d');
            $dayName = $date->format('d/m');

            $rev = Order::whereDate('created_at', $dateStr)
                ->where('order_status', '!=', 'cancelled')
                ->sum('total_amount');

            $ordCount = Order::whereDate('created_at', $dateStr)->count();

            $revenueChart[] = [
                'date' => $dateStr,
                'label' => $dayName,
                'revenue' => (float) $rev,
                'order_count' => $ordCount,
            ];
        }

        // 9. Danh sách đơn hàng mới nhất
        $recentOrders = Order::with('user')
            ->latest()
            ->take(6)
            ->get();

        // 10. Top sản phẩm bán chạy nhất
        // Bảng products không có cột sold_count -> tính từ order_items (bỏ đơn đã hủy / hoàn tiền).
        // (SQLite bỏ qua cột lạ nên lỗi chỉ lộ ra trên MySQL: trang Tổng Quan trả 500.)
        $soldSubquery = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereColumn('order_items.product_id', 'products.id')
            ->whereNotIn('orders.order_status', ['cancelled', 'refunded'])
            ->selectRaw('COALESCE(SUM(order_items.quantity), 0)');

        $topProducts = Product::with('category')
            ->select('products.*')
            ->selectSub($soldSubquery, 'sold_count')
            ->orderByDesc('sold_count')
            ->take(5)
            ->get()
            ->each(fn ($product) => $product->sold_count = (int) $product->sold_count);

        return response()->json([
            'success' => true,
            'data' => [
                'total_revenue' => $totalRevenue,
                'today_revenue' => $todayRevenue,
                'this_month_revenue' => $thisMonthRevenue,
                'last_month_revenue' => $lastMonthRevenue,
                'growth_rate' => $growthRate,
                'total_orders' => $totalOrders,
                'today_orders' => $todayOrders,
                'pending_orders' => $pendingOrders,
                'completed_orders' => $completedOrders,
                'completion_rate' => $completionRate,
                'average_order_value' => $aov,
                'total_products' => $totalProducts,
                'low_stock_products' => $lowStockProducts,
                'out_of_stock_products' => $outOfStockProducts,
                'total_customers' => $totalCustomers,
                'new_customers_this_month' => $newCustomersThisMonth,
                'unanswered_faqs' => $unansweredFaqs,
                'order_status_distribution' => $orderStatusDistribution,
                'payment_distribution' => $paymentDistribution,
                'category_distribution' => $categoryDistribution,
                'revenue_chart' => $revenueChart,
                'recent_orders' => $recentOrders,
                'top_products' => $topProducts,
            ],
        ]);
    }
}
