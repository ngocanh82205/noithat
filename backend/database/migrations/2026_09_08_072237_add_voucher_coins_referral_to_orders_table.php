<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'voucher_code')) {
                $table->string('voucher_code')->nullable()->after('referral_code');
            }
            if (!Schema::hasColumn('orders', 'coins_used')) {
                $table->integer('coins_used')->default(0)->after('discount_amount');
            }
            if (!Schema::hasColumn('orders', 'coins_discount')) {
                $table->decimal('coins_discount', 15, 2)->default(0)->after('coins_used');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['voucher_code', 'coins_used', 'coins_discount']);
        });
    }
};