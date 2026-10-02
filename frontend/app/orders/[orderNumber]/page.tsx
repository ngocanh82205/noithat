"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  XCircle,
  RotateCcw,
  MapPin,
  CreditCard,
  Loader2,
  Phone,
  ExternalLink,
} from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import { useStore } from "@/components/StoreContext";
import { orderService, ApiOrder } from "@/services/api";
import { formatPrice } from "@/lib/products";

// Các bước giao hàng theo đúng trạng thái backend (Order::STATUSES)
const STEPS = [
  { key: "placed", label: "Đã Đặt Hàng", icon: Clock, statuses: ["pending", "processing"] },
  { key: "confirmed", label: "Đã Xác Nhận", icon: Package, statuses: ["confirmed"] },
  { key: "shipping", label: "Đang Giao & Lắp Đặt", icon: Truck, statuses: ["shipping"] },
  { key: "completed", label: "Hoàn Thành", icon: CheckCircle2, statuses: ["completed"] },
];

const CANCELLABLE_STATUSES = ["pending", "processing", "confirmed"];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng (VietQR)",
  vnpay: "VNPAY",
  momo: "Ví MoMo",
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  paid: { label: "Đã thanh toán", className: "bg-green-100 text-green-800" },
  refunded: { label: "Đã hoàn tiền", className: "bg-gray-200 text-gray-700" },
  failed: { label: "Thanh toán lỗi", className: "bg-red-100 text-red-800" },
  pending: { label: "Chưa thanh toán", className: "bg-amber-100 text-amber-800" },
  unpaid: { label: "Chưa thanh toán", className: "bg-amber-100 text-amber-800" },
};

const SHIPPING_METHOD_LABELS: Record<string, string> = {
  standard: "Vận chuyển tiêu chuẩn",
  express: "Giao hàng hỏa tốc",
  install_pro: "Giao & lắp đặt chuyên nghiệp",
};

// notes được backend nối thêm "Lý do hủy: ..." / "Hoàn tiền: ..." -> tách ra để hiển thị riêng
function extractNote(notes: string | undefined | null, prefix: string): string | null {
  if (!notes) return null;
  const line = notes.split("\n").find((l) => l.trim().startsWith(prefix));
  return line ? line.trim().slice(prefix.length).trim() || null : null;
}

function customerNote(notes: string | undefined | null): string | null {
  if (!notes) return null;
  const text = notes
    .split("\n")
    .filter((l) => !/^(Lý do hủy:|Hoàn tiền:)/.test(l.trim()))
    .join("\n")
    .trim();
  return text || null;
}

function formatDateTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

