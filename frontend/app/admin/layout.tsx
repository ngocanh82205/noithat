"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Ticket,
  HelpCircle,
  Users,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Lock,
  Handshake,
} from "lucide-react";
import { useStore } from "@/components/StoreContext";

const ADMIN_NAV = [
  { label: "Tổng Quan", href: "/admin", icon: LayoutDashboard },
  { label: "Sản Phẩm", href: "/admin/products", icon: Package },
  { label: "Đơn Hàng", href: "/admin/orders", icon: ShoppingBag },
  { label: "Mã Giảm Giá", href: "/admin/vouchers", icon: Ticket },
  { label: "Hỏi Đáp Q&A", href: "/admin/faqs", icon: HelpCircle },
  { label: "Khách Hàng", href: "/admin/customers", icon: Users },
  { label: "Hoa Hồng CTV", href: "/admin/withdrawals", icon: Handshake },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, loginUser, logoutUser } = useStore();
  const [mobileSidebar, setMobileSidebar] = useState(false);

  // Admin login states if not authenticated
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    const res = await loginUser({ email: adminEmail, password: adminPassword });
    setLoggingIn(false);
    if (!res.success) {
      setLoginError(res.message || "Tài khoản hoặc mật khẩu không đúng.");
    }
  };

  const isAdmin = isAuthenticated && user && (user.role === "admin" || user.role === "seller" || user.role === "staff");

  // If not logged in as Admin, show high-end Admin Login Screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md bg-espresso border border-gold/30 p-8 shadow-2xl text-beige z-10">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-gold/20 border border-gold flex items-center justify-center mx-auto mb-3 text-gold">
              <Lock size={22} />
            </div>
            <h1 className="font-serif text-2xl text-champagne">
              GS LUXURY PORTAL
            </h1>
            <p className="text-xs text-beige/60 tracking-widest2 uppercase mt-1">
              Hệ Thống Quản Trị Sàn &amp; Người Bán
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3 bg-red-900/40 border border-red-500/50 text-red-200 text-xs text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest2 text-beige/70 mb-1.5">
                Email Quản Trị
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-black/40 border border-gold/20 px-4 py-3 text-xs text-beige focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest2 text-beige/70 mb-1.5">
                Mật Khẩu
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-black/40 border border-gold/20 px-4 py-3 text-xs text-beige focus:outline-none focus:border-gold"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 bg-gold text-charcoal font-semibold text-xs tracking-widest2 uppercase hover:bg-champagne transition-colors disabled:opacity-50 mt-2"
            >
              {loggingIn ? "Đang Xác Thực..." : "Đăng Nhập Quản Trị"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-beige flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-charcoal border-b border-gold/20 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebar(!mobileSidebar)}
            className="p-1.5 text-beige/80 hover:text-gold"
          >
            {mobileSidebar ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="font-serif text-lg tracking-widest2 text-champagne">
            GS ADMIN
          </span>
        </div>
        <Link
          href="/"
          target="_blank"
          className="text-xs text-gold flex items-center gap-1 hover:underline"
        >
          <span>Store</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`w-64 bg-charcoal border-r border-white/10 flex flex-col justify-between fixed lg:sticky top-0 h-screen z-40 transition-transform duration-300 ${
          mobileSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Logo & Role Badge */}
          <div className="p-6 border-b border-white/10">
            <Link href="/admin" className="font-serif text-xl tracking-widest2 text-champagne block">
              GS LUXURY
            </Link>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-gold/20 border border-gold/40 text-gold text-[10px] tracking-wider uppercase font-semibold rounded">
                Admin Panel
              </span>
              <span className="text-[11px] text-beige/50">v2.0</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebar(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs tracking-wider transition-all duration-200 ${
                    isActive
                      ? "bg-gold text-charcoal font-semibold shadow-md"
                      : "text-beige/70 hover:bg-white/5 hover:text-gold"
                  }`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin User Info */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs text-beige/60 hover:text-gold transition-colors rounded hover:bg-white/5"
          >
            <span className="flex items-center gap-2">
              <ExternalLink size={14} /> Xem Storefront
            </span>
            <span>↗</span>
          </Link>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-serif text-champagne truncate">{user?.name}</p>
              <p className="text-[10px] text-beige/40 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => logoutUser()}
              className="p-2 text-beige/50 hover:text-red-400 transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 min-w-0 overflow-y-auto max-w-[1600px]">
        {children}
      </main>
    </div>
  );
}
