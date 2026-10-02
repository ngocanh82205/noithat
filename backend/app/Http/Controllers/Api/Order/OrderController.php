<?php

namespace App\Http\Controllers\Api\Order;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Shipping\GhnController;
use App\Mail\OrderConfirmation;
use App\Models\CartItem;
use App\Models\FlashSale;
use App\Models\FlashSaleProduct;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    // 1 GS Coin = 1.000₫, tối đa khấu trừ 20% giá trị tạm tính (đồng bộ với StoreContext ở frontend)
    public const COIN_VALUE = 1000;
    public const MAX_COINS_DISCOUNT_RATIO = 0.2;

    protected GhnController $ghnController;

    public function __construct(GhnController $ghnController)
    {
        $this->ghnController = $ghnController;
    }

    // Tạo đơn hàng mới (Checkout)
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:20'],
            'shipping_address' => ['required', 'string', 'max:500'],
            'shipping_city' => ['nullable', 'string', 'max:100'],
            'shipping_district' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'payment_method' => ['required', 'in:cod,bank_transfer,vnpay,momo'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.variant_id' => ['nullable', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'voucher_code' => ['nullable', 'string'],
            'shipping_method' => ['nullable', 'string', 'in:standard,express,install_pro'],
            'coins_used' => ['nullable', 'integer', 'min:0'],
            'referral_code' => ['nullable', 'string'],
        ], [
            'customer_name.required' => 'Vui lòng nhập họ và tên người nhận.',
            'customer_email.required' => 'Vui lòng nhập địa chỉ email.',
            'customer_phone.required' => 'Vui lòng nhập số điện thoại liên hệ.',
            'shipping_address.required' => 'Vui lòng nhập địa chỉ giao hàng.',
            'items.required' => 'Giỏ hàng của bạn đang trống.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $authUser = auth('sanctum')->user() ?? $request->user();
        if (!$authUser) {
            return response()->json([
                'success' => false,
                'message' => 'Quý khách vui lòng đăng nhập tài khoản trước khi thực hiện đặt hàng.',
            ], 401);
        }

        // 1. Idempotency Key check to prevent double-checkout or network retry race conditions
        $idempotencyKey = $request->header('X-Idempotency-Key')
            ?? $request->header('Idempotency-Key')
            ?? $request->input('idempotency_key');

        $idempotencyCacheKey = null;
        if ($idempotencyKey) {
            $idempotencyCacheKey = 'idempotency_order_' . md5($idempotencyKey . '_' . $authUser->id);
            $cached = Cache::get($idempotencyCacheKey);
            if ($cached) {
                if (($cached['status'] ?? '') === 'processing') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Yêu cầu thanh toán của bạn đang được xử lý, vui lòng không bấm liên tục.',
                    ], 409);
                }
                if (($cached['status'] ?? '') === 'completed' && isset($cached['response'])) {
                    return response()->json($cached['response'], 200, [
                        'X-Idempotent-Replay' => 'true',
                    ]);
                }
            }
            Cache::put($idempotencyCacheKey, ['status' => 'processing'], 60);
        }

        // Validate voucher BEFORE transaction to return proper validation errors
        $voucher = null;
        $discount = 0;
        $voucherCode = $request->input('voucher_code');

        if ($voucherCode) {
            $voucher = Voucher::where('code', strtoupper($voucherCode))
                ->where('is_active', true)
                ->where(function ($q) {
                    $q->whereNull('start_date')->orWhere('start_date', '<=', now());
                })
                ->where(function ($q) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', now());
                })
                ->first();

            if (!$voucher) {
                if ($idempotencyCacheKey) Cache::forget($idempotencyCacheKey);
                return response()->json([
                    'success' => false,
                    'message' => 'Mã giảm giá không tồn tại hoặc đã hết hạn sử dụng.',
                ], 422);
            }

            if ($voucher->usage_limit > 0 && $voucher->used_count >= $voucher->usage_limit) {
                if ($idempotencyCacheKey) Cache::forget($idempotencyCacheKey);
                return response()->json([
                    'success' => false,
                    'message' => 'Mã giảm giá đã hết lượt sử dụng.',
                ], 400);
            }

            // Check per-user/session usage limit
            $user = $authUser;
            $sessionId = $request->header('X-Session-ID');

            if ($user) {
                $userUsageCount = VoucherUsage::where('voucher_id', $voucher->id)
                    ->where('user_id', $user->id)
                    ->count();
                if ($userUsageCount >= $voucher->usage_limit_per_user) {
                    if ($idempotencyCacheKey) Cache::forget($idempotencyCacheKey);
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
                    if ($idempotencyCacheKey) Cache::forget($idempotencyCacheKey);
                    return response()->json([
                        'success' => false,
                        'message' => "Phiên này đã sử dụng mã {$voucher->usage_limit_per_user} lần. Không thể áp dụng thêm.",
                    ], 400);
                }
            }

            // We'll check min_order_amount inside transaction after calculating subtotal
        }

        try {
            $result = DB::transaction(function () use ($request, $voucher, $voucherCode, &$discount, $authUser) {
                $subtotal = 0;
                $orderItemsData = [];

                // Check for currently active Flash Sale
                $activeFlashSale = FlashSale::where('is_active', true)
                    ->where('start_time', '<=', now())
                    ->where('end_time', '>=', now())
                    ->first();

                // 2. Validate and lock products/variants/flash-sale items with Pessimistic Locking
                foreach ($request->items as $item) {
                    $product = Product::where('id', $item['product_id'])->lockForUpdate()->firstOrFail();
                    $variant = !empty($item['variant_id'])
                        ? ProductVariant::where('id', $item['variant_id'])->lockForUpdate()->first()
                        : null;

                    $availableStock = $variant ? $variant->stock_quantity : $product->stock_quantity;
                    $quantity = (int) $item['quantity'];

                    // Concurrency check on Flash Sale quota if applicable
                    $flashSaleProduct = null;
                    if ($activeFlashSale) {
                        $flashSaleProduct = FlashSaleProduct::where('flash_sale_id', $activeFlashSale->id)
                            ->where('product_id', $product->id)
                            ->lockForUpdate()
                            ->first();

                        if ($flashSaleProduct) {
                            $availableFlashQuota = max(0, $flashSaleProduct->stock_for_sale - $flashSaleProduct->sold_count);
                            if ($availableFlashQuota < $quantity) {
                                throw ValidationException::withMessages([
                                    'items' => "Suất ưu đãi Flash Sale cho [{$product->name}] chỉ còn {$availableFlashQuota} sản phẩm! Đã có khách hàng khác nhanh tay đặt trước.",
                                ]);
                            }
                        }
                    }

                    if ($availableStock < $quantity) {
                        throw ValidationException::withMessages([
                            'items' => "Sản phẩm {$product->name}" . ($variant ? " ({$variant->name})" : "") . " chỉ còn {$availableStock} trong kho. Không đủ số lượng yêu cầu ({$quantity}).",
                        ]);
                    }

                    // Price priority: Variant price -> Flash Sale price (if active) -> Regular price
                    $price = $variant
                        ? (float) $variant->price
                        : ($flashSaleProduct ? (float) $flashSaleProduct->flash_price : (float) $product->price);

                    $itemTotal = $price * $quantity;
                    $subtotal += $itemTotal;

                    $orderItemsData[] = [
                        'product_id' => $product->id,
                        'variant_id' => $variant?->id,
                        'product_name' => $product->name,
                        'variant_name' => $variant?->name,
                        'product_image' => $variant?->image_url ?? $product->images->first()?->image_url,
                        'price' => $price,
                        'quantity' => $quantity,
                        'total_price' => $itemTotal,
                    ];
                }

                // Calculate shipping fee using GHN API (called internally)
                $shippingMethod = $request->input('shipping_method', 'standard');
                $toDistrictId = $request->input('shipping_district_id');
                $toWardCode = $request->input('shipping_ward_code');
                
                // Default fallback fee
                $shippingCity = $request->input('shipping_city') ?: 'Hà Nội';
                $shippingFee = $this->getFallbackShippingFee($shippingCity, $subtotal, $shippingMethod);
                
                // If we have GHN district/ward, call GHN API for real fee
                if ($toDistrictId && $toWardCode) {
                    $ghnFee = $this->ghnController->calculateFeeInternal([
                        'to_district_id' => (int) $toDistrictId,
                        'to_ward_code' => $toWardCode,
                        'weight' => 5000,
                        'length' => 50,
                        'width' => 30,
                        'height' => 20,
                        'service_type_id' => $shippingMethod === 'express' ? 5 : 2,
                        'cod' => false,
                    ]);
                    
                    if ($ghnFee && isset($ghnFee['total_fee'])) {
                        $shippingFee = (float) $ghnFee['total_fee'];
                    }
                }

                // Validate and calculate voucher discount server-side (min_order_amount check inside transaction)
                if ($voucher) {
                    // Re-check usage limit under a row lock to avoid overselling the voucher concurrently
                    $voucher = Voucher::where('id', $voucher->id)->lockForUpdate()->first();
                    if ($voucher->usage_limit > 0 && $voucher->used_count >= $voucher->usage_limit) {
                        throw ValidationException::withMessages([
                            'voucher_code' => 'Mã giảm giá đã hết lượt sử dụng.',
                        ]);
                    }
                    if ($subtotal < $voucher->min_order_amount) {
                        throw ValidationException::withMessages([
                            'voucher_code' => 'Đơn hàng tối thiểu ' . number_format($voucher->min_order_amount, 0, ',', '.') . '₫ mới có thể áp dụng mã này.',
                        ]);
                    }
                    $discount = $voucher->calculateDiscount($subtotal);
                }

                // Coins: clamp to the user's real balance (row locked) and to 20% of subtotal,
                // so a crafted request cannot claim more coins than owned.
                $coinsUsed = max(0, (int) $request->input('coins_used', 0));
                if ($coinsUsed > 0) {
                    $lockedUser = \App\Models\User::where('id', $authUser->id)->lockForUpdate()->first();
                    $maxCoinsBySubtotal = (int) floor(($subtotal * self::MAX_COINS_DISCOUNT_RATIO) / self::COIN_VALUE);
                    $coinsUsed = min($coinsUsed, (int) ($lockedUser?->coins ?? 0), $maxCoinsBySubtotal);
                }
                $coinsDiscount = $coinsUsed * self::COIN_VALUE;

                $totalAmount = max(0, $subtotal + $shippingFee - $discount - $coinsDiscount);

                $orderNumber = 'GSL-' . date('Ymd') . '-' . strtoupper(Str::random(6));

                $order = Order::create([
                    'order_number' => $orderNumber,
                    'user_id' => $authUser?->id,
                    'customer_name' => $request->customer_name,
                    'customer_email' => $request->customer_email,
                    'customer_phone' => $request->customer_phone,
                    'shipping_address' => $request->shipping_address,
                    'shipping_city' => $request->shipping_city ?: 'Hà Nội',
                    'shipping_district' => $request->shipping_district,
                    'shipping_province_id' => $request->input('shipping_province_id'),
                    'shipping_district_id' => $request->input('shipping_district_id'),
                    'shipping_ward_code' => $request->input('shipping_ward_code'),
                    'shipping_method' => $shippingMethod,
                    'notes' => $request->notes,
                    'subtotal' => $subtotal,
                    'shipping_fee' => $shippingFee,
                    'discount_amount' => $discount,
                    'coins_used' => $coinsUsed,
                    'coins_discount' => $coinsDiscount,
                    'total_amount' => $totalAmount,
                    'payment_method' => $request->payment_method,
                    'payment_status' => 'pending',
                    'referral_code' => $request->input('referral_code'),
                    'voucher_code' => $voucherCode,
                    'order_status' => 'processing',
                ]);

                foreach ($orderItemsData as $orderItem) {
                    $orderItem['order_id'] = $order->id;
                    OrderItem::create($orderItem);
                }

                // Deduct coins from user if used (already clamped to balance above)
                if ($authUser && $coinsUsed > 0) {
                    \App\Models\User::where('id', $authUser->id)->decrement('coins', $coinsUsed);
                }

                // Check Affiliate Referral
                $refCode = $request->input('referral_code');
                if ($refCode) {
                    $referrer = \App\Models\User::where('referral_code', $refCode)->first();
                    if ($referrer && (!$authUser || $referrer->id !== $authUser->id)) {
                        $commissionAmount = $totalAmount * 0.05; // 5%
                        \App\Models\AffiliateCommission::create([
                            'user_id' => $referrer->id,
                            'order_id' => $order->id,
                            'order_amount' => $totalAmount,
                            'commission_rate' => 5.0,
                            'commission_amount' => $commissionAmount,
                            // Chỉ chuyển "approved" (được rút) khi đơn hàng hoàn tất — xem Order::applyCompletionRewards()
                            'status' => 'pending',
                        ]);
                    }
                }

                // Clear Cart if user or session
                $userId = $authUser?->id;
                $sessionId = $request->header('X-Session-ID');
                if ($userId) {
                    CartItem::where('user_id', $userId)->delete();
                } elseif ($sessionId) {
                    CartItem::where('session_id', $sessionId)->delete();
                }

                // 3. Deduct stock quantities and increment Flash Sale sold quota atomically
                foreach ($request->items as $item) {
                    $quantity = (int) $item['quantity'];
                    if (!empty($item['variant_id'])) {
                        ProductVariant::where('id', $item['variant_id'])->decrement('stock_quantity', $quantity);
                    } else {
                        Product::where('id', $item['product_id'])->decrement('stock_quantity', $quantity);
                    }

                    if ($activeFlashSale) {
                        FlashSaleProduct::where('flash_sale_id', $activeFlashSale->id)
                            ->where('product_id', $item['product_id'])
                            ->increment('sold_count', $quantity);
                    }
                }

                // Record voucher usage if applicable
                if ($voucher && $discount > 0) {
                    VoucherUsage::create([
                        'voucher_id' => $voucher->id,
                        'user_id' => $authUser?->id,
                        'session_id' => !$authUser ? $request->header('X-Session-ID') : null,
                        'order_id' => $order->id,
                        'discount_amount' => $discount,
                    ]);
                    $voucher->increment('used_count');
                }

                return $order;
            });

            // 4. Send confirmation email asynchronously via Background Queue
            try {
                Mail::to($result->customer_email)->queue(new OrderConfirmation($result->load('items')));
            } catch (\Exception $e) {
                // Log error but don't fail the checkout transaction
                Log::error('Failed to queue order confirmation email: ' . $e->getMessage());
            }

            $responsePayload = [
                'success' => true,
                'message' => 'Đặt hàng thành công! GS Luxury sẽ liên hệ xác nhận trong thời gian sớm nhất.',
                'data' => [
                    'order' => $result->load('items'),
                ],
            ];

            // Cache idempotency response for 5 minutes
            if ($idempotencyCacheKey) {
                Cache::put($idempotencyCacheKey, [
                    'status' => 'completed',
                    'response' => $responsePayload,
                ], 300);
            }

            return response()->json($responsePayload, 201);

        } catch (ValidationException $e) {
            if ($idempotencyCacheKey) {
                Cache::forget($idempotencyCacheKey);
            }
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            if ($idempotencyCacheKey) {
                Cache::forget($idempotencyCacheKey);
            }
            Log::error('Order creation failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra, vui lòng thử lại sau.',
            ], 500);
        }
    }

    /**
     * Fallback shipping fee calculation (when GHN API unavailable)
     */
    private function getFallbackShippingFee(?string $city, float $subtotal, string $method): float
    {
        $city = $city ?: 'Hà Nội';
        $isHanoi = stripos($city, 'Hà Nội') !== false;
        $isHcm = stripos($city, 'Hồ Chí Minh') !== false || stripos($city, 'TP.HCM') !== false;

        $standardFee = 250000;
        $expressFee = 500000;
        $installFee = 300000;

        return match ($method) {
            'express' => $expressFee,
            'install_pro' => $installFee,
            default => $standardFee,
        };
    }

    // Tra cứu chi tiết đơn hàng theo mã đơn hàng
    public function show(string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->with(['items.product', 'items.variant'])
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đơn hàng.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    // Lịch sử đơn hàng của người dùng đăng nhập
    public function userOrders(Request $request): JsonResponse
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with(['items'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    // Hủy đơn hàng (chỉ user sở hữu đơn hàng mới được hủy)
    public function cancel(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->where('user_id', $request->user()->id)
            ->with('items')
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đơn hàng.',
            ], 404);
        }

        if (!$order->canCancel()) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng không thể hủy ở trạng thái hiện tại (' . $order->order_status . ').',
            ], 422);
        }

        if ($order->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng đã thanh toán online. Vui lòng liên hệ CSKH GS Luxury để được hủy và hoàn tiền.',
            ], 422);
        }

        $reason = (string) $request->input('reason', '');

        if ($order->cancel($reason)) {
            return response()->json([
                'success' => true,
                'message' => 'Đã hủy đơn hàng thành công. Kho đã được hoàn trả.',
                'data' => $order->fresh(),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Không thể hủy đơn hàng. Vui lòng thử lại.',
        ], 500);
    }
}