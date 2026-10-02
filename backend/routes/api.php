<?php

use App\Http\Controllers\Api\Ai\AiChatController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Cart\CartController;
use App\Http\Controllers\Api\Catalog\CategoryController;
use App\Http\Controllers\Api\Catalog\CollectionController;
use App\Http\Controllers\Api\Consultation\ConsultationController;
use App\Http\Controllers\Api\Faq\ProductFaqController;
use App\Http\Controllers\Api\FlashSale\FlashSaleController;
use App\Http\Controllers\Api\Lookbook\LookbookController;
use App\Http\Controllers\Api\Order\OrderController;
use App\Http\Controllers\Api\Payment\MomoController;
use App\Http\Controllers\Api\Payment\VnpayController;
use App\Http\Controllers\Api\Product\ProductController;
use App\Http\Controllers\Api\Review\ReviewController;
use App\Http\Controllers\Api\Reward\LuckyWheelController;
use App\Http\Controllers\Api\Voucher\VoucherController;
use App\Http\Controllers\Api\Affiliate\AffiliateController;
use App\Http\Controllers\Api\Vendor\VendorController;
use App\Http\Controllers\Api\Shipping\GhnController;
use App\Http\Controllers\Api\Shipping\ShippingCalculatorController;
use App\Http\Controllers\Api\VisualSearch\VisualSearchController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminProductController;
use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\Admin\AdminVoucherController;
use App\Http\Controllers\Api\Admin\AdminFaqController;
use App\Http\Controllers\Api\Admin\AdminCustomerController;
use App\Http\Controllers\Api\Admin\AdminWithdrawalController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| GS Luxury Furniture API Routes
|--------------------------------------------------------------------------
*/

// --- 1. Authentication & Profile ---
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// --- 2. Categories & Collections ---
Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::get('/{slug}', [CategoryController::class, 'show']);
});

Route::prefix('collections')->group(function () {
    Route::get('/', [CollectionController::class, 'index']);
    Route::get('/{slug}', [CollectionController::class, 'show']);
});

// --- 3. Products & FAQs & Reviews ---
Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/{slugOrId}', [ProductController::class, 'show']);
    Route::post('/{productId}/reviews', [ReviewController::class, 'store']);
    Route::get('/{productId}/faqs', [ProductFaqController::class, 'index']);
    Route::post('/{productId}/faqs', [ProductFaqController::class, 'store']);
});

// --- 4. Lookbooks & Hotspots ("Shop The Room") ---
Route::prefix('lookbooks')->group(function () {
    Route::get('/', [LookbookController::class, 'index']);
    Route::get('/{slug}', [LookbookController::class, 'show']);
});

// --- 5. Cart Management ---
Route::prefix('cart')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [CartController::class, 'index']);
    Route::post('/', [CartController::class, 'store']);
    Route::put('/{id}', [CartController::class, 'update']);
    Route::delete('/clear', [CartController::class, 'clear']);
    Route::delete('/{id}', [CartController::class, 'destroy']);
});

// --- 6. Orders & Checkout ---
Route::prefix('orders')->group(function () {
    Route::post('/', [OrderController::class, 'store']);
    Route::get('/track/{orderNumber}', [OrderController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/my-orders', [OrderController::class, 'userOrders']);
        Route::post('/{orderNumber}/cancel', [OrderController::class, 'cancel']);
    });
});

// --- 7. MoMo Payment ---
Route::prefix('momo')->group(function () {
    Route::post('/create-payment', [MomoController::class, 'createPayment']);
    Route::post('/ipn', [MomoController::class, 'handleIPN']);
    Route::match(['get', 'post'], '/return', [MomoController::class, 'handleReturn']);
});

// --- 8. VNPAY Payment ---
Route::prefix('vnpay')->group(function () {
    Route::post('/create-payment', [VnpayController::class, 'createPayment']);
    Route::get('/return', [VnpayController::class, 'handleReturn']);
    Route::match(['get', 'post'], '/ipn', [VnpayController::class, 'handleIPN']);
});

// --- 8. Consultations (Home Design Appointment) ---
Route::prefix('consultations')->group(function () {
    Route::post('/', [ConsultationController::class, 'store']);
});

// --- 8. Vouchers & Coupons ---
Route::prefix('vouchers')->group(function () {
    Route::get('/', [VoucherController::class, 'index']);
    Route::post('/apply', [VoucherController::class, 'apply']);
    // Ghi nhận thủ công chỉ dành cho quản trị viên (OrderController đã tự ghi nhận khi đặt hàng)
    Route::post('/record-usage', [VoucherController::class, 'recordUsage'])->middleware(['auth:sanctum', 'admin']);
});

