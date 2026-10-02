<x-mail::message>
# Xác nhận đơn hàng #{{ $order->order_number }}

Xin chào **{{ $order->customer_name }}**,

Cảm ơn bạn đã đặt hàng tại **GS Luxury**. Chúng tôi đã nhận được đơn hàng của bạn và đang xử lý.

## Thông tin đơn hàng
- **Mã đơn hàng:** {{ $order->order_number }}
- **Ngày đặt:** {{ $order->created_at->format('d/m/Y H:i') }}
- **Trạng thái:** {{ $order->order_status }}
- **Phương thức thanh toán:** {{ $order->payment_method }}
- **Phương thức giao hàng:** {{ $order->shipping_method }}

## Địa chỉ giao hàng
{{ $order->customer_name }}<br>
{{ $order->customer_phone }}<br>
{{ $order->shipping_address }}, {{ $order->shipping_city }}

## Chi tiết sản phẩm
@foreach ($order->items as $item)
- **{{ $item->product_name }}** {{ $item->variant_name ? '(' . $item->variant_name . ')' : '' }} × {{ $item->quantity }} = {{ number_format($item->total_price, 0, ',', '.') }} VNĐ
@endforeach

## Tóm tắt thanh toán
- **Tạm tính:** {{ number_format($order->subtotal, 0, ',', '.') }} VNĐ
- **Phí giao hàng:** {{ number_format($order->shipping_fee, 0, ',', '.') }} VNĐ
@if ($order->discount_amount > 0)
- **Giảm giá:** -{{ number_format($order->discount_amount, 0, ',', '.') }} VNĐ
@endif
@if ($order->coins_discount > 0)
- **Sử dụng Coins:** -{{ number_format($order->coins_discount, 0, ',', '.') }} VNĐ
@endif
- **Tổng cộng:** **{{ number_format($order->total_amount, 0, ',', '.') }} VNĐ**

<x-mail::button :url="$orderUrl">
Xem chi tiết đơn hàng
</x-mail::button>

Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua:
- Hotline: 024 1234 5678
- Email: support@gsluxury.vn

Trân trọng,<br>
**Đội ngũ GS Luxury**
</x-mail::message>