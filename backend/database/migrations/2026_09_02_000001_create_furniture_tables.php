<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Categories (Living Room, Bedroom, Dining Room, Sofa, Table, Lighting...)
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->string('icon')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // 2. Collections (Nordic Essence, Imperial Gold, Modern Minimalist...)
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('subtitle')->nullable();
            $table->text('description')->nullable();
            $table->string('banner_image')->nullable();
            $table->string('room_type')->nullable(); // 'living_room', 'bedroom', 'dining', etc.
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
        });

        // 3. Products
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('sku')->unique();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('collection_id')->nullable()->constrained('collections')->nullOnDelete();
            $table->text('summary')->nullable();
            $table->longText('description')->nullable();
            $table->decimal('price', 15, 2);
            $table->decimal('original_price', 15, 2)->nullable();
            $table->string('material')->nullable(); // Gỗ sồi, Da bò Ý, Đá Marble...
            $table->string('dimensions')->nullable(); // W: 220cm x D: 95cm x H: 80cm
            $table->string('warranty')->default('24 tháng');
            $table->text('care_instructions')->nullable();
            $table->boolean('in_stock')->default(true);
            $table->integer('stock_quantity')->default(10);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_new')->default(false);
            $table->boolean('is_bestseller')->default(false);
            $table->decimal('rating_avg', 3, 2)->default(5.00);
            $table->integer('rating_count')->default(0);
            $table->string('status')->default('active'); // 'active', 'inactive', 'draft'
            $table->timestamps();
        });

        // 4. Product Images
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('image_url');
            $table->string('alt_text')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // 5. Product Variants (Color, Size, Material differences)
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name'); // e.g. "Cognac Leather / 3-Seater"
            $table->string('sku')->nullable();
            $table->string('color_name')->nullable(); // "Cognac", "Charcoal", "Cream"
            $table->string('color_hex')->nullable(); // "#8B4513"
            $table->string('material')->nullable();
            $table->string('size')->nullable(); // "2m2", "1m8"
            $table->decimal('price', 15, 2)->nullable();
            $table->integer('stock_quantity')->default(5);
            $table->string('image_url')->nullable();
            $table->timestamps();
        });

        // 6. Lookbooks / "Shop The Room"
        Schema::create('lookbooks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('subtitle')->nullable();
            $table->text('description')->nullable();
            $table->string('space_type')->nullable(); // 'living_room', 'dining_room', 'bedroom'
            $table->string('image_url');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 7. Lookbook Hotspot Items
        Schema::create('lookbook_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lookbook_id')->constrained('lookbooks')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('x_position', 5, 2); // Percentage (0.00 to 100.00)
            $table->decimal('y_position', 5, 2); // Percentage (0.00 to 100.00)
            $table->string('note')->nullable();
            $table->timestamps();
        });

        // 8. Cart Items
        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('session_id')->nullable()->index();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->integer('quantity')->default(1);
            $table->timestamps();
        });

        // 9. Orders
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            $table->string('shipping_address');
            $table->string('shipping_city')->default('Hà Nội');
            $table->string('shipping_district')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('subtotal', 15, 2);
            $table->decimal('shipping_fee', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2);
            $table->string('payment_method')->default('cod'); // 'cod', 'bank_transfer', 'vnpay', 'momo'
            $table->string('payment_status')->default('pending'); // 'pending', 'paid', 'failed'
            $table->string('order_status')->default('processing'); // 'processing', 'confirmed', 'shipping', 'completed', 'cancelled'
            $table->string('tracking_code')->nullable();
            $table->timestamps();
        });

        // 10. Order Items
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->string('product_name');
            $table->string('variant_name')->nullable();
            $table->string('product_image')->nullable();
            $table->decimal('price', 15, 2);
            $table->integer('quantity')->default(1);
            $table->decimal('total_price', 15, 2);
            $table->timestamps();
        });

        // 11. Consultations (Home Design Appointment / Custom Furniture Request)
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->date('preferred_date')->nullable();
            $table->string('space_type')->nullable(); // 'Căn hộ chung cư', 'Biệt thự / Villa', 'Nhà phố', 'Văn phòng / Penthouse'
            $table->string('budget_range')->nullable(); // '< 100 triệu', '100 - 300 triệu', '300 - 500 triệu', '> 500 triệu'
            $table->text('message')->nullable();
            $table->string('status')->default('new'); // 'new', 'contacted', 'survey_scheduled', 'completed', 'cancelled'
            $table->timestamps();
        });

        // 12. Reviews
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_name');
            $table->integer('rating')->default(5);
            $table->string('title')->nullable();
            $table->text('comment');
            $table->boolean('is_verified_purchase')->default(true);
            $table->boolean('is_approved')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('consultations');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('lookbook_items');
        Schema::dropIfExists('lookbooks');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
        Schema::dropIfExists('collections');
        Schema::dropIfExists('categories');
    }
};
