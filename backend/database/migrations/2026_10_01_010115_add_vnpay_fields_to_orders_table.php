<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('vnp_txn_ref')->nullable()->after('momo_message');
            $table->string('vnp_transaction_no')->nullable()->after('vnp_txn_ref');
            $table->string('vnp_response_code')->nullable()->after('vnp_transaction_no');
            $table->string('vnp_bank_code')->nullable()->after('vnp_response_code');
            $table->string('vnp_pay_date')->nullable()->after('vnp_bank_code');
            $table->string('vnp_card_type')->nullable()->after('vnp_pay_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'vnp_txn_ref',
                'vnp_transaction_no',
                'vnp_response_code',
                'vnp_bank_code',
                'vnp_pay_date',
                'vnp_card_type',
            ]);
        });
    }
};
