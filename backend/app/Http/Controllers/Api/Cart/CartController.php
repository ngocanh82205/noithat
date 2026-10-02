<?php

namespace App\Http\Controllers\Api\Cart;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CartController extends Controller
{
    // Lấy giỏ hàng theo User hoặc Session ID
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->header('X-Session-ID') ?: $request->query('session_id');

        if (!$userId && !$sessionId) {
            return response()->json([
                'success' => true,
                'data' => [
                    'items' => [],
                    'subtotal' => 0,
                    'total_items' => 0,
                ],
            ]);
        }

        $query = CartItem::query()->with(['product.images', 'variant']);

        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            $query->where('session_id', $sessionId);
        }

        $items = $query->get();

        $subtotal = $items->sum(function ($item) {
            $price = $item->variant?->price ?? $item->product->price;
            return $price * $item->quantity;
        });

        $totalItems = $items->sum('quantity');

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
                'subtotal' => $subtotal,
                'total_items' => $totalItems,
            ],
        ]);
    }

    // Thêm sản phẩm vào giỏ hàng
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'product_id' => ['required', 'exists:products,id'],
            'variant_id' => ['nullable', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'session_id' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $userId = $request->user()?->id;
        $sessionId = $request->header('X-Session-ID') ?: $request->input('session_id');

        if (!$userId && !$sessionId) {
            $sessionId = 'sess_' . bin2hex(random_bytes(16));
        }

        $query = CartItem::where('product_id', $request->product_id)
            ->where('variant_id', $request->variant_id);

        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            $query->where('session_id', $sessionId);
        }

        $existingItem = $query->first();

        if ($existingItem) {
            $existingItem->quantity += $request->quantity;
            $existingItem->save();
            $cartItem = $existingItem;
        } else {
            $cartItem = CartItem::create([
                'user_id' => $userId,
                'session_id' => $userId ? null : $sessionId,
                'product_id' => $request->product_id,
                'variant_id' => $request->variant_id,
                'quantity' => $request->quantity,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã thêm sản phẩm vào giỏ hàng.',
            'data' => [
                'item' => $cartItem->load(['product.images', 'variant']),
                'session_id' => $sessionId,
            ],
        ], 201);
    }

    // Cập nhật số lượng item trong giỏ
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Số lượng không hợp lệ.',
            ], 422);
        }

        $userId = $request->user()?->id;
        $sessionId = $request->header('X-Session-ID') ?: $request->query('session_id');

        $query = CartItem::where('id', $id);
        if ($userId) {
            $query->where('user_id', $userId);
        } elseif ($sessionId) {
            $query->where('session_id', $sessionId);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Không xác thực được giỏ hàng.',
            ], 403);
        }

        $cartItem = $query->first();

        if (!$cartItem) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy mục trong giỏ hàng hoặc bạn không có quyền truy cập.',
            ], 404);
        }

        $cartItem->update(['quantity' => $request->quantity]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật số lượng thành công.',
            'data' => $cartItem->fresh(['product.images', 'variant']),
        ]);
    }

    // Xóa 1 item khỏi giỏ
    public function destroy(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->header('X-Session-ID') ?: $request->query('session_id');

        $query = CartItem::where('id', $id);
        if ($userId) {
            $query->where('user_id', $userId);
        } elseif ($sessionId) {
            $query->where('session_id', $sessionId);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Không xác thực được giỏ hàng.',
            ], 403);
        }

        $cartItem = $query->first();

        if (!$cartItem) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy mục trong giỏ hàng hoặc bạn không có quyền truy cập.',
            ], 404);
        }

        $cartItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa sản phẩm khỏi giỏ hàng.',
        ]);
    }

    // Xóa toàn bộ giỏ hàng
    public function clear(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->header('X-Session-ID') ?: $request->query('session_id');

        if ($userId) {
            CartItem::where('user_id', $userId)->delete();
        } elseif ($sessionId) {
            CartItem::where('session_id', $sessionId)->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã làm trống giỏ hàng.',
        ]);
    }
}
