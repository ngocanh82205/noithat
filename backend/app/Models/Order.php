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

    // Tích lũy: 1 GS Coin cho mỗi 100.000₫ giá trị thanh toán của đơn hoàn tất
    public const LOYALTY_VND_PER_COIN = 100000;

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
        'coins_earned',
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
        'coins_earned' => 'integer',
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

    public function loyaltyCoinsFor(): int
    {
        return (int) floor(max(0, (float) $this->total_amount) / self::LOYALTY_VND_PER_COIN);
    }

    /**
     * Đơn hoàn tất: cộng GS Coins tích lũy cho khách và mở khóa hoa hồng Affiliate (pending -> approved).
     * Idempotent nhờ cột coins_earned. Gọi trong transaction của nơi cập nhật trạng thái.
     */
    public function applyCompletionRewards(): void
    {
        if ($this->user_id && (int) $this->coins_earned === 0) {
            $coins = $this->loyaltyCoinsFor();
            if ($coins > 0) {
                User::where('id', $this->user_id)->increment('coins', $coins);
                $this->coins_earned = $coins;
            }
        }

        AffiliateCommission::where('order_id', $this->id)
            ->where('status', 'pending')
            ->update(['status' => 'approved']);
    }

    /**
     * Đơn hoàn tiền: thu hồi GS Coins đã tích lũy (không để âm) và hủy hoa hồng chưa chi trả.
     */
    public function revokeCompletionRewards(): void
    {
        if ($this->user_id && (int) $this->coins_earned > 0) {
            $user = User::where('id', $this->user_id)->lockForUpdate()->first();
            if ($user) {
                $user->decrement('coins', min((int) $user->coins, $this->coins_earned));
            }
            $this->coins_earned = 0;
        }

        AffiliateCommission::where('order_id', $this->id)
            ->whereIn('status', ['pending', 'approved'])
            ->update(['status' => 'cancelled']);
    }

    /**
     * Trả lại mọi thứ đơn hàng đã giữ khi đặt: tồn kho, suất Flash Sale, xu đã dùng, lượt voucher.
     * Dùng chung cho hủy đơn và hoàn tiền; chỉ gọi một lần cho mỗi đơn (đơn đã hủy thì đã trả rồi).
     */
    private function releaseReservedResources(): void
    {
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

        // Hoàn lại suất Flash Sale đã giữ (OrderController tăng sold_count cho mọi sản phẩm thuộc
        // Flash Sale đang chạy tại thời điểm đặt hàng)
        $flashSale = \App\Models\FlashSale::where('start_time', '<=', $this->created_at)
            ->where('end_time', '>=', $this->created_at)
            ->first();
        if ($flashSale) {
            foreach ($this->items as $item) {
                \App\Models\FlashSaleProduct::where('flash_sale_id', $flashSale->id)
                    ->where('product_id', $item->product_id)
                    ->where('sold_count', '>=', $item->quantity)
                    ->decrement('sold_count', $item->quantity);
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
    }

    public function canRefund(): bool
    {
        return $this->order_status !== self::STATUS_REFUNDED;
    }

    /**
     * Hoàn tiền: trả lại tài nguyên đã giữ (nếu đơn chưa bị hủy trước đó), thu hồi xu tích lũy & hoa hồng,
     * và đánh dấu trạng thái thanh toán là "refunded".
     */
    public function refund(string $reason = ''): bool
    {
        if (!$this->canRefund()) {
            return false;
        }

        DB::beginTransaction();
        try {
            if ($this->order_status !== self::STATUS_CANCELLED) {
                $this->releaseReservedResources();
            }

            $this->revokeCompletionRewards();

            $this->order_status = self::STATUS_REFUNDED;
            $this->payment_status = 'refunded';
            if ($reason !== '') {
                $this->notes = $this->notes . "\nHoàn tiền: {$reason}";
            }
            $this->save();

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            return false;
        }
    }

    public function cancel(string $reason = ''): bool
    {
        if (!$this->canCancel()) {
            return false;
        }

        DB::beginTransaction();
        try {
            $this->releaseReservedResources();

            // Update affiliate commission status if exists
            \App\Models\AffiliateCommission::where('order_id', $this->id)
                ->whereIn('status', ['pending', 'approved'])
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