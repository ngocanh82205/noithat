<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('shipping_province_id')->nullable()->after('shipping_district');
            $table->unsignedBigInteger('shipping_district_id')->nullable()->after('shipping_province_id');
            $table->string('shipping_ward_code')->nullable()->after('shipping_district_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['shipping_province_id', 'shipping_district_id', 'shipping_ward_code']);
        });
    }
};
