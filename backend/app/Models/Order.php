<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Order extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_SHIPPING = 'shipping';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_REFUNDED = 'refunded';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PROCESSING,
        self::STATUS_CONFIRMED,
        self::STATUS_SHIPPING,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
        self::STATUS_REFUNDED,
    ];

    protected $fillable = [
        'order_number',
        'user_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'shipping_address',
        'shipping_city',
        'shipping_district',
        'shipping_province_id',
        'shipping_district_id',
        'shipping_ward_code',
        'shipping_method',
        'notes',
        'subtotal',
        'shipping_fee',
        'discount_amount',
        'coins_used',
        'coins_discount',
        'total_amount',
        'payment_method',
        'payment_status',
        'referral_code',
        'voucher_code',
        'order_status',
        'tracking_code',
        'momo_request_id',
        'momo_order_id',
        'momo_trans_id',
        'momo_response_time',
        'momo_pay_type',
        'momo_result_code',
        'momo_message',
        'vnp_txn_ref',
        'vnp_transaction_no',
        'vnp_response_code',
        'vnp_bank_code',
        'vnp_pay_date',
        'vnp_card_type',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'shipping_fee' => 'float',
        'discount_amount' => 'float',
        'coins_discount' => 'float',
        'coins_used' => 'integer',
        'total_amount' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function canCancel(): bool
    {
        return in_array($this->order_status, [self::STATUS_PENDING, self::STATUS_PROCESSING, self::STATUS_CONFIRMED]);
    }

    public function cancel(string $reason = ''): bool
    {
        if (!$this->canCancel()) {
            return false;
        }

        DB::beginTransaction();
        try {
            // Restore stock for each item
            foreach ($this->items as $item) {
                if ($item->variant_id) {
                    \App\Models\ProductVariant::where('id', $item->variant_id)
                        ->increment('stock_quantity', $item->quantity);
                } else {
                    \App\Models\Product::where('id', $item->product_id)
                        ->increment('stock_quantity', $item->quantity);
                }
            }

            // Restore user coins if used
            if ($this->coins_used > 0 && $this->user_id) {
                $this->user()->increment('coins', $this->coins_used);
            }

            // Restore voucher usage if applicable
            $voucherUsage = \App\Models\VoucherUsage::where('order_id', $this->id)->first();
            if ($voucherUsage) {
                $voucherUsage->delete();
                \App\Models\Voucher::where('id', $voucherUsage->voucher_id)->decrement('used_count');
            }

            // Update affiliate commission status if exists
            \App\Models\AffiliateCommission::where('order_id', $this->id)
                ->where('status', 'approved')
                ->update(['status' => 'cancelled']);

            $this->update([
                'order_status' => self::STATUS_CANCELLED,
                'notes' => $this->notes . ($reason ? "\nLý do hủy: {$reason}" : ''),
            ]);

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            return false;
        }
    }
}