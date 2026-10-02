<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add fields to users table (Coins, Affiliate, Vendor Shop)
        Schema::table('users', function (Blueprint $table) {
            $table->integer('coins')->default(100)->after('role');
            $table->string('referral_code')->nullable()->unique()->after('coins');
            $table->foreignId('referred_by')->nullable()->constrained('users')->nullOnDelete()->after('referral_code');
            $table->string('shop_name')->nullable()->after('referred_by');
            $table->text('shop_description')->nullable()->after('shop_name');
            $table->string('shop_logo')->nullable()->after('shop_description');
            $table->decimal('shop_rating', 3, 2)->default(5.00)->after('shop_logo');
            $table->boolean('is_shop_active')->default(false)->after('shop_rating');
        });

        // 2. Add shop_id to products
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->constrained('users')->nullOnDelete()->after('collection_id');
        });

        // 3. Add shipping method, coins used, and referral code to orders
        Schema::table('orders', function (Blueprint $table) {
            $table->string('shipping_method')->default('standard')->after('shipping_district');
            $table->integer('coins_used')->default(0)->after('discount_amount');
            $table->decimal('coins_discount', 15, 2)->default(0)->after('coins_used');
            $table->string('referral_code')->nullable()->after('payment_status');
        });

        // 4. Affiliate Commissions Table
        Schema::create('affiliate_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->decimal('order_amount', 15, 2);
            $table->decimal('commission_rate', 5, 2)->default(5.00); // 5%
            $table->decimal('commission_amount', 15, 2);
            $table->string('status')->default('approved'); // 'pending', 'approved', 'paid', 'cancelled'
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affiliate_commissions');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['shipping_method', 'coins_used', 'coins_discount', 'referral_code']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shop_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('referred_by');
            $table->dropColumn([
                'coins',
                'referral_code',
                'shop_name',
                'shop_description',
                'shop_logo',
                'shop_rating',
                'is_shop_active',
            ]);
        });
    }
};
