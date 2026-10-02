"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { useRouter as useNextRouter } from "next/navigation";
import { useStore } from "@/components/StoreContext";
import { useToast } from "@/components/ToastProvider";
import SiteChrome from "@/components/SiteChrome";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginUser, openAuth } = useStore();
  const { showToast } = useToast();
  const nextRouter = useNextRouter();

  const redirect = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginUser({ email, password });

      if (res.success) {
        showToast({ type: "success", title: "Đăng nhập thành công", message: "Chào mừng bạn trở lại GS Luxury!" });
        nextRouter.push(redirect);
        nextRouter.refresh();
      } else {
        setError(res.message || "Đăng nhập không thành công");
        showToast({ type: "error", title: "Đăng nhập thất bại", message: res.message || "Email hoặc mật khẩu không chính xác" });
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại");
      showToast({ type: "error", title: "Lỗi", message: "Có lỗi xảy ra, vui lòng thử lại" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-beige">
      <SiteChrome>
        <div className="min-h-screen flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-md bg-white/80 border border-espresso/10 p-8 md:p-12 shadow-ambient relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center mb-10">
              <div className="w-14 h-14 rounded-full bg-gold/20 border border-gold flex items-center justify-center mx-auto mb-4 text-gold">
                <Lock size={26} />
              </div>
              <h1 className="font-serif text-2xl md:text-3xl text-espresso">
                Đăng Nhập GS Luxury
              </h1>
              <p className="text-xs text-espresso/60 tracking-widest2 uppercase mt-2">
                Truy cập tài khoản để tiếp tục mua sắm
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs text-center rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-espresso/40" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-beige/50 border border-espresso/15 text-xs tracking-wide focus:outline-none focus:border-gold transition-colors"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-2">
                  Mật Khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-espresso/40" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-12 py-3.5 bg-beige/50 border border-espresso/15 text-xs tracking-wide focus:outline-none focus:border-gold transition-colors"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-gold"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-gold rounded"
                  />
                  <span className="text-xs text-espresso/70">Ghi nhớ đăng nhập</span>
                </label>
                {/* Chưa có chức năng đặt lại mật khẩu -> hướng dẫn liên hệ thay vì link tới trang không tồn tại */}
                <button
                  type="button"
                  onClick={() =>
                    showToast({
                      type: "info",
                      title: "Quên mật khẩu",
                      message: "Vui lòng liên hệ CSKH GS Luxury (qua mục Tư Vấn hoặc AI Concierge) để được cấp lại mật khẩu.",
                    })
                  }
                  className="text-xs text-gold hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang Xử Lý...
                  </>
                ) : (
                  <>
                    Đăng Nhập
                    <ArrowLeft size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-espresso/10 text-center">
              <p className="text-xs text-espresso/60">
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => openAuth("register")}
                  className="text-gold hover:underline font-medium"
                >
                  Đăng ký ngay
                </button>
              </p>
            </div>

            <div className="mt-6">
              <Link
                href="/"
                className="text-xs text-espresso/50 hover:text-gold flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={13} /> Quay lại cửa hàng
              </Link>
            </div>
          </div>
        </div>
      </SiteChrome>
    </main>
  );
}