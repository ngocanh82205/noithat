<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('momo_request_id')->nullable()->after('tracking_code');
            $table->string('momo_order_id')->nullable()->after('momo_request_id');
            $table->string('momo_trans_id')->nullable()->after('momo_order_id');
            $table->string('momo_response_time')->nullable()->after('momo_trans_id');
            $table->string('momo_pay_type')->nullable()->after('momo_response_time');
            $table->string('momo_result_code')->nullable()->after('momo_pay_type');
            $table->text('momo_message')->nullable()->after('momo_result_code');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'momo_request_id',
                'momo_order_id',
                'momo_trans_id',
                'momo_response_time',
                'momo_pay_type',
                'momo_result_code',
                'momo_message',
            ]);
        });
    }
};