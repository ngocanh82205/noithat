"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Truck,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  X,
  CreditCard,
} from "lucide-react";
import { adminService, ApiOrder } from "@/services/api";
import { formatPrice } from "@/lib/products";

const STATUS_TABS = [
  { key: "all", label: "Tất Cả" },
  { key: "pending", label: "Chờ Xác Nhận" },
  { key: "confirmed", label: "Đã Xác Nhận" },
  { key: "shipping", label: "Đang Giao" },
  { key: "completed", label: "Hoàn Thành" },
  { key: "cancelled", label: "Đã Hủy" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  // Modal State for Order Detail & Status Update
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadOrders = () => {
    setLoading(true);
    adminService
      .getOrders({
        status: activeTab !== "all" ? activeTab : undefined,
        q: search || undefined,
      })
      .then((res) => {
        if (res.success && res.data) {
          setOrders(res.data);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const handleUpdateStatus = async (status: string, paymentStatus?: string) => {
    if (!selectedOrder) return;
    setUpdating(true);

    try {
      const res = await adminService.updateOrderStatus(selectedOrder.id, {
        status,
        payment_status: paymentStatus || selectedOrder.payment_status,
      });

      if (res.success && res.data) {
        setSelectedOrder(res.data);
        loadOrders();
      }
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật trạng thái đơn hàng");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl text-champagne flex items-center gap-2.5">
            <ShoppingBag className="text-gold" size={26} /> Quản Lý Đơn Hàng ({orders.length})
          </h1>
          <p className="text-xs text-beige/60 tracking-wider mt-1">
            Xử lý quy trình đơn hàng, đóng gói, phân công giao hàng và thanh toán
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs tracking-wider uppercase transition-all whitespace-nowrap font-medium ${
                activeTab === tab.key
                  ? "bg-gold text-charcoal shadow-md"
                  : "bg-charcoal text-beige/70 hover:bg-white/5 hover:text-gold border border-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 bg-charcoal px-4 py-3 border border-white/10 rounded-xl">
          <Search size={16} className="text-beige/40" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn (#GSL-...), tên khách, số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-beige outline-none flex-1"
          />
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-charcoal border border-white/10 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-16 text-center text-xs text-beige/50">
            Đang tải dữ liệu đơn hàng...
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-beige/40 border-b border-white/10 bg-black/30">
                  <th className="p-4">Mã Đơn Hàng</th>
                  <th className="p-4">Ngày Đặt</th>
                  <th className="p-4">Khách Hàng</th>
                  <th className="p-4">Sản Phẩm</th>
                  <th className="p-4">Tổng Thanh Toán</th>
                  <th className="p-4">Thanh Toán</th>
                  <th className="p-4">Trạng Thái</th>
                  <th className="p-4 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-gold font-bold">
                      #{order.order_number}
                    </td>
                    <td className="p-4 text-beige/60">
                      {new Date(order.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-champagne">{order.customer_name}</p>
                      <span className="text-[11px] text-beige/50">{order.customer_phone}</span>
                    </td>
                    <td className="p-4 text-beige/70">
                      {order.items?.length || 1} sản phẩm
                    </td>
                    <td className="p-4 font-serif text-sm text-gold font-semibold">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          order.payment_status === "paid"
                            ? "bg-green-900/40 text-green-400"
                            : "bg-yellow-900/40 text-yellow-400"
                        }`}
                      >
                        {order.payment_status === "paid" ? "Đã Thanh Toán" : "Chưa Trả"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          order.status === "completed"
                            ? "bg-green-900/40 text-green-400"
                            : order.status === "shipping"
                            ? "bg-blue-900/40 text-blue-400"
                            : order.status === "confirmed"
                            ? "bg-purple-900/40 text-purple-400"
                            : order.status === "cancelled"
                            ? "bg-red-900/40 text-red-400"
                            : "bg-yellow-900/40 text-yellow-400"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-gold hover:text-charcoal transition-colors rounded text-xs font-medium flex items-center gap-1.5 ml-auto"
                      >
                        <Eye size={13} /> Xem Đơn
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-beige/40">
            Không có đơn hàng nào trong mục này.
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-espresso border border-gold/30 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 text-beige shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="font-serif text-2xl text-champagne">
                  Chi Tiết Đơn Hàng #{selectedOrder.order_number}
                </h2>
                <span className="text-xs text-beige/50">
                  Đặt ngày {new Date(selectedOrder.created_at).toLocaleString("vi-VN")}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-beige/50 hover:text-beige"
              >
                <X size={22} />
              </button>
            </div>

            {/* Quick 1-Click Status Controls */}
            <div className="bg-charcoal p-4 rounded-lg border border-white/10 space-y-3">
              <span className="text-[11px] uppercase tracking-widest2 text-gold font-semibold block">
                Cập Nhật Trạng Thái Giao Hàng &amp; Thanh Toán:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleUpdateStatus("confirmed")}
                  disabled={updating || selectedOrder.status === "confirmed"}
                  className="px-3.5 py-2 bg-purple-900/40 hover:bg-purple-800 text-purple-200 text-xs rounded font-medium flex items-center gap-1.5 disabled:opacity-40"
                >
                  <CheckCircle2 size={14} /> 1. Xác Nhận Đơn
                </button>
                <button
                  onClick={() => handleUpdateStatus("shipping")}
                  disabled={updating || selectedOrder.status === "shipping"}
                  className="px-3.5 py-2 bg-blue-900/40 hover:bg-blue-800 text-blue-200 text-xs rounded font-medium flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Truck size={14} /> 2. Đang Giao Hàng
                </button>
                <button
                  onClick={() => handleUpdateStatus("completed", "paid")}
                  disabled={updating || selectedOrder.status === "completed"}
                  className="px-3.5 py-2 bg-green-900/40 hover:bg-green-800 text-green-200 text-xs rounded font-medium flex items-center gap-1.5 disabled:opacity-40"
                >
                  <CheckCircle2 size={14} /> 3. Hoàn Thành &amp; Đã Thu Tiền
                </button>
                <button
                  onClick={() => handleUpdateStatus("cancelled")}
                  disabled={updating || selectedOrder.status === "cancelled"}
                  className="px-3.5 py-2 bg-red-900/40 hover:bg-red-800 text-red-200 text-xs rounded font-medium flex items-center gap-1.5 disabled:opacity-40"
                >
                  <XCircle size={14} /> Hủy Đơn
                </button>
              </div>
            </div>

            {/* Customer & Delivery Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-charcoal p-4 rounded-lg border border-white/5 space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-beige/50 font-semibold block">
                  Người Nhận Hàng
                </span>
                <p className="font-serif text-base text-champagne font-medium">
                  {selectedOrder.customer_name}
                </p>
                <p className="text-beige/70 flex items-center gap-2">
                  <Phone size={13} className="text-gold" /> {selectedOrder.customer_phone}
                </p>
                <p className="text-beige/70 flex items-center gap-2">
                  <Mail size={13} className="text-gold" /> {selectedOrder.customer_email}
                </p>
              </div>

              <div className="bg-charcoal p-4 rounded-lg border border-white/5 space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-beige/50 font-semibold block">
                  Địa Chỉ Giao Hàng &amp; Ghi Chú
                </span>
                <p className="text-beige/80 flex items-start gap-2">
                  <MapPin size={15} className="text-gold shrink-0 mt-0.5" />
                  <span>
                    {selectedOrder.shipping_address}, {selectedOrder.shipping_district},{" "}
                    {selectedOrder.shipping_city}
                  </span>
                </p>
                {selectedOrder.notes && (
                  <p className="text-[11px] text-gold italic pt-1">
                    Ghi chú: {selectedOrder.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Order Items Table */}
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-wider text-beige/60 font-semibold block">
                Danh Sách Sản Phẩm Đặt Mua
              </span>
              <div className="bg-charcoal border border-white/10 rounded-lg overflow-hidden divide-y divide-white/5">
                {selectedOrder.items?.map((item) => {
                  const img =
                    item.product?.images?.[0]?.image_url || item.product_image || "/images/sofa-1.jpg";

                  return (
                    <div key={item.id} className="p-3.5 flex items-center gap-4 text-xs">
                      <div className="relative w-14 h-14 rounded overflow-hidden bg-black/60 shrink-0 border border-white/10">
                        <Image src={img} alt={item.product_name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-sm text-champagne font-medium truncate">
                          {item.product_name}
                        </h4>
                        {item.variant_name && (
                          <p className="text-[11px] text-gold">{item.variant_name}</p>
                        )}
                        <p className="text-beige/50 text-[11px]">
                          Số lượng: {item.quantity} × {formatPrice(item.unit_price ?? item.price ?? 0)}
                        </p>
                      </div>
                      <div className="text-right font-serif text-sm text-gold font-semibold">
                        {formatPrice(item.subtotal || item.total_price || ((item.unit_price ?? item.price ?? 0) * item.quantity))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Calculation Breakdown */}
            <div className="pt-4 border-t border-white/10 flex justify-between items-baseline text-sm">
              <span className="font-serif text-base text-beige">Tổng Giá Trị Đơn Hàng:</span>
              <span className="font-serif text-2xl text-gold font-bold">
                {formatPrice(selectedOrder.total_amount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
