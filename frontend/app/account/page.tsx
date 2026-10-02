"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  LogOut,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Gift,
  Sparkles,
  Store,
  Copy,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Coins,
  XCircle,
  RotateCcw,
} from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import { useStore } from "@/components/StoreContext";
import {
  orderService,
  authService,
  affiliateService,
  vendorService,
  AffiliateStats,
  VendorShopStats,
} from "@/services/api";
import { formatPrice } from "@/lib/products";

export default function AccountPage() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    logoutUser,
    openAuth,
    refreshProfile,
    userCoins,
    openWheel,
    openAffiliate,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    "orders" | "coins" | "affiliate" | "shop" | "profile"
  >("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

  // Khách tự hủy đơn khi đơn còn ở trạng thái chờ / đang xử lý / đã xác nhận (đồng bộ với Order::canCancel)
  const CANCELLABLE_STATUSES = ["pending", "processing", "confirmed"];

  const handleCancelOrder = async (orderNumber: string) => {
    const reason = window.prompt(
      `Xác nhận hủy đơn ${orderNumber}? Vui lòng cho biết lý do (không bắt buộc):`,
      ""
    );
    if (reason === null) return;

    setCancellingOrder(orderNumber);
    try {
      const res = await orderService.cancelOrder(orderNumber, reason.trim() || undefined);
      if (res.success && res.data) {
        setOrders((prev) =>
          prev.map((o) => (o.order_number === orderNumber ? { ...o, ...res.data, items: o.items } : o))
        );
        // Xu đã dùng được hoàn lại -> đồng bộ số dư
        refreshProfile();
      } else {
        alert(res.message || "Không thể hủy đơn hàng. Vui lòng thử lại.");
      }
    } catch {
      alert("Không thể hủy đơn hàng. Vui lòng thử lại.");
    } finally {
      setCancellingOrder(null);
    }
  };

  // Affiliate State
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats | null>(null);
  const [loadingAffiliate, setLoadingAffiliate] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Shop / Vendor State
  const [shopStats, setShopStats] = useState<VendorShopStats | null>(null);
  const [loadingShop, setLoadingShop] = useState(false);
  const [shopForm, setShopForm] = useState({
    shop_name: "",
    shop_description: "",
    phone: "",
    address: "",
  });
  const [shopRegistering, setShopRegistering] = useState(false);
  const [shopMsg, setShopMsg] = useState("");

  // Profile update form
  const [editProfile, setEditProfile] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  useEffect(() => {
    if (user) {
      setEditProfile({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
      });
      setShopForm((prev) => ({
        ...prev,
        shop_name: user.shop_name || prev.shop_name,
        shop_description: user.shop_description || prev.shop_description,
        phone: user.phone || prev.phone,
        address: user.address || prev.address,
      }));
    }
  }, [user]);

  // Load Orders
  useEffect(() => {
    if (isAuthenticated) {
      setLoadingOrders(true);
      orderService
        .getUserOrders()
        .then((res) => {
          if (res.success && res.data) {
            setOrders(res.data);
          }
        })
        .catch(() => {
          setOrders([]);
        })
        .finally(() => {
          setLoadingOrders(false);
        });
    }
  }, [isAuthenticated]);

  // Load Affiliate Stats on tab click
  useEffect(() => {
    if (isAuthenticated && activeTab === "affiliate") {
      setLoadingAffiliate(true);
      affiliateService
        .getStats()
        .then((res) => {
          if (res.success) {
            setAffiliateStats(res.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingAffiliate(false));
    }
  }, [isAuthenticated, activeTab]);

  // Load Shop Stats on tab click
  useEffect(() => {
    if (isAuthenticated && activeTab === "shop" && (user?.is_shop_active || user?.role === "admin")) {
      setLoadingShop(true);
      vendorService
        .getStats()
        .then((res) => {
          if (res.success) {
            setShopStats(res.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingShop(false));
    }
  }, [isAuthenticated, activeTab, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg("");

    try {
      const res = await authService.updateProfile(editProfile);
      if (res.success) {
        setProfileMsg("Cập nhật thông tin thành công!");
        await refreshProfile();
      }
    } catch (err: any) {
      setProfileMsg(err.message || "Lỗi khi cập nhật.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setShopRegistering(true);
    setShopMsg("");

    try {
      const res = await vendorService.registerShop(shopForm);
      if (res.success) {
        setShopMsg("Chúc mừng! Gian hàng của bạn đã được kích hoạt thành công.");
        await refreshProfile();
      }
    } catch (err: any) {
      setShopMsg(err.message || "Lỗi khi đăng ký gian hàng.");
    } finally {
      setShopRegistering(false);
    }
  };

  const handleCopyAffiliate = () => {
    const link =
      affiliateStats?.referral_link ||
      `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${user?.referral_code || "GS-VIP"}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 text-[11px] font-medium tracking-wide">
            <CheckCircle2 size={13} /> Hoàn Thành
          </span>
        );
      case "shipping":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 text-[11px] font-medium tracking-wide">
            <Truck size={13} /> Đang Giao &amp; Lắp Đặt
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 text-[11px] font-medium tracking-wide">
            <Package size={13} /> Đã Tiếp Nhận
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 text-[11px] font-medium tracking-wide">
            <XCircle size={13} /> Đã Hủy
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-200 text-gray-700 text-[11px] font-medium tracking-wide">
            <RotateCcw size={13} /> Đã Hoàn Tiền
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-[11px] font-medium tracking-wide">
            <Clock size={13} /> Đang Sản Xuất / Đóng Gói
          </span>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-beige">
        <SiteChrome>
          <section className="py-24 px-6">
            <div className="mx-auto max-w-md bg-white/70 border border-espresso/15 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto mb-4">
                <User size={32} strokeWidth={1.5} />
              </div>
              <h1 className="font-serif text-2xl text-espresso mb-2">Tài Khoản Thành Viên</h1>
              <p className="text-xs text-espresso/60 tracking-wider mb-6">
                Vui lòng đăng nhập để xem lịch sử đơn hàng, ví xu GS Coins, tiếp thị liên kết và quản lý gian hàng đối tác.
              </p>
              <button
                onClick={() => openAuth("login")}
                className="w-full py-3.5 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors duration-300 font-medium mb-3"
              >
                Đăng Nhập Ngay
              </button>
              <button
                onClick={() => openAuth("register")}
                className="w-full py-3.5 border border-espresso/20 text-espresso text-xs tracking-widest2 uppercase hover:border-espresso transition-colors duration-300"
              >
                Tạo Tài Khoản Mới
              </button>
            </div>
          </section>
        </SiteChrome>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-beige">
      <SiteChrome>
        <section className="py-12 md:py-20 px-6">
          <div className="mx-auto max-w-[1280px]">
            {/* Account Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-espresso/15 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-espresso text-gold flex items-center justify-center font-serif text-2xl shadow">
                  {user?.name?.charAt(0)?.toUpperCase() || "G"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-serif text-2xl md:text-3xl text-espresso">
                      {user?.name}
                    </h1>
                    {user?.is_shop_active && (
                      <span className="bg-gold/20 text-gold-dark text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold/40">
                        Chủ Gian Hàng
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-espresso/60 tracking-wider mt-1">
                    Thành viên VIP • {user?.email} • Ví: <strong className="text-gold font-mono">{userCoins} GS Coins</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-espresso text-gold text-xs font-semibold uppercase tracking-wider rounded hover:bg-black transition-colors"
                  >
                    ⚙️ Quản Trị Hệ Thống
                  </Link>
                )}
                <button
                  onClick={() => {
                    logoutUser();
                    router.push("/");
                  }}
                  className="inline-flex items-center gap-2 text-xs tracking-widest2 uppercase text-red-600 hover:text-red-800 transition-colors self-start md:self-auto"
                >
                  <LogOut size={15} /> Đăng Xuất
                </button>
              </div>
            </div>

            {/* Layout 2 Cột */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sidebar Tabs */}
              <div className="lg:col-span-3 space-y-2">
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full text-left px-5 py-3.5 text-xs tracking-widest2 uppercase transition-all duration-300 flex items-center justify-between rounded-lg ${
                    activeTab === "orders"
                      ? "bg-espresso text-beige font-medium shadow-md"
                      : "bg-white/60 text-espresso/70 hover:bg-white hover:text-espresso"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <ShoppingBag size={16} /> Đơn Hàng &amp; Tra Cứu
                  </span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                    {orders.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("coins")}
                  className={`w-full text-left px-5 py-3.5 text-xs tracking-widest2 uppercase transition-all duration-300 flex items-center justify-between rounded-lg ${
                    activeTab === "coins"
                      ? "bg-espresso text-beige font-medium shadow-md"
                      : "bg-white/60 text-espresso/70 hover:bg-white hover:text-espresso"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Gift size={16} /> Ví Xu GS Coins
                  </span>
                  <span className="text-[10px] bg-gold/20 text-gold font-mono px-2 py-0.5 rounded-full">
                    {userCoins}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("affiliate")}
                  className={`w-full text-left px-5 py-3.5 text-xs tracking-widest2 uppercase transition-all duration-300 flex items-center justify-between rounded-lg ${
                    activeTab === "affiliate"
                      ? "bg-espresso text-beige font-medium shadow-md"
                      : "bg-white/60 text-espresso/70 hover:bg-white hover:text-espresso"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Sparkles size={16} /> Tiếp Thị Liên Kết (CTV 5%)
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("shop")}
                  className={`w-full text-left px-5 py-3.5 text-xs tracking-widest2 uppercase transition-all duration-300 flex items-center justify-between rounded-lg ${
                    activeTab === "shop"
                      ? "bg-espresso text-beige font-medium shadow-md"
                      : "bg-white/60 text-espresso/70 hover:bg-white hover:text-espresso"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Store size={16} /> Gian Hàng Đối Tác
                  </span>
                  {user?.is_shop_active && (
                    <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded">
                      Đang Bán
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full text-left px-5 py-3.5 text-xs tracking-widest2 uppercase transition-all duration-300 flex items-center justify-between rounded-lg ${
                    activeTab === "profile"
                      ? "bg-espresso text-beige font-medium shadow-md"
                      : "bg-white/60 text-espresso/70 hover:bg-white hover:text-espresso"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <User size={16} /> Thông Tin &amp; Địa Chỉ
                  </span>
                </button>

                <div className="mt-8 p-5 bg-white/50 border border-espresso/10 space-y-3 text-xs text-espresso/70 rounded-lg">
                  <div className="flex items-center gap-2 text-gold font-medium">
                    <ShieldCheck size={16} /> Bảo Hành &amp; Độc Quyền
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Đặc quyền bảo dưỡng đồ gỗ &amp; thuộc da bò Ý miễn phí 2 lần/năm tại nhà cho khách hàng hạng thành viên VIP.
                  </p>
                </div>
              </div>

              {/* Tab Content */}
              <div className="lg:col-span-9">
                {/* ======================================================== */}
                {/* 1. ORDERS TAB */}
                {/* ======================================================== */}
                {activeTab === "orders" && (
                  <div>
                    <h2 className="font-serif text-2xl text-espresso mb-6">
                      Lịch Sử Đơn Hàng &amp; Tra Cứu Vận Chuyển Realtime
                    </h2>

                    {loadingOrders ? (
                      <div className="text-center py-16 bg-white/40 border border-dashed border-espresso/15 rounded-xl">
                        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-xs text-espresso/60 tracking-wider">
                          Đang tải lịch sử đơn hàng...
                        </p>
                      </div>
                    ) : orders.length > 0 ? (
                      <div className="space-y-6">
                        {orders.map((order) => (
                          <div
                            key={order.id}
                            className="bg-white/80 border border-espresso/10 p-6 rounded-xl transition-all duration-300 hover:shadow-lg"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-espresso/10">
                              <div>
                                <span className="text-[11px] text-espresso/50 tracking-widest2 uppercase block">
                                  Mã Đơn Hàng
                                </span>
                                <span className="font-mono text-base font-semibold text-espresso">
                                  {order.order_number}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                {getStatusBadge(order.order_status)}
                                {CANCELLABLE_STATUSES.includes(order.order_status) && order.payment_status !== "paid" && (
                                  <button
                                    onClick={() => handleCancelOrder(order.order_number)}
                                    disabled={cancellingOrder === order.order_number}
                                    className="text-xs text-red-600/80 hover:text-red-700 hover:underline font-medium disabled:opacity-50"
                                  >
                                    {cancellingOrder === order.order_number ? "Đang hủy..." : "Hủy Đơn"}
                                  </button>
                                )}
                                <Link
                                  href={`/orders/${order.order_number}`}
                                  className="inline-flex items-center gap-1 text-xs text-gold hover:underline font-medium"
                                >
                                  Theo Dõi Vận Đơn <ChevronRight size={14} />
                                </Link>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="divide-y divide-espresso/5 my-4">
                              {order.items?.map((item: any) => (
                                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-4 min-w-0">
                                    <div className="relative w-12 h-12 bg-beige/60 overflow-hidden shrink-0 rounded">
                                      <Image
                                        src={item.product_image || "/images/sofa-1.jpg"}
                                        alt={item.product_name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-serif text-sm text-espresso truncate">
                                        {item.product_name}
                                      </p>
                                      {item.variant_name && (
                                        <p className="text-[11px] text-espresso/60">
                                          Biến thể: {item.variant_name}
                                        </p>
                                      )}
                                      <p className="text-[11px] text-espresso/50">
                                        SL: {item.quantity} × {formatPrice(item.price)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="font-serif text-sm text-espresso font-medium">
                                      {formatPrice(item.total_price)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Order Footer */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-espresso/10 text-xs text-espresso/70">
                              <div>
                                <span className="text-espresso/50">Giao đến: </span>
                                {order.shipping_address}, {order.shipping_city}
                              </div>
                              <div className="text-right">
                                <span className="text-espresso/50">Tổng thanh toán: </span>
                                <span className="font-serif text-base text-gold font-semibold ml-1">
                                  {formatPrice(order.total_amount)}
                                </span>
                                {order.coins_earned > 0 && (
                                  <span className="block text-[11px] text-amber-700 mt-0.5">
                                    +{order.coins_earned.toLocaleString("vi-VN")} GS Coins tích lũy
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-white/40 border border-dashed border-espresso/15 rounded-xl">
                        <ShoppingBag size={40} className="mx-auto text-espresso/30 mb-3" />
                        <p className="font-serif text-xl text-espresso mb-2">Chưa có đơn hàng nào</p>
                        <p className="text-xs text-espresso/60 tracking-wider mb-6">
                          Khám phá các bộ sưu tập nội thất đỉnh cao và chọn cho mình không gian ưng ý nhất.
                        </p>
                        <Link
                          href="/products"
                          className="inline-block px-6 py-3 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors rounded"
                        >
                          Xem Sản Phẩm Ngay
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* ======================================================== */}
                {/* 2. GS COINS TAB */}
                {/* ======================================================== */}
                {activeTab === "coins" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-wood-dark to-wood text-white p-6 md:p-8 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 border border-gold/40">
                      <div>
                        <div className="flex items-center space-x-2 text-gold text-xs font-semibold uppercase tracking-wider mb-2">
                          <Gift size={16} /> Ví Điểm Thưởng &amp; Xu Thành Viên
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-white">
                          {userCoins.toLocaleString()} <span className="text-gold">GS Coins</span>
                        </h2>
                        <p className="text-xs text-sand/80 mt-1">
                          Tương đương với <strong>{(userCoins * 1000).toLocaleString("vi-VN")} VNĐ</strong> giảm trực tiếp khi thanh toán đơn hàng.
                        </p>
                      </div>

                      <button
                        onClick={openWheel}
                        className="px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:scale-105 transition-transform flex items-center gap-2"
                      >
                        🎁 Quay Vòng May Mắn Nhận Thêm Xu
                      </button>
                    </div>

                    {/* How to earn & spend */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white/80 p-5 rounded-xl border border-espresso/10 space-y-2">
                        <span className="text-2xl">📦</span>
                        <h4 className="text-sm font-bold text-espresso">Tích Lũy Khi Mua Hàng</h4>
                        <p className="text-xs text-espresso/60">
                          Nhận 1 GS Coin cho mỗi 100.000₫ thanh toán, tự động cộng khi đơn hàng hoàn tất.
                        </p>
                      </div>
                      <div className="bg-white/80 p-5 rounded-xl border border-espresso/10 space-y-2">
                        <span className="text-2xl">🎡</span>
                        <h4 className="text-sm font-bold text-espresso">Vòng Quay Hàng Ngày</h4>
                        <p className="text-xs text-espresso/60">
                          Mỗi ngày đăng nhập nhận 1 lượt quay may mắn miễn phí, trúng tới 200 GS Coins cộng thẳng vào ví.
                        </p>
                      </div>
                      <div className="bg-white/80 p-5 rounded-xl border border-espresso/10 space-y-2">
                        <span className="text-2xl">✍️</span>
                        <h4 className="text-sm font-bold text-espresso">Đánh Giá Sản Phẩm</h4>
                        <p className="text-xs text-espresso/60">
                          Nhận 50 GS Coins cho đánh giá đầu tiên của mỗi sản phẩm bạn đã mua và nhận hàng thành công.
                        </p>
                      </div>
                      <div className="bg-white/80 p-5 rounded-xl border border-espresso/10 space-y-2">
                        <span className="text-2xl">🛍️</span>
                        <h4 className="text-sm font-bold text-espresso">Trừ Tiền Trực Tiếp</h4>
                        <p className="text-xs text-espresso/60">
                          Dùng xu thanh toán tại trang Checkout với tỷ lệ 1 Xu = 1.000₫ (khấu trừ tối đa 20% giá trị đơn).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ======================================================== */}
                {/* 3. AFFILIATE TAB */}
                {/* ======================================================== */}
                {activeTab === "affiliate" && (
                  <div className="space-y-6">
                    {loadingAffiliate ? (
                      <div className="py-12 flex justify-center">
                        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        <div className="bg-gradient-to-br from-sand/20 to-white p-6 rounded-2xl border border-gold/40 space-y-4 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="font-serif text-xl font-bold text-espresso">
                                Tiếp Thị Liên Kết &amp; Cộng Tác Viên (Affiliate)
                              </h3>
                              <p className="text-xs text-espresso/60">
                                Chia sẻ sản phẩm nội thất GS Luxury và nhận ngay 5% hoa hồng trên mỗi đơn hàng hoàn tất.
                              </p>
                            </div>
                            <span className="bg-gold/15 text-wood-dark px-3 py-1 rounded-full text-xs font-bold border border-gold/40 self-start sm:self-auto">
                              Mức hoa hồng: 5.0%
                            </span>
                          </div>

                          {/* Link box */}
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              readOnly
                              value={
                                affiliateStats?.referral_link ||
                                `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${user?.referral_code || "GS-VIP"}`
                              }
                              className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-700 outline-none select-all"
                            />
                            <button
                              onClick={handleCopyAffiliate}
                              className="px-4 py-2.5 bg-espresso hover:bg-gold text-beige text-xs font-semibold rounded-lg shadow-sm transition-all whitespace-nowrap"
                            >
                              {copiedLink ? "✓ Đã sao chép" : "Sao chép Link"}
                            </button>
                          </div>
                        </div>

                        {/* Stats Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-white/80 p-4 rounded-xl border border-espresso/10">
                            <div className="text-[10px] text-espresso/60 uppercase">Hoa hồng khả dụng</div>
                            <div className="text-lg font-bold text-espresso mt-1">
                              {(affiliateStats?.available_balance || 0).toLocaleString("vi-VN")} đ
                            </div>
                          </div>
                          <div className="bg-white/80 p-4 rounded-xl border border-espresso/10">
                            <div className="text-[10px] text-espresso/60 uppercase">Đang chờ duyệt</div>
                            <div className="text-lg font-bold text-amber-700 mt-1">
                              {(affiliateStats?.pending_balance || 0).toLocaleString("vi-VN")} đ
                            </div>
                          </div>
                          <div className="bg-white/80 p-4 rounded-xl border border-espresso/10">
                            <div className="text-[10px] text-espresso/60 uppercase">Đơn hàng thành công</div>
                            <div className="text-lg font-bold text-espresso mt-1">
                              {affiliateStats?.total_orders_referred || 0} đơn
                            </div>
                          </div>
                          <div className="bg-white/80 p-4 rounded-xl border border-espresso/10">
                            <div className="text-[10px] text-espresso/60 uppercase">Lượt click liên kết</div>
                            <div className="text-lg font-bold text-espresso mt-1">
                              {affiliateStats?.clicks_count || 0} lượt
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={openAffiliate}
                          className="w-full py-3 bg-wood-dark hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow transition-colors"
                        >
                          🏦 Mở Trình Quản Lý &amp; Rút Tiền Hoa Hồng
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* ======================================================== */}
                {/* 4. SHOP / VENDOR TAB */}
                {/* ======================================================== */}
                {activeTab === "shop" && (
                  <div className="space-y-6">
                    {user?.is_shop_active || user?.role === "admin" ? (
                      /* Active Seller Dashboard View */
                      <div className="space-y-6">
                        <div className="bg-white/80 p-6 rounded-2xl border border-espresso/10 space-y-4 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] text-gold font-bold uppercase tracking-widest">
                                Gian Hàng Đối Tác Chính Thức
                              </span>
                              <h3 className="font-serif text-2xl font-bold text-espresso">
                                {user?.shop_name || "Gian Hàng Nội Thất GS Luxury"}
                              </h3>
                              <p className="text-xs text-espresso/60 mt-1">
                                {user?.shop_description || "Xưởng chế tác đồ gỗ & sofa cao cấp."}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                                ✓ Đã Xác Minh KYC
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Shop KPIs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-white/80 p-4 rounded-xl border border-espresso/10">
                            <div className="text-[10px] text-espresso/60 uppercase">Doanh thu tháng</div>
                            <div className="text-lg font-bold text-espresso mt-1">
                              {(shopStats?.monthly_revenue || 145200000).toLocaleString("vi-VN")} đ
                            </div>
                          </div>
                          <div className="bg-white/80 p-4 rounded-xl border border-espresso/10">
                            <div className="text-[10px] text-espresso/60 uppercase">Tổng đơn hàng</div>
                            <div className="text-lg font-bold text-espresso mt-1">
                              {shopStats?.total_orders || 24} đơn
                            </div>
                          </div>
                          <div className="bg-white/80 p-4 rounded-xl border border-espresso/10">
                            <div className="text-[10px] text-espresso/60 uppercase">Đánh giá Shop</div>
                            <div className="text-lg font-bold text-gold mt-1">
                              ⭐ {shopStats?.shop_rating || 4.95} / 5.0
                            </div>
                          </div>
                          <div className="bg-white/80 p-4 rounded-xl border border-espresso/10">
                            <div className="text-[10px] text-espresso/60 uppercase">Tỷ lệ hoàn thành</div>
                            <div className="text-lg font-bold text-espresso mt-1">
                              {shopStats?.fulfillment_rate || "99.2%"}
                            </div>
                          </div>
                        </div>

                        {/* Recent Payouts */}
                        <div className="bg-white/80 p-6 rounded-xl border border-espresso/10 space-y-4">
                          <h4 className="font-serif text-lg font-bold text-espresso">
                            Lịch Sử Quyết Toán Doanh Thu Từ Sàn
                          </h4>
                          <div className="divide-y divide-espresso/10 text-xs">
                            <div className="py-3 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-espresso">Kỳ quyết toán: 15/08/2026 - 31/08/2026</span>
                                <p className="text-[11px] text-espresso/60">Chuyển khoản: Vietcombank **** 9821</p>
                              </div>
                              <span className="font-bold text-green-700">+45.000.000 đ (Đã nhận)</span>
                            </div>
                            <div className="py-3 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-espresso">Kỳ quyết toán: 01/08/2026 - 15/08/2026</span>
                                <p className="text-[11px] text-espresso/60">Chuyển khoản: Vietcombank **** 9821</p>
                              </div>
                              <span className="font-bold text-green-700">+62.500.000 đ (Đã nhận)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Onboarding Registration Form */
                      <div className="bg-white/80 border border-espresso/10 p-6 md:p-8 rounded-2xl max-w-2xl">
                        <div className="text-center mb-6">
                          <Store size={36} className="text-gold mx-auto mb-2" />
                          <h3 className="font-serif text-2xl font-bold text-espresso">
                            Đăng Ký Mở Gian Hàng Đối Tác (Vendor Multi-Vendor)
                          </h3>
                          <p className="text-xs text-espresso/60 mt-1">
                            Tiếp cận hàng chục ngàn khách hàng thượng lưu tìm kiếm nội thất cao cấp tại GS Luxury.
                          </p>
                        </div>

                        {shopMsg && (
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-lg">
                            {shopMsg}
                          </div>
                        )}

                        <form onSubmit={handleRegisterShop} className="space-y-4">
                          <div>
                            <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-1">
                              Tên Gian Hàng / Thương Hiệu Xưởng *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ví dụ: Xưởng Chế Tác Gỗ Sồi Hoàng Gia"
                              value={shopForm.shop_name}
                              onChange={(e) => setShopForm({ ...shopForm, shop_name: e.target.value })}
                              className="w-full bg-beige/40 border border-espresso/15 px-4 py-2.5 text-xs focus:outline-none focus:border-gold rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-1">
                              Mô Tả Năng Lực Sản Xuất &amp; Sản Phẩm *
                            </label>
                            <textarea
                              rows={3}
                              required
                              placeholder="Mô tả các dòng sản phẩm chủ đạo (Sofa da bò Ý, Bàn ăn gỗ óc chó, Tủ bếp...)"
                              value={shopForm.shop_description}
                              onChange={(e) =>
                                setShopForm({ ...shopForm, shop_description: e.target.value })
                              }
                              className="w-full bg-beige/40 border border-espresso/15 px-4 py-2.5 text-xs focus:outline-none focus:border-gold rounded-lg"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-1">
                                Hotline Chủ Shop *
                              </label>
                              <input
                                type="tel"
                                required
                                placeholder="0988 123 456"
                                value={shopForm.phone}
                                onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                                className="w-full bg-beige/40 border border-espresso/15 px-4 py-2.5 text-xs focus:outline-none focus:border-gold rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-1">
                                Địa Chỉ Xưởng / Showroom *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="KCN Chàng Sơn, Thạch Thất, Hà Nội"
                                value={shopForm.address}
                                onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                                className="w-full bg-beige/40 border border-espresso/15 px-4 py-2.5 text-xs focus:outline-none focus:border-gold rounded-lg"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={shopRegistering}
                            className="w-full py-3.5 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors duration-300 font-medium rounded-lg shadow"
                          >
                            {shopRegistering ? "Đang Gửi Hồ Sơ..." : "Xác Nhận Đăng Ký Mở Gian Hàng"}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* ======================================================== */}
                {/* 5. PROFILE TAB */}
                {/* ======================================================== */}
                {activeTab === "profile" && (
                  <div className="bg-white/70 border border-espresso/10 p-6 md:p-8 max-w-2xl rounded-2xl">
                    <h2 className="font-serif text-2xl text-espresso mb-6">
                      Cập Nhật Thông Tin Cá Nhân &amp; Sổ Địa Chỉ
                    </h2>

                    {profileMsg && (
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 text-xs tracking-wide rounded-lg">
                        {profileMsg}
                      </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                      <div>
                        <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-2">
                          Họ và Tên
                        </label>
                        <input
                          type="text"
                          required
                          value={editProfile.name}
                          onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                          className="w-full bg-beige/40 border border-espresso/15 px-4 py-3 text-xs tracking-wide focus:outline-none focus:border-gold rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-2">
                          Email (Không thể thay đổi)
                        </label>
                        <input
                          type="email"
                          disabled
                          value={user?.email || ""}
                          className="w-full bg-black/5 border border-espresso/10 px-4 py-3 text-xs text-espresso/50 cursor-not-allowed rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-2">
                          Số Điện Thoại
                        </label>
                        <input
                          type="tel"
                          placeholder="0901 234 567"
                          value={editProfile.phone}
                          onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                          className="w-full bg-beige/40 border border-espresso/15 px-4 py-3 text-xs tracking-wide focus:outline-none focus:border-gold rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-2">
                          Địa Chỉ Giao Hàng &amp; Lắp Đặt Mặc Định
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/TP"
                          value={editProfile.address}
                          onChange={(e) => setEditProfile({ ...editProfile, address: e.target.value })}
                          className="w-full bg-beige/40 border border-espresso/15 px-4 py-3 text-xs tracking-wide focus:outline-none focus:border-gold rounded-lg"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="py-3.5 px-8 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors duration-300 disabled:opacity-50 font-medium rounded-lg shadow"
                      >
                        {profileSaving ? "Đang Lưu..." : "Lưu Thay Đổi"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </SiteChrome>
    </main>
  );
}
