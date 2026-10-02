"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Phone, Mail } from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import { orderService } from "@/services/api";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(true);
  const [message, setMessage] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    // 1. Kiểm tra nếu là callback từ VNPAY
    const vnpResponseCode = searchParams.get("vnp_ResponseCode");
    const vnpTxnRef = searchParams.get("vnp_TxnRef");

    if (vnpTxnRef) {
      setPaymentMethod("vnpay");
      const parts = vnpTxnRef.split("_");
      const num = parts[0] || vnpTxnRef;
      setOrderNumber(num);

      // Gọi API xác thực VNPAY
      orderService
        .verifyVnpayReturn(searchParams)
        .then((res) => {
          if (res.success && vnpResponseCode === "00") {
            setSuccess(true);
            setMessage("Giao dịch thanh toán VNPAY thành công.");
          } else {
            setSuccess(false);
            setMessage(res.message || "Giao dịch VNPAY không thành công hoặc đã bị hủy.");
          }
        })
        .catch((err) => {
          setSuccess(false);
          setMessage("Không thể xác thực giao dịch VNPAY.");
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    // 2. Kiểm tra nếu là callback từ MoMo
    const momoResultCode = searchParams.get("resultCode");
    const momoOrderId = searchParams.get("orderId");

    if (momoOrderId) {
      setPaymentMethod("momo");
      const parts = momoOrderId.split("_");
      const num = parts[0] || momoOrderId;
      setOrderNumber(num);

      orderService
        .verifyMomoReturn(searchParams)
        .then((res) => {
          const isSuccess = res.success && (momoResultCode === "0" || (res.data as any)?.resultCode === "0" || (res.data as any)?.data?.resultCode === "0");
          if (isSuccess) {
            setSuccess(true);
            setMessage("Giao dịch thanh toán MoMo thành công.");
          } else {
            setSuccess(false);
            setMessage(res.message || "Giao dịch MoMo không thành công.");
          }
        })
        .catch(() => {
          setSuccess(false);
          setMessage("Không thể xác thực giao dịch MoMo.");
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    // 3. Thông thường (COD / Chuyển khoản)
    const orderNum = searchParams.get("orderNumber");
    if (orderNum) {
      setOrderNumber(orderNum);
      setSuccess(true);
    }
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <main className="min-h-screen bg-beige">
        <SiteChrome>
          <section className="py-24 px-6">
            <div className="mx-auto max-w-xl bg-white/80 border border-espresso/10 p-12 text-center shadow-ambient">
              <Loader2 size={56} className="text-gold animate-spin mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-gold text-xs tracking-widest2 uppercase mb-2">Đang xác thực thanh toán...</p>
              <p className="text-xs text-espresso/60">Vui lòng chờ trong giây lát</p>
            </div>
          </section>
        </SiteChrome>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-beige">
      <SiteChrome>
        <section className="py-16 md:py-24 px-6">
          <div className="mx-auto max-w-2xl bg-white/80 border border-espresso/10 p-8 md:p-12 text-center shadow-ambient">
            {success ? (
              <>
                <div className="flex justify-center mb-6">
                  <CheckCircle2 size={56} className="text-gold" strokeWidth={1.5} />
                </div>
                <p className="text-gold text-xs tracking-widest2 uppercase mb-2">Đặt Hàng Thành Công</p>
                <h1 className="font-serif text-3xl md:text-4xl text-espresso mb-4">
                  Cảm Ơn Quý Khách Đã Lựa Chọn GS Luxury
                </h1>
                {orderNumber && (
                  <p className="text-xs md:text-sm text-espresso/70 mb-4 max-w-md mx-auto leading-relaxed">
                    Mã đơn hàng của quý khách là:{" "}
                    <span className="font-bold text-espresso font-mono text-sm">{orderNumber}</span>
                  </p>
                )}
                {message && (
                  <div className="p-3 bg-gold/10 border border-gold/30 rounded text-xs text-espresso/80 mb-6 max-w-md mx-auto">
                    {message}
                  </div>
                )}
                <p className="text-xs text-espresso/60 mb-8 max-w-md mx-auto">
                  Chúng tôi đã gửi email xác nhận chi tiết đơn hàng đến quý khách. Bộ phận Concierge sẽ liên hệ sớm nhất.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} className="text-red-600" strokeWidth={1.5} />
                </div>
                <p className="text-red-600 text-xs tracking-widest2 uppercase mb-2">Thanh Toán Chưa Hoàn Tất</p>
                <h1 className="font-serif text-3xl text-espresso mb-4">Giao Dịch Bị Hủy Hoặc Thất Bại</h1>
                {orderNumber && (
                  <p className="text-xs md:text-sm text-espresso/70 mb-4">
                    Mã đơn hàng: <span className="font-bold font-mono">{orderNumber}</span>
                  </p>
                )}
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 mb-6 max-w-md mx-auto">
                  {message || "Giao dịch thanh toán chưa được xác nhận thành công."}
                </div>
              </>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link
                href="/products"
                className="w-full sm:w-auto px-8 py-3.5 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors flex items-center justify-center gap-2"
              >
                Tiếp Tục Mua Sắm
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-8 py-3.5 border border-espresso/20 text-espresso text-xs tracking-widest2 uppercase hover:border-gold hover:text-gold transition-colors"
              >
                Về Trang Chủ
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t border-espresso/10 text-xs text-espresso/60 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gold" />
                <span>Hotline: 1900 8888</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gold" />
                <span>concierge@gsluxury.vn</span>
              </div>
            </div>
          </div>
        </section>
      </SiteChrome>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-beige flex items-center justify-center">
          <Loader2 size={40} className="text-gold animate-spin" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
