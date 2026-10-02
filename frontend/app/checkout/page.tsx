"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  CreditCard,
  CheckCircle2,
  Tag,
  Gift,
  X,
  Sparkles,
  Lock,
  ArrowRight,
  Loader2,
  ChevronDown,
  Building2,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  BadgePercent,
  Coins,
  QrCode,
  Banknote,
  Shield,
  ShoppingBag,
} from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import { useStore } from "@/components/StoreContext";
import { useToast } from "@/components/ToastProvider";
import { formatPrice } from "@/lib/products";
import {
  orderService,
  voucherService,
  shippingService,
  ApiVoucher,
  ShippingMethod,
  GhnProvince,
  GhnDistrict,
  GhnWard,
} from "@/services/api";

export default function CheckoutPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    cart,
    cartSubtotal,
    cartCount,
    clearCart,
    user,
    isAuthLoading,
    appliedVoucher,
    discountAmount,
    applyVoucherCode,
    removeVoucher,
    userCoins,
    useCoins,
    setUseCoins,
    coinsDiscount,
    referralCode,
    openAuth,
    refreshProfile,
  } = useStore();

  // State declarations - MUST be at top level for React hooks rules
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: "",
    shipping_city: "",
    shipping_district: "",
    shipping_ward: "",
    shipping_province_id: "",
    shipping_district_id: "",
    shipping_ward_code: "",
    shipping_method: "standard",
    notes: "",
    tax_code: "",
    payment_method: "bank_transfer" as "cod" | "bank_transfer" | "vnpay" | "momo",
  });

  // GHN Data
  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);

  // Shipping methods - chỉ dùng GHN API, không hardcode
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);

  const [shippingFee, setShippingFee] = useState<number>(0);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState("");

  // Voucher input
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<ApiVoucher[]>([]);
  const [showVoucherList, setShowVoucherList] = useState(false);

  const [loading, setLoading] = useState(false);

  // Optional login banner / pre-fill
  // Guest checkout is fully supported

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customer_name: user.name || prev.customer_name,
        customer_email: user.email || prev.customer_email,
        customer_phone: user.phone || prev.customer_phone,
        shipping_address: user.address || prev.shipping_address,
      }));
    }
  }, [user]);

  // Load available vouchers
  useEffect(() => {
    voucherService
      .getVouchers()
      .then((res) => {
        if (res.success && res.data) {
          setAvailableVouchers(res.data);
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  // Fetch GHN Provinces on mount
  useEffect(() => {
    shippingService.getProvinces().then((res) => {
      if (res.success && res.data) {
        setProvinces(res.data);
      }
    });
  }, []);

  // Fetch Districts when Province changes
  useEffect(() => {
    if (formData.shipping_province_id) {
      shippingService.getDistricts(Number(formData.shipping_province_id)).then((res) => {
        if (res.success && res.data) {
          setDistricts(res.data);
          // Reset district and ward
          setFormData((prev) => ({
            ...prev,
            shipping_district_id: "",
            shipping_district: "",
            shipping_ward_code: "",
            shipping_ward: "",
          }));
          setWards([]);
        }
      });
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [formData.shipping_province_id]);

  // Fetch Wards when District changes
  useEffect(() => {
    if (formData.shipping_district_id) {
      shippingService.getWards(Number(formData.shipping_district_id)).then((res) => {
        if (res.success && res.data) {
          setWards(res.data);
          // Reset ward
          setFormData((prev) => ({
            ...prev,
            shipping_ward_code: "",
            shipping_ward: "",
          }));
        }
      });
    } else {
      setWards([]);
    }
  }, [formData.shipping_district_id]);

  // Calculate shipping fee when District/Ward changes - CHỈ dùng GHN API
  useEffect(() => {
    if (formData.shipping_district_id && formData.shipping_ward_code) {
      setCalculatingShipping(true);
      setShippingError("");
      const FALLBACK_FEE = 150000; // Phí dự phòng cố định khi GHN không tính được - không bao giờ miễn phí

      shippingService
        .calculateBothServices({
          to_district_id: Number(formData.shipping_district_id),
          to_ward_code: formData.shipping_ward_code,
          weight: 5000,
          length: 50,
          width: 30,
          height: 20,
        })
        .then((res) => {
          setCalculatingShipping(false);
          if (res.success && res.data && (res.data.standard || res.data.express)) {
            const methods: ShippingMethod[] = [];

            if (res.data.standard) {
              methods.push({
                id: "standard",
                name: "Vận chuyển Tiêu chuẩn (GHN)",
                description: "Xe thùng chuyên dụng chống va đập, bọc màng PE 4 lớp",
                fee: res.data.standard.total_fee,
                estimated_delivery: res.data.standard.estimated_delivery_time
                  ? `${res.data.standard.estimated_delivery_time} (GHN)`
                  : "1 - 2 ngày",
                ghn_data: res.data.standard,
              });
            }

            if (res.data.express) {
              methods.push({
                id: "express",
                name: "Giao Hàng Hỏa Tốc (GHN)",
                description: "Ưu tiên xếp xe xuất kho ngay lập tức, hẹn giờ chính xác",
                fee: res.data.express.total_fee,
                estimated_delivery: res.data.express.estimated_delivery_time
                  ? `${res.data.express.estimated_delivery_time} (GHN)`
                  : "Trong ngày",
                ghn_data: res.data.express,
              });
            }

            setShippingMethods(methods);

            const firstMethod = methods[0];
            setShippingFee(firstMethod.fee);
            setFormData((prev) => ({ ...prev, shipping_method: firstMethod.id }));
          } else {
            // GHN không hỗ trợ tuyến này - dùng phí dự phòng cố định, KHÔNG bao giờ miễn phí
            setShippingError(
              "Khu vực này chưa có sẵn dữ liệu phí GHN thực tế, hệ thống đã áp dụng phí vận chuyển tiêu chuẩn tạm tính."
            );
            const fallbackMethod: ShippingMethod = {
              id: "standard",
              name: "Vận chuyển Tiêu chuẩn (Phí tạm tính)",
              description: "Xe thùng chuyên dụng chống va đập, bọc màng PE 4 lớp",
              fee: FALLBACK_FEE,
              estimated_delivery: "2 - 4 ngày",
              ghn_data: null,
            };
            setShippingMethods([fallbackMethod]);
            setShippingFee(FALLBACK_FEE);
            setFormData((prev) => ({ ...prev, shipping_method: "standard" }));
          }
        })
        .catch(() => {
          setCalculatingShipping(false);
          setShippingError(
            "Không thể kết nối tới GHN, hệ thống đã áp dụng phí vận chuyển tiêu chuẩn tạm tính."
          );
          const fallbackMethod: ShippingMethod = {
            id: "standard",
            name: "Vận chuyển Tiêu chuẩn (Phí tạm tính)",
            description: "Xe thùng chuyên dụng chống va đập, bọc màng PE 4 lớp",
            fee: FALLBACK_FEE,
            estimated_delivery: "2 - 4 ngày",
            ghn_data: null,
          };
          setShippingMethods([fallbackMethod]);
          setShippingFee(FALLBACK_FEE);
          setFormData((prev) => ({ ...prev, shipping_method: "standard" }));
        });
    }
  }, [formData.shipping_district_id, formData.shipping_ward_code, cartSubtotal]);

  // 1. BẮT BUỘC ĐĂNG NHẬP MỚI ĐƯỢC THANH TOÁN
  if (isAuthLoading) {
    return (
      <main className="min-h-screen bg-beige">
        <SiteChrome>
          <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-6">
            <Loader2 size={44} className="text-gold animate-spin mb-4" strokeWidth={1.5} />
            <p className="text-xs text-espresso/70 tracking-widest2 uppercase font-medium">Đang kiểm tra thông tin tài khoản...</p>
          </div>
        </SiteChrome>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-beige">
        <SiteChrome>
          <section className="py-16 md:py-24 px-6">
            <div className="mx-auto max-w-md bg-white/90 border border-espresso/15 p-8 md:p-10 text-center shadow-ambient">
              <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-6">
                <Lock size={28} className="text-gold" strokeWidth={1.5} />
              </div>
              <p className="text-gold text-xs tracking-widest2 uppercase mb-2">Thành Viên GS Luxury</p>
              <h1 className="font-serif text-2xl md:text-3xl text-espresso mb-3">Yêu Cầu Đăng Nhập</h1>
              <p className="text-xs md:text-sm text-espresso/70 mb-8 leading-relaxed">
                Để đảm bảo quyền lợi hội viên, tích lũy Coins và theo dõi tiến độ giao hàng White-Glove, quý khách vui lòng đăng nhập trước khi tiến hành thanh toán.
              </p>
              <div className="space-y-3">
                <Link
                  href="/login?redirect=/checkout"
                  className="w-full py-3.5 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
                >
                  Đăng Nhập Tài Khoản
                  <ArrowRight size={14} />
                </Link>
                <button
                  type="button"
                  onClick={() => openAuth("register")}
                  className="w-full py-3 border border-espresso/20 text-espresso text-xs tracking-widest2 uppercase hover:border-gold hover:text-gold transition-colors font-medium"
                >
                  Đăng Ký Thành Viên Mới
                </button>
              </div>
            </div>
          </section>
        </SiteChrome>
      </main>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectShippingMethod = (method: ShippingMethod) => {
    setFormData((prev) => ({ ...prev, shipping_method: method.id }));
    setShippingFee(method.fee);
  };

  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return;
    setApplyingVoucher(true);
    setVoucherError("");
    setVoucherSuccess("");

    try {
      const res = await voucherService.applyVoucher(voucherInput, cartSubtotal);
      if (res.success && res.data) {
        setVoucherSuccess(res.message || "Áp dụng voucher thành công");
        showToast({ type: "success", title: "Thành công", message: res.message || "Áp dụng voucher thành công" });
      } else {
        setVoucherError(res.message || "Mã không hợp lệ");
        showToast({ type: "error", title: "Không thể áp dụng", message: res.message || "Mã giảm giá không hợp lệ" });
      }
    } catch {
      setVoucherError("Có lỗi xảy ra, vui lòng thử lại");
      showToast({ type: "error", title: "Lỗi", message: "Có lỗi xảy ra, vui lòng thử lại" });
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    removeVoucher();
    setVoucherInput("");
    setVoucherSuccess("");
    setVoucherError("");
    showToast({ type: "info", title: "Đã xóa", message: "Đã xóa mã giảm giá" });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      showToast({ type: "warning", title: "Giỏ hàng trống", message: "Giỏ hàng của bạn đang trống!" });
      return;
    }

    if (!formData.customer_name || !formData.customer_phone || !formData.shipping_address) {
      showToast({ type: "warning", title: "Thiếu thông tin", message: "Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)." });
      return;
    }

    if (!formData.shipping_province_id || !formData.shipping_district_id || !formData.shipping_ward_code) {
      showToast({ type: "warning", title: "Thiếu địa chỉ", message: "Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã." });
      return;
    }

    if (!formData.shipping_method) {
      showToast({ type: "warning", title: "Chưa chọn ship", message: "Vui lòng chọn phương thức vận chuyển." });
      return;
    }

    if (!shippingMethods.length) {
      showToast({ type: "error", title: "Lỗi phí ship", message: "Không thể tính phí ship. Vui lòng chọn lại địa chỉ." });
      return;
    }

    try {
      setLoading(true);

      const coinsToUse = useCoins ? Math.min(userCoins, Math.floor(coinsDiscount / 1000)) : 0;

      // Call Backend API
      const payload = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || "guest@gsluxury.vn",
        customer_phone: formData.customer_phone,
        shipping_address: formData.shipping_address,
        shipping_city: formData.shipping_city || "Hà Nội",
        shipping_district: formData.shipping_district,
        shipping_ward: formData.shipping_ward,
        shipping_province_id: formData.shipping_province_id || undefined,
        shipping_district_id: formData.shipping_district_id || undefined,
        shipping_ward_code: formData.shipping_ward_code || undefined,
        shipping_method: formData.shipping_method,
        shipping_fee: shippingFee,
        notes: formData.notes,
        payment_method: formData.payment_method,
        voucher_code: appliedVoucher?.code || undefined,
        discount_amount: discountAmount,
        coins_used: coinsToUse,
        coins_discount: coinsDiscount,
        referral_code: referralCode || undefined,
        idempotency_key: typeof window !== "undefined" 
          ? (sessionStorage.getItem("gs_checkout_idempotency") || (() => {
              const k = "gsl_idemp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
              sessionStorage.setItem("gs_checkout_idempotency", k);
              return k;
            })())
          : undefined,
        items: cart.map((item, index) => ({
          product_id: parseInt(String(item.product.id)) || index + 1,
          variant_id: item.variant?.id || null,
          quantity: item.quantity,
        })),
      };

      const res = await orderService.createOrder(payload);

      if (res.success && res.data?.order) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("gs_checkout_idempotency");
        }
        const order = res.data.order;
        const orderNumber = order.order_number;

        // Xu đã bị trừ trên server -> cập nhật lại số dư hiển thị
        if (order.coins_used) {
          refreshProfile();
        }

        // If payment method is MoMo, redirect to MoMo payUrl
        if (formData.payment_method === "momo") {
          const momoRes = await orderService.createMomoPayment(order.id);

          if (momoRes.success && momoRes.data?.payUrl) {
            clearCart();
            // Redirect to MoMo payment gateway
            window.location.href = momoRes.data.payUrl;
            return;
          } else {
            throw new Error(momoRes.message || "Không thể tạo thanh toán MoMo");
          }
        }

        // If payment method is VNPAY, redirect to VNPAY payment_url
        if (formData.payment_method === "vnpay") {
          const vnpayRes = await orderService.createVnpayPayment(order.id);

          if (vnpayRes.success && vnpayRes.data?.payment_url) {
            clearCart();
            // Redirect to VNPAY payment gateway
            window.location.href = vnpayRes.data.payment_url;
            return;
          } else {
            throw new Error(vnpayRes.message || "Không thể tạo thanh toán VNPAY");
          }
        }

        // For other payment methods (COD, bank_transfer)
        clearCart();
        router.push(
          `/order-success/${orderNumber}?method=${formData.payment_method}&amount=${shippingFee + cartSubtotal - discountAmount}`
        );
      } else {
        throw new Error(res.message || "Không thể tạo đơn hàng");
      }
    } catch (err: any) {
      console.error("Order submission failed:", err);
      showToast({
        type: "error",
        title: "Đặt hàng không thành công",
        message: err.message || "Có lỗi xảy ra trong quá trình đặt hàng. Vui lòng kiểm tra lại thông tin.",
      });
    } finally {
      setLoading(false);
    }
  };

  const coinsToUse = useCoins ? Math.min(userCoins, Math.floor(coinsDiscount / 1000)) : 0;
  const totalAmount = cartSubtotal + shippingFee - discountAmount - coinsDiscount;

  return (
    <main className="min-h-screen bg-[#faf8f5] text-neutral-800">
      <SiteChrome>
        <section className="py-8 md:py-14 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl xl:max-w-7xl">
            {/* Multi-step Breadcrumb */}
            <div className="mb-10 max-w-2xl mx-auto">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-200 -translate-y-1/2 z-0" />
                <div className="absolute top-1/2 left-0 w-1/2 h-0.5 bg-gradient-to-r from-amber-600 to-amber-500 -translate-y-1/2 z-0" />
                
                {/* Step 1 */}
                <Link href="/products" className="relative z-10 flex flex-col items-center group">
                  <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-semibold shadow-sm group-hover:scale-105 transition-transform">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-600 mt-2 uppercase tracking-wider">1. Giỏ Hàng</span>
                </Link>

                {/* Step 2 */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 text-amber-400 ring-4 ring-amber-100 flex items-center justify-center text-sm font-semibold shadow-md">
                    2
                  </div>
                  <span className="text-[11px] font-bold text-neutral-900 mt-2 uppercase tracking-wider">2. Thanh Toán</span>
                </div>

                {/* Step 3 */}
                <div className="relative z-10 flex flex-col items-center opacity-60">
                  <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-300 text-neutral-400 flex items-center justify-center text-xs font-semibold">
                    3
                  </div>
                  <span className="text-[11px] font-medium text-neutral-400 mt-2 uppercase tracking-wider">3. Hoàn Tất</span>
                </div>
              </div>
            </div>

            {/* Header */}
            <header className="mb-10 text-center">
              <h1 className="font-serif text-3xl md:text-4xl text-neutral-900 tracking-tight font-normal">
                Thanh Toán & Xác Nhận Đơn Hàng
              </h1>
              <p className="text-neutral-500 text-sm mt-2 font-light">
                Trải nghiệm mua sắm bảo mật & dịch vụ vận chuyển White-Glove chuẩn quốc tế từ GS Luxury.
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Left Column: Form Details (Col 7 / 12) */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-7">
                {/* 1. Customer Info */}
                <div className="bg-white/95 rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200/80 backdrop-blur-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between pb-5 border-b border-neutral-100 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-neutral-900 text-amber-400 font-serif font-bold text-sm flex items-center justify-center shadow-xs">
                        1
                      </span>
                      <div>
                        <h2 className="font-serif text-lg md:text-xl text-neutral-900 font-medium">
                          Thông Tin Khách Hàng
                        </h2>
                        <p className="text-xs text-neutral-400">Thông tin nhận hóa đơn & cập nhật lộ trình giao hàng</p>
                      </div>
                    </div>
                    {!user && (
                      <button
                        type="button"
                        onClick={() => openAuth("login")}
                        className="text-xs text-amber-700 hover:text-amber-800 font-medium underline transition-colors"
                      >
                        Đã có tài khoản? Đăng nhập
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 mb-2 uppercase tracking-wider">
                        <User size={13} className="text-amber-600" />
                        Họ và Tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="customer_name"
                        required
                        placeholder="Ví dụ: Nguyễn Văn An"
                        value={formData.customer_name}
                        onChange={handleChange}
                        className="w-full h-11 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl px-4 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 mb-2 uppercase tracking-wider">
                        <Mail size={13} className="text-amber-600" />
                        Địa Chỉ Email
                      </label>
                      <input
                        type="email"
                        name="customer_email"
                        placeholder="Ví dụ: customer@gmail.com"
                        value={formData.customer_email}
                        onChange={handleChange}
                        className="w-full h-11 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl px-4 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 mb-2 uppercase tracking-wider">
                        <Phone size={13} className="text-amber-600" />
                        Số Điện Thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="customer_phone"
                        required
                        placeholder="Ví dụ: 0988776655"
                        value={formData.customer_phone}
                        onChange={handleChange}
                        className="w-full h-11 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl px-4 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 mb-2 uppercase tracking-wider">
                        <Building2 size={13} className="text-neutral-400" />
                        Mã Số Thuế (Nếu Cần VAT)
                      </label>
                      <input
                        type="text"
                        name="tax_code"
                        placeholder="Nhập MST xuất hóa đơn công ty"
                        value={formData.tax_code || ""}
                        onChange={handleChange}
                        className="w-full h-11 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl px-4 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Shipping Address & GHN */}
                <div className="bg-white/95 rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200/80 backdrop-blur-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between pb-5 border-b border-neutral-100 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-neutral-900 text-amber-400 font-serif font-bold text-sm flex items-center justify-center shadow-xs">
                        2
                      </span>
                      <div>
                        <h2 className="font-serif text-lg md:text-xl text-neutral-900 font-medium">
                          Địa Chỉ Giao Hàng & Lắp Đặt
                        </h2>
                        <p className="text-xs text-neutral-400">Kết nối trực tiếp hệ thống vận chuyển GHN toàn quốc</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 font-medium">
                      <Truck size={13} />
                      <span>White-Glove Delivery</span>
                    </div>
                  </div>

                  <div className="space-y-4.5">
                    {/* 3 Selects: Tỉnh / Quận / Phường */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-2 uppercase tracking-wider">
                          Tỉnh / Thành Phố <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="shipping_province_id"
                            value={formData.shipping_province_id}
                            onChange={handleChange}
                            className="w-full h-11 appearance-none bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl px-4 pr-10 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-xs truncate cursor-pointer"
                          >
                            <option value="">Chọn Tỉnh / Thành Phố</option>
                            {provinces.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-2 uppercase tracking-wider">
                          Quận / Huyện <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="shipping_district_id"
                            value={formData.shipping_district_id}
                            onChange={handleChange}
                            disabled={districts.length === 0}
                            className="w-full h-11 appearance-none bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl px-4 pr-10 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-xs truncate cursor-pointer disabled:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="">Chọn Quận / Huyện</option>
                            {districts.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-2 uppercase tracking-wider">
                          Phường / Xã <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="shipping_ward_code"
                            value={formData.shipping_ward_code}
                            onChange={handleChange}
                            disabled={wards.length === 0}
                            className="w-full h-11 appearance-none bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl px-4 pr-10 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-xs truncate cursor-pointer disabled:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="">Chọn Phường / Xã</option>
                            {wards.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 mb-2 uppercase tracking-wider">
                        <MapPin size={13} className="text-amber-600" />
                        Địa Chỉ Chi Tiết (Số nhà, Tên đường, Căn hộ/Tòa nhà) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="shipping_address"
                        required
                        placeholder="Ví dụ: Căn 1205 Tòa S2, Vinhomes Skylake, Phạm Hùng"
                        value={formData.shipping_address}
                        onChange={handleChange}
                        className="w-full h-11 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl px-4 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 mb-2 uppercase tracking-wider">
                        <FileText size={13} className="text-neutral-400" />
                        Ghi Chú Đơn Hàng / Yêu Cầu Lắp Đặt
                      </label>
                      <textarea
                        name="notes"
                        rows={2}
                        placeholder="Ví dụ: Giao giờ hành chính, căn hộ có thang máy hàng, kiểm tra màu sắc kỹ..."
                        value={formData.notes}
                        onChange={handleChange}
                        className="w-full bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-xs resize-none"
                      />
                    </div>

                    {/* Shipping Method Options */}
                    <div className="pt-4 border-t border-neutral-100">
                      <label className="block text-xs font-medium text-neutral-700 mb-3 uppercase tracking-wider">
                        Gói Vận Chuyển & Lắp Đặt Nội Thất (GHN Express)
                      </label>
                      <div className="space-y-3">
                        {shippingMethods.length === 0 && !calculatingShipping && (
                          <div className="p-5 bg-neutral-50/80 border border-dashed border-neutral-300 rounded-xl text-center">
                            <Truck size={24} className="mx-auto text-neutral-400 mb-2 opacity-60" />
                            <p className="text-xs text-neutral-600">
                              Vui lòng chọn <strong>Tỉnh/Thành → Quận/Huyện → Phường/Xã</strong> ở trên để tải phí vận chuyển GHN chính xác nhất.
                            </p>
                          </div>
                        )}
                        {shippingError && shippingMethods.length > 0 && (
                          <div className="p-3.5 bg-amber-50/80 border border-amber-300/80 rounded-xl text-center">
                            <p className="text-xs text-amber-800">{shippingError}</p>
                          </div>
                        )}
                        {calculatingShipping && (
                          <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl text-center">
                            <div className="flex items-center justify-center gap-2.5 text-xs text-neutral-700 font-medium">
                              <Loader2 className="animate-spin h-4 w-4 text-amber-600" />
                              Đang kết nối hệ thống GHN để tính cước phí thực tế...
                            </div>
                          </div>
                        )}
                        {shippingMethods.map((method) => {
                          const isSelected = formData.shipping_method === method.id;
                          return (
                            <label
                              key={method.id}
                              onClick={() => handleSelectShippingMethod(method)}
                              className={`flex items-start justify-between p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? "border-amber-600 bg-amber-50/40 shadow-xs ring-1 ring-amber-600/30"
                                  : "border-neutral-200 hover:border-neutral-300 bg-white"
                              }`}
                            >
                              <div className="flex items-start gap-3.5">
                                <div className="pt-0.5">
                                  <input
                                    type="radio"
                                    name="shipping_method"
                                    value={method.id}
                                    checked={isSelected}
                                    onChange={() => handleSelectShippingMethod(method)}
                                    className="w-4 h-4 text-amber-600 accent-amber-600 cursor-pointer"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-neutral-900">{method.name}</span>
                                    {method.badge && (
                                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        {method.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-neutral-500 mt-1">{method.description}</p>
                                  <p className="text-xs text-amber-700 font-medium mt-1.5 flex items-center gap-1">
                                    <span>⏱️ Thời gian dự kiến:</span>
                                    <strong className="font-semibold">{method.estimated_delivery}</strong>
                                  </p>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-neutral-900 shrink-0 ml-4">
                                {method.fee === 0 ? (
                                  <span className="text-emerald-700 font-semibold">MIỄN PHÍ</span>
                                ) : (
                                  formatPrice(method.fee)
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Payment Method */}
                <div className="bg-white/95 rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200/80 backdrop-blur-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between pb-5 border-b border-neutral-100 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-neutral-900 text-amber-400 font-serif font-bold text-sm flex items-center justify-center shadow-xs">
                        3
                      </span>
                      <div>
                        <h2 className="font-serif text-lg md:text-xl text-neutral-900 font-medium">
                          Phương Thức Thanh Toán
                        </h2>
                        <p className="text-xs text-neutral-400">Giao dịch bảo mật đa kênh qua cổng thanh toán liên kết ngân hàng</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-200">
                      <Lock size={12} className="text-amber-600" />
                      <span>PCI-DSS Chuẩn Ngân Hàng</span>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {/* Bank Transfer / VietQR */}
                    <label
                      className={`flex items-start gap-3.5 p-4.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.payment_method === "bank_transfer"
                          ? "border-amber-600 bg-amber-50/40 shadow-xs ring-1 ring-amber-600/30"
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="bank_transfer"
                        checked={formData.payment_method === "bank_transfer"}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 text-amber-600 accent-amber-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-medium text-sm text-neutral-900 flex items-center gap-2">
                            <span>Chuyển Khoản Ngân Hàng (Quét Mã VietQR Tự Động)</span>
                          </p>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                            Khuyên dùng • Nhanh nhất
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Tự động sinh mã VietQR theo từng đơn hàng, tiền vào tài khoản xác nhận ngay lập tức 24/7.
                        </p>
                      </div>
                    </label>

                    {/* VNPAY */}
                    <label
                      className={`flex items-start gap-3.5 p-4.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.payment_method === "vnpay"
                          ? "border-amber-600 bg-amber-50/40 shadow-xs ring-1 ring-amber-600/30"
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="vnpay"
                        checked={formData.payment_method === "vnpay"}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 text-amber-600 accent-amber-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-medium text-sm text-neutral-900">
                            Cổng VNPAY / Thẻ Quốc Tế (Visa, Master, JCB, ATM Nội Địa)
                          </p>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200/50">
                            VNPAY Gateway
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Hỗ trợ hơn 40 ngân hàng Việt Nam và các loại thẻ tín dụng/ghi nợ quốc tế.
                        </p>
                      </div>
                    </label>

                    {/* MoMo */}
                    <label
                      className={`flex items-start gap-3.5 p-4.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.payment_method === "momo"
                          ? "border-amber-600 bg-amber-50/40 shadow-xs ring-1 ring-amber-600/30"
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="momo"
                        checked={formData.payment_method === "momo"}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 text-amber-600 accent-amber-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-medium text-sm text-neutral-900">
                            Ví Điện Tử MoMo (Quét Mã QR MoMo)
                          </p>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full border border-pink-200/50">
                            MoMo Pay
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Thanh toán bảo mật tức thì qua ứng dụng MoMo trên điện thoại thông minh.
                        </p>
                      </div>
                    </label>

                    {/* COD */}
                    <label
                      className={`flex items-start gap-3.5 p-4.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.payment_method === "cod"
                          ? "border-amber-600 bg-amber-50/40 shadow-xs ring-1 ring-amber-600/30"
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="cod"
                        checked={formData.payment_method === "cod"}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 text-amber-600 accent-amber-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-medium text-sm text-neutral-900">
                            Thanh Toán Khi Nhận Hàng (COD)
                          </p>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
                            Kiểm tra khi nhận
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Quý khách kiểm tra hàng thực tế tại nhà trước khi thanh toán. Áp dụng cho đơn hàng dưới 50 triệu.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary (Col 5 / 12) */}
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="bg-white/95 rounded-2xl p-6 md:p-7 shadow-sm border border-neutral-200/80 backdrop-blur-sm sticky top-24 space-y-6">
                  {/* Summary Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={18} className="text-amber-600" />
                      <h2 className="font-serif text-lg text-neutral-900 font-semibold">Tóm Tắt Đơn Hàng</h2>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200/60">
                      {cartCount} sản phẩm
                    </span>
                  </div>

                  {/* Cart Items List */}
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-1 divide-y divide-neutral-100">
                    {cart.map((item, index) => (
                      <div key={`${item.product.id}-${index}`} className="flex gap-3 pt-3 first:pt-0">
                        <div className="relative w-16 h-16 bg-neutral-100 rounded-xl flex-shrink-0 overflow-hidden border border-neutral-200/60">
                          <Image
                            src={item.product.image || "/images/placeholder.jpg"}
                            alt={item.product.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-neutral-800 line-clamp-1">{item.product.name}</p>
                          {item.variant && (
                            <p className="text-[11px] text-neutral-500 mt-0.5">{item.variant.name}</p>
                          )}
                          <p className="text-[11px] text-neutral-400 mt-0.5">Số lượng: x{item.quantity}</p>
                        </div>
                        <span className="text-xs font-bold text-neutral-900 shrink-0 self-center">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="pt-4 border-t border-neutral-100 space-y-2.5 text-xs">
                    <div className="flex justify-between text-neutral-600">
                      <span>Tạm tính hàng ({cartCount} món)</span>
                      <span className="font-medium text-neutral-800">{formatPrice(cartSubtotal)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span className="flex items-center gap-1">
                          <Tag size={12} />
                          Voucher giảm giá
                        </span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}

                    {coinsDiscount > 0 && (
                      <div className="flex justify-between text-amber-700 font-medium">
                        <span className="flex items-center gap-1">
                          <Coins size={12} />
                          Giảm trừ Coins ({coinsToUse} xu)
                        </span>
                        <span>-{formatPrice(coinsDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-neutral-600">
                      <span>Phí vận chuyển & lắp đặt</span>
                      <span className="font-medium text-neutral-800">
                        {shippingFee === 0 ? (
                          <span className="text-emerald-700 font-semibold">MIỄN PHÍ</span>
                        ) : (
                          formatPrice(shippingFee)
                        )}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-neutral-200/80 flex items-baseline justify-between">
                      <span className="font-serif text-sm font-semibold text-neutral-900">Tổng thanh toán</span>
                      <div className="text-right">
                        <span className="font-serif text-xl font-bold text-amber-700">
                          {formatPrice(totalAmount)}
                        </span>
                        <p className="text-[10px] text-neutral-400 mt-0.5">(Đã bao gồm thuế VAT)</p>
                      </div>
                    </div>
                  </div>

                  {/* Voucher Section */}
                  <div className="pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        <BadgePercent size={14} className="text-amber-600" />
                        Mã Giảm Giá / Voucher
                      </label>
                      {availableVouchers.length > 0 && !appliedVoucher && (
                        <button
                          type="button"
                          onClick={() => setShowVoucherList(!showVoucherList)}
                          className="text-[11px] text-amber-700 hover:text-amber-800 font-medium underline"
                        >
                          {showVoucherList ? "Đóng danh sách" : `Xem voucher (${availableVouchers.length})`}
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={voucherInput}
                        onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                        placeholder="Nhập mã ưu đãi"
                        disabled={applyingVoucher || !!appliedVoucher}
                        className="flex-1 h-10 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl px-3.5 text-xs text-neutral-800 uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-xs disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={applyingVoucher || !voucherInput.trim() || !!appliedVoucher}
                        className="px-4.5 h-10 rounded-xl bg-neutral-900 hover:bg-amber-700 text-white text-xs font-medium tracking-wide uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-xs flex items-center justify-center gap-1.5"
                      >
                        {applyingVoucher ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          "Áp Dụng"
                        )}
                      </button>
                    </div>

                    {voucherError && <p className="mt-1.5 text-[11px] text-red-600 font-medium">{voucherError}</p>}
                    {voucherSuccess && <p className="mt-1.5 text-[11px] text-emerald-600 font-medium">{voucherSuccess}</p>}

                    {appliedVoucher && (
                      <div className="mt-2.5 flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-700" />
                          <span className="text-xs text-emerald-800 font-semibold">{appliedVoucher.code}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveVoucher}
                          className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    )}

                    {/* Voucher Quick Select List */}
                    {showVoucherList && !appliedVoucher && (
                      <div className="mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 max-h-48 overflow-y-auto">
                        <p className="text-[11px] font-semibold text-neutral-600">Voucher khả dụng cho đơn hàng:</p>
                        {availableVouchers.map((v) => (
                          <div
                            key={v.id}
                            onClick={() => {
                              setVoucherInput(v.code);
                              applyVoucherCode(v.code);
                              setShowVoucherList(false);
                            }}
                            className="p-2.5 bg-white rounded-lg border border-neutral-200 hover:border-amber-600 cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div>
                              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                {v.code}
                              </span>
                              <p className="text-[11px] text-neutral-600 mt-1">{v.name}</p>
                            </div>
                            <span className="text-[11px] font-semibold text-neutral-900 underline ml-2">Chọn</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Referral Code */}
                  <div className="pt-4 border-t border-neutral-100">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wider">
                      <Gift size={13} className="text-amber-600" />
                      Mã Giới Thiệu (Nếu Có)
                    </label>
                    <input
                      type="text"
                      name="referral_code"
                      value={referralCode || ""}
                      onChange={handleChange}
                      placeholder="Nhập mã giới thiệu người quen"
                      className="w-full h-10 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl px-3.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-xs"
                    />
                  </div>

                  {/* GS Coins */}
                  <div className="pt-4 border-t border-neutral-100">
                    <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/50">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCoins}
                          onChange={(e) => setUseCoins(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-amber-600 accent-amber-600 focus:ring-amber-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                            <Coins size={14} className="text-amber-600" />
                            <span>Sử dụng GS Coins tích lũy</span>
                          </div>
                          <p className="text-[11px] text-neutral-600 mt-0.5">
                            Hiện có: <strong className="text-amber-700">{userCoins.toLocaleString("vi-VN")} coins</strong> (= {formatPrice(userCoins * 1000)})
                          </p>
                          {useCoins && coinsDiscount > 0 && (
                            <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                              ✓ Giảm trực tiếp: -{formatPrice(coinsDiscount)}
                            </p>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSubmitOrder}
                      disabled={loading || (shippingMethods.length === 0 && !formData.shipping_province_id)}
                      className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-800 hover:from-amber-700 hover:via-amber-700 hover:to-amber-600 text-white font-medium text-sm transition-all duration-300 shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2 w-full py-1">
                          <Loader2 className="animate-spin h-5 w-5 text-amber-400" />
                          <span className="text-sm font-medium">Đang xử lý đơn hàng...</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5 text-left">
                            <Lock size={16} className="text-amber-400 group-hover:text-white transition-colors" />
                            <span className="font-semibold text-sm tracking-wide">Đặt Hàng Ngay</span>
                          </div>
                          <span className="font-serif text-base font-bold text-amber-300 group-hover:text-white transition-colors">
                            {formatPrice(totalAmount)}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Trust & Guarantee Badges */}
                  <div className="pt-4 border-t border-neutral-100 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <ShieldCheck size={14} className="text-amber-600 shrink-0" />
                      <span>100% Nội Thất Cao Cấp Chính Hãng & Độc Bản</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <Truck size={14} className="text-amber-600 shrink-0" />
                      <span>Giao hàng & Lắp đặt tận phòng chuyên nghiệp</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <Lock size={14} className="text-amber-600 shrink-0" />
                      <span>Bảo mật giao dịch mã hóa SSL 256-bit</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </SiteChrome>
    </main>
  );
}