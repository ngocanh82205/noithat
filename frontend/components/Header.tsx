// components/Header.tsx — GS Luxury Header with Clean Responsive Flex Layout
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, Heart, ShoppingBag, Menu, X, ChevronDown, User, Gift, Camera, Sparkles } from "lucide-react";
import { useStore } from "./StoreContext";
import SearchModal from "./SearchModal";
import AuthModal from "./AuthModal";
import VisualSearchModal from "./VisualSearchModal";
import AffiliateModal from "./AffiliateModal";

const NAV_LINKS = [
  { label: "Sản Phẩm", href: "/products" },
  { label: "🤖 AI Stylist", href: "/ai-stylist" },
  { label: "✨ 3D Studio", href: "/studio-3d" },
  { label: "Phòng Khách", href: "/collections/living-room" },
  { label: "Phòng Ngủ", href: "/collections/bedroom" },
  { label: "Phòng Ăn", href: "/collections/dining" },
  { label: "Tư Vấn", href: "/booking" },
  { label: "Câu Chuyện", href: "/#heritage" },
];

const CURRENCIES = ["VND", "USD", "EUR"];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [currency, setCurrency] = useState("VND");
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const {
    cartCount,
    wishlist,
    openCart,
    isAuthenticated,
    user,
    openAuth,
    openWheel,
    userCoins,
    openVisualSearch,
    openAffiliate,
  } = useStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="w-full bg-charcoal text-champagne text-[11px] tracking-widest2 uppercase text-center py-2.5 px-4 font-medium overflow-hidden">
        Vận chuyển & lắp đặt chuyên nghiệp White-Glove tận nhà trên toàn quốc
      </div>

      {/* Main Header Navigation Bar */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-500 ease-luxe overflow-x-clip ${
          scrolled
            ? "bg-beige/95 backdrop-blur-md shadow-[0_1px_0_rgba(18,18,18,0.08)]"
            : "bg-beige border-b border-espresso/5"
        }`}
      >
        <div className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
            
            {/* Left: Mobile Menu Trigger + Brand Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                className="xl:hidden focus-ring p-2 -ml-2 text-espresso hover:text-gold transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="Mở menu"
              >
                <Menu strokeWidth={1.5} size={24} />
              </button>

              <Link
                href="/"
                className="font-serif text-xl sm:text-2xl 2xl:text-3xl tracking-widest2 text-espresso hover:text-gold transition-colors focus-ring whitespace-nowrap select-none"
              >
                GS LUXURY
              </Link>
            </div>

            {/* Center: Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center justify-center gap-3.5 2xl:gap-6 flex-1 px-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  prefetch={true}
                  className="text-xs 2xl:text-[13px] tracking-wider whitespace-nowrap text-espresso/80 hover:text-gold transition-colors duration-300 focus-ring font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right: Action Utilities & Icons */}
            <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
              {/* Currency Selector */}
              <div className="relative hidden 2xl:block">
                <button
                  onClick={() => setCurrencyOpen((v) => !v)}
                  className="flex items-center gap-1 text-xs px-2 py-1.5 text-espresso/80 hover:text-gold transition-colors focus-ring rounded"
                >
                  <span>{currency}</span>
                  <ChevronDown strokeWidth={1.5} size={13} />
                </button>
                <AnimatePresence>
                  {currencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 mt-1 bg-beige border border-espresso/10 shadow-ambient min-w-[80px] z-50 rounded py-1"
                    >
                      {CURRENCIES.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setCurrency(c);
                            setCurrencyOpen(false);
                          }}
                          className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gold/15 transition-colors text-espresso"
                        >
                          {c}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Lucky Wheel Mini Game Button */}
              <button
                onClick={openWheel}
                aria-label="Vòng quay may mắn"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gold/15 border border-gold/40 rounded-full text-gold hover:bg-gold hover:text-charcoal transition-all focus-ring shadow-sm"
                title="Vòng quay may mắn nhận Voucher"
              >
                <Gift size={15} className="animate-bounce" />
                <span className="hidden sm:inline text-[11px] font-semibold font-mono">
                  {userCoins} Xu
                </span>
              </button>

              {/* Affiliate CTV Button */}
              <button
                onClick={openAffiliate}
                aria-label="Tiếp thị liên kết CTV"
                className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 bg-sand/20 border border-sand/50 rounded-full text-wood-dark hover:border-gold hover:text-gold transition-all text-xs font-semibold"
                title="Tham gia CTV Affiliate nhận 5% hoa hồng"
              >
                <Sparkles size={14} className="text-gold" />
                <span>CTV 5%</span>
              </button>

              {/* Visual Search Button */}
              <button
                onClick={openVisualSearch}
                aria-label="Tìm bằng hình ảnh"
                className="p-2 text-espresso hover:text-gold transition-colors focus-ring"
                title="Tìm kiếm bằng hình ảnh / phong cách (AI)"
              >
                <Camera strokeWidth={1.5} size={20} />
              </button>

              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Tìm kiếm"
                className="p-2 text-espresso hover:text-gold transition-colors focus-ring"
                title="Tìm kiếm sản phẩm"
              >
                <Search strokeWidth={1.5} size={20} />
              </button>

              {/* User Account */}
              {isAuthenticated ? (
                <Link
                  href="/account"
                  className="flex items-center gap-1.5 p-1.5 text-espresso hover:text-gold transition-colors focus-ring"
                  title="Tài khoản của tôi"
                >
                  <div className="w-7 h-7 rounded-full bg-espresso text-gold flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden 2xl:inline text-xs font-serif max-w-[90px] truncate">
                    {user?.name?.split(" ")?.pop()}
                  </span>
                </Link>
              ) : (
                <button
                  onClick={() => openAuth("login")}
                  aria-label="Đăng nhập"
                  className="p-2 text-espresso hover:text-gold transition-colors focus-ring"
                  title="Đăng nhập / Đăng ký"
                >
                  <User strokeWidth={1.5} size={20} />
                </button>
              )}

              {/* Wishlist */}
              <Link
                href="/wishlist"
                aria-label="Sản phẩm yêu thích"
                className="relative p-2 text-espresso hover:text-gold transition-colors focus-ring"
                title={`Yêu thích (${wishlist.length})`}
              >
                <Heart strokeWidth={1.5} size={20} className={wishlist.length > 0 ? "fill-red-400 text-red-400" : ""} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full bg-red-400 text-white text-[9px] font-bold shadow-sm">
                    {wishlist.length}
                  </span>
                )}
              </Link>


              {/* Cart Drawer Trigger */}
              <button
                onClick={openCart}
                aria-label="Giỏ hàng"
                className="relative p-2 text-espresso hover:text-gold transition-colors focus-ring"
                title="Giỏ hàng"
              >
                <ShoppingBag strokeWidth={1.5} size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-charcoal text-[10px] font-bold shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-beige xl:hidden overflow-y-auto"
          >
            <div className="flex items-center justify-between h-20 px-6 border-b border-espresso/10">
              <span className="font-serif text-2xl tracking-widest2 text-espresso">
                GS LUXURY
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-espresso focus-ring"
                aria-label="Đóng menu"
              >
                <X strokeWidth={1.5} size={24} />
              </button>
            </div>

            <div className="px-6 py-6">
              {/* Account Box on Mobile */}
              {isAuthenticated ? (
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 p-4 bg-white/70 border border-espresso/15 mb-6 rounded"
                >
                  <div className="w-10 h-10 rounded-full bg-espresso text-gold flex items-center justify-center font-serif text-base font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-serif text-sm text-espresso font-semibold">{user?.name}</p>
                    <p className="text-xs text-espresso/60">{user?.email}</p>
                  </div>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    openAuth("login");
                  }}
                  className="w-full py-3 bg-espresso text-beige text-xs tracking-widest2 uppercase mb-6 font-medium"
                >
                  Đăng Nhập / Đăng Ký
                </button>
              )}

              {/* Mobile Links List */}
              <nav className="flex flex-col">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: i * 0.04,
                      duration: 0.3,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="py-4 border-b border-espresso/10 font-serif text-xl text-espresso flex items-center justify-between hover:text-gold transition-colors"
                    >
                      <span>{link.label}</span>
                      <span className="text-xs text-gold font-sans font-light">→</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Lucky Wheel Action in Mobile Menu */}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  openWheel();
                }}
                className="mt-8 w-full py-3.5 bg-gold/20 border border-gold text-charcoal font-serif text-sm font-semibold flex items-center justify-center gap-2 rounded"
              >
                <Gift size={18} className="text-gold" />
                <span>Vòng Quay May Mắn ({userCoins} GS Coins)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AuthModal />
      <VisualSearchModal />
      <AffiliateModal />
    </>
  );
}