export default function OrderTrackingPage({ params }: { params: { orderNumber: string } }) {
  const orderNumber = decodeURIComponent(params.orderNumber);
  const { isAuthenticated, user, refreshProfile } = useStore();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await orderService.trackOrder(orderNumber);
      if (res.success && res.data) {
        setOrder(res.data);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    load();
  }, [load]);

  const status = order?.order_status || order?.status || "pending";
  const isCancelled = status === "cancelled";
  const isRefunded = status === "refunded";
  const currentStepIndex = STEPS.findIndex((s) => s.statuses.includes(status));
  const isOwner = Boolean(isAuthenticated && user && order?.user_id && Number(user.id) === Number(order.user_id));
  const canCancel = isOwner && CANCELLABLE_STATUSES.includes(status) && order?.payment_status !== "paid";

  const handleCancel = async () => {
    const reason = window.prompt(`Xác nhận hủy đơn ${orderNumber}? Lý do (không bắt buộc):`, "");
    if (reason === null) return;
    setCancelling(true);
    try {
      const res = await orderService.cancelOrder(orderNumber, reason.trim() || undefined);
      if (res.success) {
        await load();
        refreshProfile();
      } else {
        alert(res.message || "Không thể hủy đơn hàng.");
      }
    } finally {
      setCancelling(false);
    }
  };

  return (
    <main className="min-h-screen bg-beige">
      <SiteChrome>
        <section className="py-12 md:py-16 px-6">
          <div className="mx-auto max-w-4xl">
            <Link
              href={isAuthenticated ? "/account" : "/"}
              className="inline-flex items-center gap-2 text-xs tracking-widest2 uppercase text-espresso/60 hover:text-gold mb-6"
            >
              <ArrowLeft size={14} /> {isAuthenticated ? "Đơn hàng của tôi" : "Trang chủ"}
            </Link>

            {loading ? (
              <div className="bg-white/80 border border-espresso/10 p-16 text-center">
                <Loader2 className="mx-auto animate-spin text-gold mb-3" size={32} />
                <p className="text-xs text-espresso/60 tracking-wider">Đang tải thông tin đơn hàng...</p>
              </div>
            ) : notFound || !order ? (
              <div className="bg-white/80 border border-espresso/10 p-12 text-center">
                <XCircle className="mx-auto text-red-500 mb-3" size={40} strokeWidth={1.5} />
                <h1 className="font-serif text-2xl text-espresso mb-2">Không tìm thấy đơn hàng</h1>
                <p className="text-xs text-espresso/60">
                  Mã đơn <span className="font-mono font-semibold">{orderNumber}</span> không tồn tại hoặc đã bị xoá.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white/80 border border-espresso/10 p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] text-espresso/50 tracking-widest2 uppercase">Theo Dõi Đơn Hàng</p>
                      <h1 className="font-mono text-xl md:text-2xl font-semibold text-espresso mt-1">
                        {order.order_number}
                      </h1>
                      <p className="text-xs text-espresso/60 mt-1">Đặt lúc {formatDateTime(order.created_at)}</p>
                    </div>
                    {canCancel && (
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="self-start px-5 py-2.5 border border-red-300 text-red-700 text-xs tracking-wider uppercase hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {cancelling ? "Đang hủy..." : "Hủy Đơn Hàng"}
                      </button>
                    )}
                  </div>

                  {/* Trạng thái */}
                  {isCancelled || isRefunded ? (
                    <div
                      className={`mt-6 p-5 border flex items-start gap-3 ${
                        isCancelled ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-300"
                      }`}
                    >
                      {isCancelled ? (
                        <XCircle className="text-red-600 shrink-0 mt-0.5" size={22} />
                      ) : (
                        <RotateCcw className="text-gray-600 shrink-0 mt-0.5" size={22} />
                      )}
                      <div className="text-sm">
                        <p className={`font-semibold ${isCancelled ? "text-red-800" : "text-gray-800"}`}>
                          {isCancelled ? "Đơn hàng đã bị hủy" : "Đơn hàng đã được hoàn tiền"}
                        </p>
                        <p className="text-xs text-espresso/70 mt-1">
                          Cập nhật lúc {formatDateTime(order.updated_at)}.
                          {isCancelled && " Sản phẩm, mã giảm giá và GS Coins đã dùng đã được hoàn lại."}
                        </p>
                        {extractNote(order.notes, "Lý do hủy:") && (
                          <p className="text-xs text-espresso/80 mt-2">
                            <strong>Lý do hủy:</strong> {extractNote(order.notes, "Lý do hủy:")}
                          </p>
                        )}
                        {extractNote(order.notes, "Hoàn tiền:") && (
                          <p className="text-xs text-espresso/80 mt-2">
                            <strong>Ghi chú hoàn tiền:</strong> {extractNote(order.notes, "Hoàn tiền:")}
                          </p>
                        )}
                        {isCancelled && order.payment_status === "paid" && (
                          <p className="text-xs text-red-700 mt-2">
                            Đơn đã được thanh toán online — GS Luxury sẽ liên hệ để hoàn tiền cho quý khách.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <ol className="mt-8 grid grid-cols-4 gap-2">
                      {STEPS.map((step, i) => {
                        const done = i <= currentStepIndex;
                        const current = i === currentStepIndex;
                        const Icon = step.icon;
                        return (
                          <li key={step.key} className="relative flex flex-col items-center text-center">
                            {i > 0 && (
                              <span
                                className={`absolute top-5 right-1/2 w-full h-0.5 -z-0 ${
                                  i <= currentStepIndex ? "bg-gold" : "bg-espresso/10"
                                }`}
                              />
                            )}
                            <span
                              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                done ? "bg-gold border-gold text-white" : "bg-white border-espresso/15 text-espresso/30"
                              } ${current ? "ring-4 ring-gold/20" : ""}`}
                            >
                              <Icon size={18} />
                            </span>
                            <span
                              className={`mt-2 text-[11px] md:text-xs ${
                                done ? "text-espresso font-medium" : "text-espresso/40"
                              }`}
                            >
                              {step.label}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  {order.tracking_code && !isCancelled && (
                    <a
                      href={`https://donhang.ghn.vn/?order_code=${encodeURIComponent(order.tracking_code)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-2 text-xs text-gold hover:underline"
                    >
                      <Truck size={14} /> Mã vận đơn GHN: <span className="font-mono">{order.tracking_code}</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {/* Sản phẩm */}
                <div className="bg-white/80 border border-espresso/10 p-6 md:p-8">
                  <h2 className="font-serif text-lg text-espresso mb-4">Sản Phẩm</h2>
                  <div className="divide-y divide-espresso/5">
                    {order.items?.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative w-14 h-14 bg-beige/60 overflow-hidden shrink-0">
                            <Image
                              src={item.product_image || "/images/sofa-1.jpg"}
                              alt={item.product_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-serif text-sm text-espresso truncate">{item.product_name}</p>
                            {item.variant_name && (
                              <p className="text-[11px] text-espresso/60">Biến thể: {item.variant_name}</p>
                            )}
                            <p className="text-[11px] text-espresso/50">
                              SL: {item.quantity} × {formatPrice(item.price ?? item.unit_price)}
                            </p>
                          </div>
                        </div>
                        <span className="font-serif text-sm text-espresso shrink-0">
                          {formatPrice(item.total_price ?? item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-espresso/10 space-y-1.5 text-xs text-espresso/70">
                    <div className="flex justify-between">
                      <span>Tạm tính</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí vận chuyển & lắp đặt</span>
                      <span>{formatPrice(order.shipping_fee)}</span>
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Mã giảm giá</span>
                        <span>-{formatPrice(order.discount_amount)}</span>
                      </div>
                    )}
                    {(order.coins_discount ?? 0) > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>GS Coins ({order.coins_used} xu)</span>
                        <span>-{formatPrice(order.coins_discount ?? 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-espresso/10 text-sm text-espresso">
                      <span className="font-medium">Tổng thanh toán</span>
                      <span className="font-serif text-lg text-gold font-semibold">
                        {formatPrice(order.total_amount)}
                      </span>
                    </div>
                    {(order.coins_earned ?? 0) > 0 && (
                      <p className="text-right text-[11px] text-amber-700">
                        +{order.coins_earned} GS Coins tích lũy từ đơn này
                      </p>
                    )}
                  </div>
                </div>

                {/* Giao hàng & thanh toán */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/80 border border-espresso/10 p-6 text-xs text-espresso/80 space-y-2">
                    <h2 className="flex items-center gap-2 font-serif text-base text-espresso mb-2">
                      <MapPin size={16} className="text-gold" /> Giao Hàng
                    </h2>
                    <p className="font-medium text-espresso">{order.customer_name}</p>
                    <p>{order.customer_phone}</p>
                    <p>
                      {[order.shipping_address, order.shipping_district, order.shipping_city].filter(Boolean).join(", ")}
                    </p>
                    <p className="text-espresso/60">
                      {SHIPPING_METHOD_LABELS[(order as any).shipping_method] || "Vận chuyển tiêu chuẩn"}
                    </p>
                    {customerNote(order.notes) && (
                      <p className="text-espresso/60 italic">Ghi chú: {customerNote(order.notes)}</p>
                    )}
                  </div>

                  <div className="bg-white/80 border border-espresso/10 p-6 text-xs text-espresso/80 space-y-2">
                    <h2 className="flex items-center gap-2 font-serif text-base text-espresso mb-2">
                      <CreditCard size={16} className="text-gold" /> Thanh Toán
                    </h2>
                    <p>{PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}</p>
                    <span
                      className={`inline-block px-2.5 py-1 text-[11px] font-medium ${
                        (PAYMENT_STATUS_LABELS[order.payment_status] || PAYMENT_STATUS_LABELS.pending).className
                      }`}
                    >
                      {(PAYMENT_STATUS_LABELS[order.payment_status] || PAYMENT_STATUS_LABELS.pending).label}
                    </span>
                  </div>
                </div>

                <p className="text-center text-xs text-espresso/50 flex items-center justify-center gap-2">
                  <Phone size={13} className="text-gold" /> Cần hỗ trợ? Hotline 1900 8888
                </p>
              </div>
            )}
          </div>
        </section>
      </SiteChrome>
    </main>
  );
}