// --- 9. Flash Sales & Deals ---
Route::prefix('flash-sales')->group(function () {
    Route::get('/active', [FlashSaleController::class, 'active']);
});

// --- 10. AI Shopping Concierge Assistant ---
Route::prefix('ai')->group(function () {
    Route::post('/chat', [AiChatController::class, 'chat']);
});

// --- 11. Logistics & Dynamic Shipping Calculator ---
Route::prefix('shipping')->group(function () {
    Route::post('/calculate', [ShippingCalculatorController::class, 'calculate']);
    Route::get('/provinces', [GhnController::class, 'getProvinces']);
    Route::get('/districts', [GhnController::class, 'getDistricts']);
    Route::get('/wards', [GhnController::class, 'getWards']);
    Route::post('/fee', [GhnController::class, 'calculateFee']);
    Route::post('/fee/both', [GhnController::class, 'calculateBothServices']);
});

// --- 12. Visual Search & AI Style Matching ---
Route::prefix('visual-search')->group(function () {
    Route::get('/', [VisualSearchController::class, 'search']);
    Route::post('/', [VisualSearchController::class, 'search']);
    Route::post('/analyze-room', [VisualSearchController::class, 'analyzeRoom']);
});

// --- 12b. Lucky Wheel (GS Coins, 1 lượt/ngày, server quyết định giải thưởng) ---
Route::prefix('rewards')->middleware('auth:sanctum')->group(function () {
    Route::get('/spin', [LuckyWheelController::class, 'status']);
    Route::post('/spin', [LuckyWheelController::class, 'spin'])->middleware('throttle:10,1');
});

// --- 13. Affiliate Marketing & CTV Commissions ---
Route::prefix('affiliate')->middleware('auth:sanctum')->group(function () {
    Route::get('/stats', [AffiliateController::class, 'getStats']);
    Route::post('/withdraw', [AffiliateController::class, 'requestWithdrawal']);
    Route::get('/withdrawals', [AffiliateController::class, 'getWithdrawalHistory']);
});

// --- 14. Vendor & Shop Management Portal ---
Route::prefix('vendor')->middleware('auth:sanctum')->group(function () {
    Route::post('/register', [VendorController::class, 'registerShop']);
    Route::get('/stats', [VendorController::class, 'getShopStats']);
});

// --- 15. Admin & Multi-Vendor Management Portal ---
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    // Dashboard KPIs & Analytics
    Route::get('/dashboard/stats', [AdminDashboardController::class, 'getStats']);

    // Tạo vận đơn GHN thật cho 1 đơn hàng đã xác nhận
    Route::post('/orders/create-ghn-shipping', [App\Http\Controllers\Api\Shipping\GhnController::class, 'createShippingOrder']);

    // Product Management (CRUD)
    Route::get('/products', [AdminProductController::class, 'index']);
    Route::post('/products', [AdminProductController::class, 'store']);
    Route::get('/products/{id}', [AdminProductController::class, 'show']);
    Route::put('/products/{id}', [AdminProductController::class, 'update']);
    Route::delete('/products/{id}', [AdminProductController::class, 'destroy']);
    Route::post('/upload-image', [AdminProductController::class, 'uploadImage']);

    // Order Management & Fulfillment
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
    Route::put('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);

    // Voucher Management
    Route::get('/vouchers', [AdminVoucherController::class, 'index']);
    Route::post('/vouchers', [AdminVoucherController::class, 'store']);
    Route::put('/vouchers/{id}', [AdminVoucherController::class, 'update']);
    Route::delete('/vouchers/{id}', [AdminVoucherController::class, 'destroy']);

    // Q&A Management & Replies
    Route::get('/faqs', [AdminFaqController::class, 'index']);
    Route::post('/faqs/{id}/answer', [AdminFaqController::class, 'answer']);
    Route::delete('/faqs/{id}', [AdminFaqController::class, 'destroy']);

    // Customer CRM & VIP Tiers
    Route::get('/customers', [AdminCustomerController::class, 'index']);

    // Affiliate Withdrawal Management
    Route::get('/withdrawals', [AdminWithdrawalController::class, 'index']);
    Route::get('/withdrawals/{id}', [AdminWithdrawalController::class, 'show']);
    Route::put('/withdrawals/{id}/approve', [AdminWithdrawalController::class, 'approve']);
    Route::put('/withdrawals/{id}/reject', [AdminWithdrawalController::class, 'reject']);
});