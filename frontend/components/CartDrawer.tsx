"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useStore } from "./StoreContext";
import { formatPrice } from "@/lib/products";

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
  } = useStore();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[70] bg-charcoal/50 backdrop-blur-sm"
            onClick={closeCart}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-[75] h-full w-full max-w-md bg-beige shadow-ambient-lg flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-espresso/10">
              <h2 className="font-serif text-2xl text-espresso">Giỏ Hàng Của Bạn</h2>
              <button
                onClick={closeCart}
                aria-label="Đóng giỏ hàng"
                className="p-1 text-espresso hover:text-gold transition-colors focus-ring"
              >
                <X strokeWidth={1.5} size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-espresso/40">
                  <ShoppingBag strokeWidth={1} size={48} className="mb-4 text-gold/40" />
                  <p className="font-serif text-lg text-espresso mb-1">Giỏ hàng đang trống</p>
                  <p className="text-xs text-espresso/60 tracking-wider">
                    Chọn các tuyệt tác nội thất vào không gian sống của bạn
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-espresso/10">
                  {cart.map((line) => {
                    const lineKey = `${line.product.id}-${line.variant?.id || "base"}`;
                    const linePrice = line.variant?.price || line.product.price;

                    return (
                      <li key={lineKey} className="flex gap-4 py-5 items-start">
                        <div className="relative w-20 h-24 shrink-0 overflow-hidden bg-champagne/20 border border-espresso/10">
                          <Image
                            src={line.variant?.image_url || line.product.image || "/images/sofa-1.jpg"}
                            alt={line.product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-base leading-tight text-espresso truncate">
                            {line.product.name}
                          </p>
                          {line.variant && (
                            <p className="text-[11px] text-espresso/60 mt-0.5">
                              {line.variant.name || line.variant.color_name}
                            </p>
                          )}
                          <p className="text-xs text-gold font-medium mt-1">
                            {formatPrice(linePrice)}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center border border-espresso/20 bg-white/60">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    line.product.id,
                                    line.quantity - 1,
                                    line.variant?.id
                                  )
                                }
                                className="px-2 py-1 text-espresso/60 hover:text-espresso"
                                aria-label="Giảm"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="px-2 text-xs font-medium text-espresso min-w-[20px] text-center">
                                {line.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    line.product.id,
                                    line.quantity + 1,
                                    line.variant?.id
                                  )
                                }
                                className="px-2 py-1 text-espresso/60 hover:text-espresso"
                                aria-label="Tăng"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(line.product.id, line.variant?.id)
                          }
                          aria-label={`Xóa ${line.product.name}`}
                          className="p-1 text-espresso/40 hover:text-red-600 transition-colors"
                        >
                          <X size={16} strokeWidth={1.5} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-6 py-6 border-t border-espresso/10 bg-white/40">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs tracking-wider uppercase text-espresso/60">
                    Tạm tính
                  </span>
                  <span className="font-serif text-xl text-gold font-semibold">
                    {formatPrice(cartSubtotal)}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block text-center w-full bg-espresso text-beige text-xs tracking-widest2 uppercase py-4 hover:bg-gold transition-colors duration-300 font-medium"
                >
                  Tiến Hành Thanh Toán
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
