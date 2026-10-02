<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductImage;
use Illuminate\Support\Str;

class AdminProductController extends Controller
{
    /**
     * Get paginated products for admin table
     */
    public function index(Request $request)
    {
        $query = Product::with(['category', 'variants', 'images'])->latest();

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('sku', 'like', "%{$q}%")
                    ->orWhere('material', 'like', "%{$q}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        } elseif ($request->filled('is_active')) {
            $query->where('status', $request->boolean('is_active') ? 'active' : 'inactive');
        }

        $perPage = $request->get('per_page', 15);
        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ]
        ]);
    }

    /**
     * Create a new product with variants and images
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'sku' => 'nullable|string|unique:products,sku',
            'price' => 'required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'summary' => 'nullable|string',
            'description' => 'nullable|string',
            'material' => 'nullable|string',
            'dimensions' => 'nullable|string',
            'warranty' => 'nullable|string',
            'care_instructions' => 'nullable|string',
            'is_featured' => 'nullable|boolean',
            'is_bestseller' => 'nullable|boolean',
            'is_new' => 'nullable|boolean',
            'status' => 'nullable|string|in:active,inactive,draft',
            'is_active' => 'nullable|boolean',
            'image_url' => 'nullable|string',
            'variants' => 'nullable|array',
            'variants.*.name' => 'required|string',
            'variants.*.color_name' => 'nullable|string',
            'variants.*.color_hex' => 'nullable|string',
            'variants.*.price' => 'nullable|numeric|min:0',
            'variants.*.stock' => 'nullable|integer|min:0',
            'variants.*.stock_quantity' => 'nullable|integer|min:0',
            'variants.*.image_url' => 'nullable|string',
        ]);

        $slug = Str::slug($validated['name']) . '-' . rand(100, 999);
        $sku = $validated['sku'] ?? ('GS-' . strtoupper(Str::random(6)));

        $status = 'active';
        if (!empty($validated['status'])) {
            $status = $validated['status'];
        } elseif (isset($validated['is_active'])) {
            $status = $validated['is_active'] ? 'active' : 'inactive';
        }

        $product = Product::create([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'slug' => $slug,
            'sku' => $sku,
            'price' => $validated['price'],
            'original_price' => $validated['original_price'] ?? null,
            'stock_quantity' => $validated['stock_quantity'] ?? 10,
            'summary' => $validated['summary'] ?? null,
            'description' => $validated['description'] ?? null,
            'material' => $validated['material'] ?? null,
            'dimensions' => $validated['dimensions'] ?? null,
            'warranty' => $validated['warranty'] ?? '24 tháng chính hãng',
            'care_instructions' => $validated['care_instructions'] ?? null,
            'is_featured' => $validated['is_featured'] ?? false,
            'is_bestseller' => $validated['is_bestseller'] ?? false,
            'is_new' => $validated['is_new'] ?? true,
            'status' => $status,
        ]);

        // Main Image
        if (!empty($validated['image_url'])) {
            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $validated['image_url'],
                'is_primary' => true,
                'sort_order' => 0,
            ]);
        }

        // Variants
        if (!empty($validated['variants'])) {
            foreach ($validated['variants'] as $v) {
                ProductVariant::create([
                    'product_id' => $product->id,
                    'name' => $v['name'],
                    'color_name' => $v['color_name'] ?? null,
                    'color_hex' => $v['color_hex'] ?? null,
                    'price' => $v['price'] ?? $product->price,
                    'stock_quantity' => $v['stock_quantity'] ?? $v['stock'] ?? 5,
                    'image_url' => $v['image_url'] ?? null,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Thêm sản phẩm mới thành công!',
            'data' => $product->load(['category', 'variants', 'images']),
        ], 201);
    }

    /**
     * Update an existing product
     */
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category_id' => 'sometimes|exists:categories,id',
            'sku' => 'nullable|string|unique:products,sku,' . $product->id,
            'price' => 'sometimes|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'summary' => 'nullable|string',
            'description' => 'nullable|string',
            'material' => 'nullable|string',
            'dimensions' => 'nullable|string',
            'warranty' => 'nullable|string',
            'care_instructions' => 'nullable|string',
            'is_featured' => 'nullable|boolean',
            'is_bestseller' => 'nullable|boolean',
            'is_new' => 'nullable|boolean',
            'status' => 'nullable|string|in:active,inactive,draft',
            'is_active' => 'nullable|boolean',
            'image_url' => 'nullable|string',
            'variants' => 'nullable|array',
            'variants.*.id' => 'nullable|integer',
            'variants.*.name' => 'required|string',
            'variants.*.color_name' => 'nullable|string',
            'variants.*.color_hex' => 'nullable|string',
            'variants.*.price' => 'nullable|numeric|min:0',
            'variants.*.stock' => 'nullable|integer|min:0',
            'variants.*.stock_quantity' => 'nullable|integer|min:0',
            'variants.*.image_url' => 'nullable|string',
        ]);

        if (isset($validated['is_active']) && !isset($validated['status'])) {
            $validated['status'] = $validated['is_active'] ? 'active' : 'inactive';
        }
        unset($validated['is_active']);

        $variants = $validated['variants'] ?? null;
        $imageUrl = $validated['image_url'] ?? null;
        unset($validated['variants'], $validated['image_url']);

        $product->update($validated);

        if (!empty($imageUrl)) {
            ProductImage::updateOrCreate(
                ['product_id' => $product->id, 'is_primary' => true],
                ['image_url' => $imageUrl, 'sort_order' => 0]
            );
        }

        // Sync Variants if provided
        if (is_array($variants)) {
            $keptVariantIds = [];
            foreach ($variants as $v) {
                $variantData = [
                    'name' => $v['name'],
                    'color_name' => $v['color_name'] ?? null,
                    'color_hex' => $v['color_hex'] ?? null,
                    'price' => $v['price'] ?? $product->price,
                    'stock_quantity' => $v['stock_quantity'] ?? $v['stock'] ?? 5,
                    'image_url' => $v['image_url'] ?? null,
                ];

                if (!empty($v['id'])) {
                    $existingVariant = ProductVariant::where('product_id', $product->id)->find($v['id']);
                    if ($existingVariant) {
                        $existingVariant->update($variantData);
                        $keptVariantIds[] = $existingVariant->id;
                        continue;
                    }
                }

                $newVariant = ProductVariant::create(array_merge($variantData, ['product_id' => $product->id]));
                $keptVariantIds[] = $newVariant->id;
            }

            // Remove deleted variants
            ProductVariant::where('product_id', $product->id)
                ->whereNotIn('id', $keptVariantIds)
                ->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông tin sản phẩm thành công!',
            'data' => $product->load(['category', 'variants', 'images']),
        ]);
    }

    /**
     * Delete a product
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa sản phẩm khỏi hệ thống!',
        ]);
    }

    /**
     * Get single product details
     */
    public function show($id)
    {
        $product = Product::with(['category', 'variants', 'images'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /**
     * Upload product image file to public storage
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,svg|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = 'product_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('products', $filename, 'public');

            return response()->json([
                'success' => true,
                'message' => 'Tải ảnh lên thành công!',
                'data' => [
                    'url' => asset('storage/' . $path),
                    'path' => '/storage/' . $path,
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Không tìm thấy file ảnh.',
        ], 400);
    }
}
