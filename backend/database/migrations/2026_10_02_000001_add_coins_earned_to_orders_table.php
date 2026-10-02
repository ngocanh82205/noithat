<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Số GS Coins tích lũy đã cộng cho khách khi đơn hàng hoàn tất (dùng để chống cộng trùng & thu hồi khi hoàn tiền).
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->integer('coins_earned')->default(0)->after('coins_discount');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('coins_earned');
        });
    }
};
