"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, QrCode, Phone, Mail, ArrowRight, AlertCircle, Loader2, XCircle } from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import { formatPrice } from "@/lib/products";
import { orderService, MomoReturnResponse } from "@/services/api";

export default function OrderSuccessPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const searchParams = useSearchParams();
  const paymentMethod = searchParams.get("method") || "bank_transfer";
  const amount = parseFloat(searchParams.get("amount") || "0");

  const vietQrUrl = `https://img.vietqr.io/image/MB-0901234567-compact.png?amount=${amount}&addInfo=${params.orderNumber}&accountName=CONG%20TY%20NOI%20THAT%20GS%20LUXURY`;

  // MoMo return verification state
  const [momoVerification, setMomoVerification] = useState<MomoReturnResponse | null>(null);
  const [verifyingMomo, setVerifyingMomo] = useState(false);

  // Verify MoMo return when payment method is momo
  useEffect(() => {
    if (paymentMethod === "momo") {
      setVerifyingMomo(true);
      orderService.verifyMomoReturn(searchParams).then((res) => {
        // Phản hồi của /momo/return chính là MomoReturnResponse ({success, message, data})
        setMomoVerification(res as unknown as MomoReturnResponse);
        setVerifyingMomo(false);
      }).catch(() => {
        setVerifyingMomo(false);
      });
    }
  }, [paymentMethod, searchParams]);

  // Trang này có thể được mở lại sau này (link cũ, lịch sử trình duyệt): kiểm tra trạng thái thật của đơn
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  useEffect(() => {
    orderService
      .trackOrder(params.orderNumber)
      .then((res) => {
        if (res.success && res.data) setOrderStatus(res.data.order_status || res.data.status || null);
      })
      .catch(() => {});
  }, [params.orderNumber]);
  const isClosedOrder = orderStatus === "cancelled" || orderStatus === "refunded";

  // Determine success status
  const isMoMoSuccess = momoVerification?.success === true && momoVerification?.data?.signature_valid === true;
  const isMoMoFailed = momoVerification && (momoVerification.success === false || momoVerification.data?.signature_valid === false);
  const showSuccess = paymentMethod !== "momo" || isMoMoSuccess;
  const showFailure = isMoMoFailed;

  return (
    <main className="min-h-screen bg-beige">
      <SiteChrome>
        <section className="py-16 md:py-24 px-6">
          <div className="mx-auto max-w-2xl bg-white/80 border border-espresso/10 p-8 md:p-12 text-center shadow-ambient">
            {isClosedOrder ? (
              <div className="flex flex-col items-center gap-4">
                <XCircle size={56} className="text-red-500" strokeWidth={1.5} />
                <p className="text-red-600 text-xs tracking-widest2 uppercase">
                  {orderStatus === "cancelled" ? "Đơn Hàng Đã Hủy" : "Đơn Hàng Đã Hoàn Tiền"}
                </p>
                <h1 className="font-serif text-3xl md:text-4xl text-espresso">
                  Đơn {params.orderNumber} không còn hiệu lực
                </h1>
                <Link
                  href={`/orders/${params.orderNumber}`}
                  className="text-xs text-gold hover:underline tracking-wider"
                >
                  Xem chi tiết trạng thái đơn hàng →
                </Link>
              </div>
            ) : verifyingMomo && paymentMethod === "momo" ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 size={56} className="text-gold animate-spin" strokeWidth={1.5} />
                <p className="text-gold text-xs tracking-widest2 uppercase">
                  Đang Xác Thực Thanh Toán MoMo...
                </p>
                <p className="text-xs text-espresso/60">
                  Vui lòng đợi trong giây lát...
                </p>
              </div>
            ) : showFailure ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle size={48} className="text-red-600" strokeWidth={1.5} />
                </div>
                <p className="text-red-600 text-xs tracking-widest2 uppercase mb-2">
                  Thanh Toán Không Hợp Lệ
                </p>
                <h1 className="font-serif text-3xl md:text-4xl text-espresso mb-4">
                  Xác Thực Chữ Ký MoMo Thất Bại
                </h1>
                <p className="text-xs md:text-sm text-espresso/70 mb-8 max-w-md mx-auto leading-relaxed">
                  Mã đơn hàng: <span className="font-bold text-espresso font-mono text-sm">{params.orderNumber}</span>
                  <br />
                  Lý do: {momoVerification?.message || "Chữ ký không hợp lệ - có thể URL bị giả mạo."}
                  <br />
                  Vui lòng liên hệ hotline 1900 8888 để được hỗ trợ.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <CheckCircle2 size={56} className="text-gold" strokeWidth={1.5} />
                </div>

                <p className="text-gold text-xs tracking-widest2 uppercase mb-2">
                  Đặt Hàng Thành Công
                </p>
                <h1 className="font-serif text-3xl md:text-4xl text-espresso mb-4">
                  Cảm Ơn Quý Khách Đã Lựa Chọn GS Luxury
                </h1>
                <p className="text-xs md:text-sm text-espresso/70 mb-8 max-w-md mx-auto leading-relaxed">
                  Mã đơn hàng của quý khách là:{" "}
                  <span className="font-bold text-espresso font-mono text-sm">
                    {params.orderNumber}
                  </span>
                  . Chúng tôi đã gửi email xác nhận chi tiết đơn hàng đến bạn.
                </p>
                <Link
                  href={`/orders/${params.orderNumber}`}
                  className="inline-block -mt-4 mb-6 text-xs text-gold hover:underline tracking-wider"
                >
                  Theo dõi trạng thái đơn hàng →
                </Link>

                {/* MoMo Success Info */}
                {paymentMethod === "momo" && isMoMoSuccess && momoVerification?.data && (
                  <div className="my-8 p-4 bg-gold/10 border border-gold/30 rounded-lg text-left">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 size={18} className="text-gold" />
                      <h3 className="font-serif text-base text-espresso">
                        Thanh Toán MoMo Thành Công
                      </h3>
                    </div>
                    <div className="space-y-1 text-xs text-espresso/80">
                      <p><strong className="text-espresso">Mã giao dịch:</strong> <span className="font-mono">{momoVerification.data.transId}</span></p>
                      <p><strong className="text-espresso">Số tiền:</strong> <span className="font-bold text-espresso">{formatPrice(momoVerification.data.amount || amount)}</span></p>
                      <p><strong className="text-espresso">Thời gian:</strong> {momoVerification.data.message}</p>
                    </div>
                  </div>
                )}

                {/* If Bank Transfer / VietQR */}
                {paymentMethod === "bank_transfer" && amount > 0 && (
                  <div className="my-8 p-6 bg-beige/60 border border-gold/30 text-left">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-espresso/10">
                      <QrCode size={20} className="text-gold" />
                      <h3 className="font-serif text-lg text-espresso">
                        Quét Mã VietQR Để Hoàn Tất Thanh Toán
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="flex justify-center bg-white p-3 border border-espresso/10">
                        <Image
                          src={vietQrUrl}
                          alt="VietQR GS Luxury"
                          width={192}
                          height={192}
                          unoptimized
                          className="w-48 h-48 object-contain"
                        />
                      </div>

                      <div className="space-y-2 text-xs text-espresso/80">
                        <p>
                          <strong className="text-espresso">Ngân hàng:</strong> MB Bank (Quân Đội)
                        </p>
                        <p>
                          <strong className="text-espresso">Số tài khoản:</strong>{" "}
                          <span className="font-mono font-bold text-gold">0901234567</span>
                        </p>
                        <p>
                          <strong className="text-espresso">Chủ TK:</strong> CÔNG TY CP NỘI THẤT GS LUXURY
                        </p>
                        <p>
                          <strong className="text-espresso">Số tiền:</strong>{" "}
                          <span className="font-bold text-espresso">{formatPrice(amount)}</span>
                        </p>
                        <p>
                          <strong className="text-espresso">Nội dung CK:</strong>{" "}
                          <span className="font-mono bg-white px-2 py-1 border border-espresso/15">
                            {params.orderNumber}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link
                href="/products"
                className="w-full sm:w-auto px-8 py-3.5 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors flex items-center justify-center gap-2"
              >
                Tiếp Tục Khám Phá
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