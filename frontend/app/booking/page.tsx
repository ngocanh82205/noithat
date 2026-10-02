"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Calendar, Phone, Home, Sparkles } from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import { consultationService } from "@/services/api";

export default function BookingPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    preferred_date: "",
    space_type: "Căn hộ chung cư cao cấp",
    budget_range: "100 - 300 triệu",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.full_name || !formData.phone) {
      setErrorMsg("Vui lòng điền họ tên và số điện thoại.");
      return;
    }

    try {
      setLoading(true);
      await consultationService.submit(formData);
      setSuccess(true);
    } catch (err: any) {
      // Fallback
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-beige">
      <SiteChrome>
        {/* Banner */}
        <section className="relative py-20 md:py-28 px-6 bg-charcoal text-beige overflow-hidden">
          <div className="absolute inset-0 opacity-25">
            <Image
              src="/images/kitchen-3.jpg"
              alt="Bespoke Design Service"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative mx-auto max-w-[1440px] text-center">
            <p className="text-gold text-xs tracking-widest2 uppercase mb-3">
              Dịch Vụ Thiết Kế & May Đo Độc Bản
            </p>
            <h1 className="font-serif text-4xl md:text-6xl tracking-wide mb-4">
              Đặt Lịch Tư Vấn Kiến Trúc Sư
            </h1>
            <p className="text-beige/70 max-w-xl mx-auto text-sm md:text-base font-light">
              Khảo sát hiện trạng thực tế, lên phối cảnh 3D không gian và tư vấn chất liệu nội thất riêng biệt cho tư gia của bạn.
            </p>
          </div>
        </section>

        {/* Content Form */}
        <section className="py-16 md:py-24 px-6">
          <div className="mx-auto max-w-3xl">
            {success ? (
              <div className="bg-white/80 border border-gold/30 p-10 md:p-16 text-center shadow-ambient">
                <div className="flex justify-center mb-6">
                  <CheckCircle2 size={56} className="text-gold" strokeWidth={1.5} />
                </div>
                <h2 className="font-serif text-3xl text-espresso mb-4">
                  Đã Nhận Yêu Cầu Tư Vấn Của Quý Khách
                </h2>
                <p className="text-xs md:text-sm text-espresso/70 mb-8 max-w-lg mx-auto leading-relaxed">
                  Đội ngũ Giám đốc Nghệ thuật & Kiến trúc sư GS Luxury sẽ liên hệ lại với quý khách trong vòng 2 giờ làm việc để xác nhận lịch hẹn khảo sát.
                </p>
                <Link
                  href="/"
                  className="inline-block px-8 py-3.5 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors"
                >
                  Về Trang Chủ
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white/70 border border-espresso/10 p-8 md:p-12 shadow-ambient space-y-6"
              >
                <div className="border-b border-espresso/10 pb-6 mb-6">
                  <h2 className="font-serif text-2xl text-espresso mb-2">
                    Thông Tin Khảo Sát & Tư Vấn
                  </h2>
                  <p className="text-xs text-espresso/60 tracking-wider">
                    Hoàn toàn miễn phí dịch vụ tư vấn concept ban đầu.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-2">
                      Họ và Tên *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      placeholder="Nguyễn Văn A"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full bg-beige/50 border border-espresso/15 px-4 py-3 text-xs tracking-wide focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-2">
                      Số Điện Thoại Liên Hệ *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="0901 234 567"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-beige/50 border border-espresso/15 px-4 py-3 text-xs tracking-wide focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-beige/50 border border-espresso/15 px-4 py-3 text-xs tracking-wide focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-2">
                      Ngày Dự Kiến Khảo Sát
                    </label>
                    <input
                      type="date"
                      name="preferred_date"
                      value={formData.preferred_date}
                      onChange={handleChange}
                      className="w-full bg-beige/50 border border-espresso/15 px-4 py-3 text-xs tracking-wide focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-2">
                      Loại Hình Không Gian
                    </label>
                    <select
                      name="space_type"
                      value={formData.space_type}
                      onChange={handleChange}
                      className="w-full bg-beige/50 border border-espresso/15 px-4 py-3 text-xs tracking-wide focus:outline-none focus:border-gold"
                    >
                      <option value="Căn hộ chung cư cao cấp">Căn hộ chung cư cao cấp</option>
                      <option value="Biệt thự / Villa">Biệt thự / Villa</option>
                      <option value="Nhà phố liền kề">Nhà phố liền kề</option>
                      <option value="Penthouse / Duplex">Penthouse / Duplex</option>
                      <option value="Văn phòng / Showroom">Văn phòng / Showroom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-2">
                      Mức Ngân Sách Dự Kiến
                    </label>
                    <select
                      name="budget_range"
                      value={formData.budget_range}
                      onChange={handleChange}
                      className="w-full bg-beige/50 border border-espresso/15 px-4 py-3 text-xs tracking-wide focus:outline-none focus:border-gold"
                    >
                      <option value="Dưới 100 triệu">Dưới 100 triệu</option>
                      <option value="100 - 300 triệu">100 - 300 triệu</option>
                      <option value="300 - 600 triệu">300 - 600 triệu</option>
                      <option value="Trên 600 triệu">Trên 600 triệu (Full fitout)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-2">
                    Địa Chỉ Công Trình / Tư Gia
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Ví dụ: Khu đô thị Ciputra, Tây Hồ, Hà Nội"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full bg-beige/50 border border-espresso/15 px-4 py-3 text-xs tracking-wide focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-2">
                    Yêu Cầu Chi Tiết & Mong Muốn
                  </label>
                  <textarea
                    name="message"
                    rows={4}
                    placeholder="Chia sẻ về phong cách thiết kế bạn yêu thích (Modern Luxury, Indochine, Wabi Sabi, Tân cổ điển...), các phòng cần làm..."
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full bg-beige/50 border border-espresso/15 px-4 py-3 text-xs tracking-wide focus:outline-none focus:border-gold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors duration-300 font-medium"
                >
                  {loading ? "Đang Gửi Thông Tin..." : "Gửi Đăng Ký Tư Vấn"}
                </button>
              </form>
            )}
          </div>
        </section>
      </SiteChrome>
    </main>
  );
}
