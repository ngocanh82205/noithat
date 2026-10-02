"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { hotspots, products, formatPrice } from "@/lib/products";
import { useStore } from "./StoreContext";

export default function Lookbook() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { addToCart } = useStore();

  return (
    <section className="py-24 md:py-32 px-6">
      <div className="mx-auto max-w-[1440px]">
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-gold text-xs tracking-widest2 uppercase mb-4">
            Mua Trọn Không Gian
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-balance">
            Chạm Để Khám Phá Từng Chi Tiết
          </h2>
        </div>

        <div className="relative w-full aspect-[16/10] md:aspect-[16/8] overflow-hidden">
          <Image
            src="/images/hero-banner.jpg"
            alt="Không gian phòng khách với các sản phẩm nội thất GS Luxury"
            fill
            className="object-cover"
            sizes="100vw"
          />

          {hotspots.map((hs) => {
            const product = products.find((p) => p.id === hs.productId);
            if (!product) return null;
            const isActive = activeId === hs.id;
            return (
              <div
                key={hs.id}
                className="absolute"
                style={{ top: hs.top, left: hs.left }}
              >
                <button
                  onClick={() => setActiveId(isActive ? null : hs.id)}
                  aria-label={`Xem sản phẩm ${product.name}`}
                  className="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 focus-ring"
                >
                  <span className="absolute inline-flex h-full w-full rounded-full bg-gold/40 animate-ping" />
                  <span className="relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-beige text-charcoal shadow-ambient">
                    {isActive ? <X size={13} strokeWidth={2} /> : <Plus size={13} strokeWidth={2} />}
                  </span>
                </button>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute z-20 top-6 left-1/2 -translate-x-1/2 w-64 bg-beige/90 backdrop-blur-md shadow-ambient-lg p-4 border border-beige/40"
                    >
                      <div className="flex gap-3">
                        <div className="relative w-16 h-16 shrink-0 overflow-hidden">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif text-base leading-tight truncate">
                            {product.name}
                          </p>
                          <p className="text-gold text-sm mt-1">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="mt-3 w-full text-[11px] tracking-widest2 uppercase border border-espresso/20 py-2.5 hover:border-gold hover:text-gold transition-colors duration-300"
                      >
                        Thêm Nhanh Vào Giỏ
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
