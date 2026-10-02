"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "./StoreContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount, openCart, isAuthenticated, openAuth, openVisualSearch } = useStore();

  const isHome = pathname === "/";
  const isProducts = pathname?.startsWith("/products");
  const isCollections = pathname?.startsWith("/collections");
  const isAccount = pathname?.startsWith("/account");

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 py-2 flex items-center justify-around shadow-2xl safe-area-bottom">
      {/* Home */}
      <Link
        href="/"
        className={`flex flex-col items-center space-y-1 py-1 px-2 rounded-lg transition-colors ${
          isHome ? "text-gold font-semibold" : "text-gray-500 hover:text-wood-dark"
        }`}
      >
        <span className="text-xl">🏠</span>
        <span className="text-[10px] tracking-tight">Trang chủ</span>
      </Link>

      {/* Collections / Products */}
      <Link
        href="/products"
        className={`flex flex-col items-center space-y-1 py-1 px-2 rounded-lg transition-colors ${
          isProducts || isCollections ? "text-gold font-semibold" : "text-gray-500 hover:text-wood-dark"
        }`}
      >
        <span className="text-xl">🛋️</span>
        <span className="text-[10px] tracking-tight">Sản phẩm</span>
      </Link>

      {/* Visual Search AI Button (Center Highlight) */}
      <button
        onClick={openVisualSearch}
        className="flex flex-col items-center -mt-5 bg-gradient-to-tr from-gold to-gold-dark text-white p-3 rounded-full shadow-lg hover:scale-105 transition-transform"
        aria-label="Tìm kiếm hình ảnh"
      >
        <span className="text-xl">📷</span>
      </button>

      {/* Cart with count badge */}
      <button
        onClick={openCart}
        className="relative flex flex-col items-center space-y-1 py-1 px-2 rounded-lg text-gray-500 hover:text-wood-dark transition-colors"
      >
        <div className="relative">
          <span className="text-xl">🛍️</span>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-gold text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight">Giỏ hàng</span>
      </button>

      {/* Account / Login */}
      {isAuthenticated ? (
        <Link
          href="/account"
          className={`flex flex-col items-center space-y-1 py-1 px-2 rounded-lg transition-colors ${
            isAccount ? "text-gold font-semibold" : "text-gray-500 hover:text-wood-dark"
          }`}
        >
          <span className="text-xl">👤</span>
          <span className="text-[10px] tracking-tight">Tài khoản</span>
        </Link>
      ) : (
        <button
          onClick={() => openAuth("login")}
          className="flex flex-col items-center space-y-1 py-1 px-2 rounded-lg text-gray-500 hover:text-wood-dark transition-colors"
        >
          <span className="text-xl">🔑</span>
          <span className="text-[10px] tracking-tight">Đăng nhập</span>
        </button>
      )}
    </div>
  );
}
