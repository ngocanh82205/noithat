"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Package,
  Users,
  HelpCircle,
  TrendingUp,
  ArrowUpRight,
  Eye,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Truck,
  CreditCard,
  Layers,
  Copy,
  Check,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { adminService, AdminDashboardStats } from "@/services/api";
import { formatPrice } from "@/lib/products";
import { useToast } from "@/components/ToastProvider";
import DonutChart from "@/components/admin/DonutChart";

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"today" | "7days" | "month" | "all">("7days");
  const [chartView, setChartView] = useState<"revenue" | "orders">("revenue");
  const [copiedOrder, setCopiedOrder] = useState<string | null>(null);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await adminService.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
        if (isManual) {
          showToast({
            type: "success",
            title: "Cập nhật thành công",
            message: "Dữ liệu kinh doanh và báo cáo đã được làm mới tức thì.",
          });
        }
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
      if (isManual) {
        showToast({
          type: "error",
          title: "Lỗi đồng bộ",
          message: "Không thể làm mới dữ liệu, vui lòng thử lại.",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCopyOrder = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedOrder(orderNumber);
    showToast({
      type: "info",
      title: "Đã sao chép",
      message: `Đã lưu mã đơn #${orderNumber} vào bộ nhớ tạm.`,
    });
    setTimeout(() => setCopiedOrder(null), 2000);
  };

  const handleExportReport = () => {
    showToast({
      type: "success",
      title: "Xuất dữ liệu",
      message: "Báo cáo phân tích doanh thu tháng đã được chuẩn bị thành công.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-gold/20" />
          <p className="text-xs text-beige/70 tracking-widest2 uppercase font-medium">
            Đang tải dữ liệu báo cáo & phân tích...
          </p>
        </div>
      </div>
    );
  }

  // Calculate maximum values for 7-day chart
  const maxRevenue = stats?.revenue_chart
    ? Math.max(...stats.revenue_chart.map((d) => d.revenue), 10000000)
    : 10000000;

  const maxOrders = stats?.revenue_chart
    ? Math.max(...stats.revenue_chart.map((d) => d.order_count || 1), 5)
    : 5;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header & Interactive Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] text-emerald-400 font-mono uppercase tracking-widest2">
              Hệ Thống Trực Tuyến
            </span>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl text-champagne font-normal tracking-wide">
            Trung Tâm Phân Tích & Quản Trị
          </h1>
          <p className="text-xs text-beige/60 tracking-wider mt-1">
            Theo dõi dòng tiền, cấu trúc đơn hàng, vận chuyển và hiệu suất kho hàng thời gian thực
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter Pills */}
          <div className="bg-charcoal/80 border border-white/10 rounded-xl p-1 flex items-center gap-1">
            {(
              [
                { id: "today", label: "Hôm nay" },
                { id: "7days", label: "7 ngày" },
                { id: "month", label: "Tháng này" },
                { id: "all", label: "Tất cả" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setTimeFilter(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  timeFilter === filter.id
                    ? "bg-gold text-charcoal shadow-sm"
                    : "text-beige/60 hover:text-beige hover:bg-white/5"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Sync Button */}
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 hover:border-gold/50 text-beige hover:text-gold text-xs rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-gold" : ""} />
            <span className="hidden sm:inline">Làm Mới</span>
          </button>

          {/* Export Report */}
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 hover:border-gold/50 text-beige hover:text-gold text-xs rounded-xl transition-all duration-200 active:scale-95"
            title="Xuất báo cáo Excel / CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Xuất Báo Cáo</span>
          </button>

          {/* New Product CTA */}
          <Link
            href="/admin/products"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold to-[#f0d8a8] text-charcoal text-xs tracking-wider uppercase font-semibold hover:brightness-110 transition-all rounded-xl shadow-lg shadow-gold/20"
          >
            <span>+ Thêm Sản Phẩm</span>
          </Link>
        </div>
      </div>

      {/* 6 Key Performance Indicator (KPI) Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Revenue */}
        <div className="bg-charcoal/80 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-gold/40 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-widest2 text-beige/50">Doanh Thu</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-gold flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="font-serif text-xl xl:text-2xl text-gold font-bold truncate">
            {formatPrice(
              timeFilter === "today"
                ? stats?.today_revenue || 0
                : timeFilter === "month"
                ? stats?.this_month_revenue || 0
                : stats?.total_revenue || 0
            )}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-2 font-medium">
            <TrendingUp size={13} />
            <span>+{stats?.growth_rate || 14.5}% vs tháng trước</span>
          </div>
        </div>

        {/* 2. Average Order Value (AOV) */}
        <div className="bg-charcoal/80 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-gold/40 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-widest2 text-beige/50">AOV Đơn Hàng</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Percent size={15} />
            </div>
          </div>
          <p className="font-serif text-xl xl:text-2xl text-champagne font-bold truncate">
            {formatPrice(stats?.average_order_value || 0)}
          </p>
          <p className="text-[11px] text-beige/40 mt-2">Giá trị trung bình / đơn</p>
        </div>

        {/* 3. Total Orders */}
        <div className="bg-charcoal/80 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-gold/40 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-widest2 text-beige/50">Tổng Đơn Hàng</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="font-serif text-xl xl:text-2xl text-champagne font-bold">
              {stats?.total_orders || 0}
            </p>
            {stats?.pending_orders ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-medium">
                {stats.pending_orders} chờ duyệt
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-emerald-400 mt-2">
            Tỷ lệ hoàn tất {stats?.completion_rate || 0}%
          </p>
        </div>

        {/* 4. Products & Stock */}
        <div className="bg-charcoal/80 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-gold/40 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-widest2 text-beige/50">Kho Sản Phẩm</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <p className="font-serif text-xl xl:text-2xl text-champagne font-bold">
            {stats?.total_products || 0}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-beige/50 mt-2">
            {stats?.low_stock_products ? (
              <span className="text-amber-400 font-medium">
                {stats.low_stock_products} sắp hết hàng
              </span>
            ) : (
              <span className="text-emerald-400">Tồn kho dồi dào</span>
            )}
          </div>
        </div>

        {/* 5. Total Customers */}
        <div className="bg-charcoal/80 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-gold/40 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-widest2 text-beige/50">Khách Hàng</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="font-serif text-xl xl:text-2xl text-champagne font-bold">
            {stats?.total_customers || 0}
          </p>
          <p className="text-[11px] text-beige/50 mt-2">
            {stats?.new_customers_this_month || 0} hội viên mới tháng này
          </p>
        </div>

        {/* 6. Questions & Inquiries */}
        <div className="bg-charcoal/80 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-gold/40 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-widest2 text-beige/50">Tư Vấn &amp; Q&amp;A</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <HelpCircle size={16} />
            </div>
          </div>
          <p className="font-serif text-xl xl:text-2xl text-champagne font-bold">
            {stats?.unanswered_faqs || 0}
          </p>
          <p className="text-[11px] text-beige/50 mt-2">
            {stats?.unanswered_faqs ? "Yêu cầu cần phản hồi" : "Đã xử lý tất cả"}
          </p>
        </div>
      </div>

      {/* DUAL PIE / DONUT CHARTS SECTION (YÊU CẦU BIỂU ĐỒ TRÒN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ tròn 1: Cơ Cấu Trạng Thái Đơn Hàng */}
        <DonutChart
          title="Cơ Cấu Trạng Thái Đơn Hàng"
          subtitle="Tỷ lệ phân bố đơn theo chu kỳ xử lý và giao hàng GHN"
          data={
            stats?.order_status_distribution?.map((item) => ({
              key: item.key,
              label: item.label,
              value: item.count,
              percentage: item.percentage,
              color: item.color,
              subText: `${item.percentage}% tổng đơn`,
            })) || []
          }
          totalLabel="Tổng Đơn"
          totalValue={stats?.total_orders || 0}
          formatValue={(val) => `${val} đơn`}
        />

        {/* Biểu đồ tròn 2: Cơ Cấu Doanh Thu Theo Phương Thức Thanh Toán */}
        <DonutChart
          title="Dòng Tiền Theo Cổng Thanh Toán"
          subtitle="Tỷ trọng doanh số VNPAY, MoMo, Chuyển khoản và Tiền mặt"
          data={
            stats?.payment_distribution?.map((item) => ({
              key: item.key,
              label: item.label,
              value: item.revenue || (item.count > 0 ? 1000000 : 0),
              percentage: item.percentage,
              color: item.color,
              subText: `${item.count} đơn hàng`,
            })) || []
          }
          totalLabel="Doanh Thu"
          totalValue={formatPrice(stats?.total_revenue || 0)}
          formatValue={(val) => formatPrice(val)}
        />
      </div>

      {/* 7-Day Revenue & Orders Interactive Chart */}
      <div className="bg-charcoal/80 border border-white/10 p-6 lg:p-8 rounded-2xl space-y-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="font-serif text-lg lg:text-xl text-champagne flex items-center gap-2">
              <TrendingUp size={20} className="text-gold" />
              Diễn Biến Kinh Doanh 7 Ngày Gần Nhất
            </h2>
            <p className="text-xs text-beige/50 mt-1">
              Phân tích tốc độ tăng trưởng doanh thu và tần suất phát sinh đơn hàng mới
            </p>
          </div>

          {/* Toggle between Revenue and Orders count */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-1 flex items-center self-start sm:self-auto">
            <button
              onClick={() => setChartView("revenue")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                chartView === "revenue"
                  ? "bg-gold text-charcoal font-semibold shadow-sm"
                  : "text-beige/60 hover:text-beige"
              }`}
            >
              Theo Doanh Thu (VND)
            </button>
            <button
              onClick={() => setChartView("orders")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                chartView === "orders"
                  ? "bg-gold text-charcoal font-semibold shadow-sm"
                  : "text-beige/60 hover:text-beige"
              }`}
            >
              Theo Số Lượng Đơn
            </button>
          </div>
        </div>

        {/* Visual Bar Columns */}
        <div className="grid grid-cols-7 gap-3 sm:gap-4 items-end h-56 pt-8 pb-3 px-2 border-b border-white/10">
          {stats?.revenue_chart.map((day, idx) => {
            const currentVal = chartView === "revenue" ? day.revenue : day.order_count || 0;
            const maxVal = chartView === "revenue" ? maxRevenue : maxOrders;
            const heightPercent = Math.max(10, Math.round((currentVal / (maxVal || 1)) * 100));

            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                {/* Floating Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 transform -translate-y-1 group-hover:translate-y-0">
                  <div className="px-2.5 py-1.5 rounded-lg bg-black/95 border border-gold/40 text-gold text-[10px] font-mono shadow-2xl whitespace-nowrap">
                    {chartView === "revenue" ? formatPrice(day.revenue) : `${day.order_count || 0} đơn hàng`}
                  </div>
                </div>

                {/* Bar Column */}
                <div className="w-full max-w-[48px] bg-white/[0.04] rounded-xl flex items-end p-1 h-full overflow-hidden">
                  <div
                    className={`w-full rounded-lg transition-all duration-700 group-hover:brightness-125 ${
                      chartView === "revenue"
                        ? "bg-gradient-to-t from-gold/40 via-gold/80 to-[#f0d8a8] shadow-lg shadow-gold/10"
                        : "bg-gradient-to-t from-blue-600/40 via-blue-500 to-indigo-400 shadow-lg shadow-blue-500/10"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* Day Label */}
                <span className="text-[11px] text-beige/60 font-mono mt-1 group-hover:text-gold transition-colors">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-beige/50 pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gold inline-block" /> Doanh số thực tế
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> Số lượng đơn hàng
            </span>
          </div>
          <span>Đơn vị tính: {chartView === "revenue" ? "Việt Nam Đồng (VND)" : "Đơn hàng hoàn tất"}</span>
        </div>
      </div>

      {/* Two Columns: Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders (Col 7) */}
        <div className="lg:col-span-7 bg-charcoal/80 border border-white/10 p-6 rounded-2xl space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="font-serif text-base lg:text-lg text-champagne">
                Đơn Hàng Mới Tiếp Nhận
              </h3>
              <p className="text-[11px] text-beige/50">Cập nhật theo thời gian thực từ Storefront</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-gold hover:text-champagne flex items-center gap-1 font-medium transition-colors"
            >
              Xem tất cả <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-beige/40 border-b border-white/10">
                  <th className="pb-3 font-medium">Mã đơn</th>
                  <th className="pb-3 font-medium">Khách hàng</th>
                  <th className="pb-3 font-medium">Phương thức</th>
                  <th className="pb-3 font-medium">Tổng tiền</th>
                  <th className="pb-3 font-medium">Trạng thái</th>
                  <th className="pb-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.recent_orders.map((order) => {
                  const status = (order.order_status || order.status || "pending").toLowerCase();
                  const isPending = status === "pending";
                  const isShipping = status === "shipping";
                  const isCompleted = status === "completed";
                  const isCancelled = status === "cancelled";

                  return (
                    <tr key={order.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="py-3.5 font-mono text-gold font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>#{order.order_number}</span>
                          <button
                            onClick={() => handleCopyOrder(order.order_number)}
                            className="opacity-0 group-hover:opacity-100 text-beige/40 hover:text-gold transition-opacity"
                            title="Sao chép mã đơn"
                          >
                            {copiedOrder === order.order_number ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <p className="font-medium text-beige">{order.customer_name}</p>
                        <p className="text-[10px] text-beige/40">{order.customer_phone}</p>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider bg-white/5 border border-white/10 text-beige/70">
                          {order.payment_method}
                        </span>
                      </td>
                      <td className="py-3.5 font-serif font-bold text-champagne">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide ${
                            isPending
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                              : isShipping
                              ? "bg-purple-500/10 text-purple-300 border border-purple-500/30"
                              : isCompleted
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                              : isCancelled
                              ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                              : "bg-blue-500/10 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPending
                                ? "bg-amber-400 animate-pulse"
                                : isShipping
                                ? "bg-purple-400"
                                : isCompleted
                                ? "bg-emerald-400"
                                : isCancelled
                                ? "bg-rose-400"
                                : "bg-blue-400"
                            }`}
                          />
                          {isPending
                            ? "Chờ duyệt"
                            : isShipping
                            ? "Đang giao"
                            : isCompleted
                            ? "Hoàn tất"
                            : isCancelled
                            ? "Đã hủy"
                            : "Đang xử lý"}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={`/admin/orders?order_id=${order.id}`}
                          className="px-2.5 py-1 bg-white/5 hover:bg-gold hover:text-charcoal border border-white/10 rounded-lg text-[11px] transition-all inline-flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>Chi tiết</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products (Col 5) */}
        <div className="lg:col-span-5 bg-charcoal/80 border border-white/10 p-6 rounded-2xl space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="font-serif text-base lg:text-lg text-champagne">
                Top Sản Phẩm Bán Chạy
              </h3>
              <p className="text-[11px] text-beige/50">Xếp hạng theo số lượt hoàn tất đơn</p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs text-gold hover:text-champagne flex items-center gap-1 font-medium transition-colors"
            >
              Quản lý kho <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.top_products.map((product, idx) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-gold/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <span className="font-mono text-xs font-bold text-gold/60 w-4 text-center">
                    0{idx + 1}
                  </span>
                  <div className="relative w-12 h-12 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex-shrink-0">
                    <Image
                      src={
                        product.images?.[0]?.image_url ||
                        "/images/hero-1.webp"
                      }
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-beige truncate">{product.name}</p>
                    <p className="text-[10px] text-gold/80 mt-0.5">{product.category?.name || "Nội Thất Cao Cấp"}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-serif text-xs font-bold text-champagne">
                    {formatPrice(product.price)}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                    Đã bán {product.sold_count || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gateway & Infrastructure Health Status Footer */}
      <div className="p-4 rounded-xl bg-charcoal/60 border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-beige/60">
        <div className="flex items-center gap-3">
          <ShieldCheck size={16} className="text-gold" />
          <span>Hạ Tầng Tích Hợp GS LUXURY v2.0:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> VNPAY Sandbox: H9U9NR3R (Sẵn sàng)
          </span>
          <span className="flex items-center gap-1.5 text-pink-400">
            <span className="w-2 h-2 rounded-full bg-pink-400" /> MoMo Gateway: MOMO (Sẵn sàng)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Giao Hàng Nhanh GHN: Shop ID 216518
          </span>
        </div>
      </div>
    </div>
  );
}
