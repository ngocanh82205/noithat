"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Clock, ShoppingBag, ArrowRight } from "lucide-react";
import { flashSaleService, ApiFlashSale } from "@/services/api";
import { formatPrice } from "@/lib/products";
import { useStore } from "./StoreContext";

export default function FlashSaleSection() {
  const [flashSale, setFlashSale] = useState<ApiFlashSale | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });
  const { addToCart } = useStore();

  useEffect(() => {
    flashSaleService
      .getActiveFlashSale()
      .then((res) => {
        if (res.success && res.data) {
          setFlashSale(res.data);
        }
      })
      .catch(() => {
        // Fallback
      });
  }, []);

  // Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 14, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!flashSale || !flashSale.items || flashSale.items.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 px-6 bg-charcoal text-beige overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-[1440px]">
        {/* Header with Title and Countdown */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-gold/20 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/40 text-red-400 text-xs tracking-widest2 uppercase font-medium rounded-full mb-3">
              <Flame size={15} className="animate-bounce" />
              Flash Sale — Giờ Vàng Thượng Lưu
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-champagne">
              {flashSale.name}
            </h2>
            <p className="text-xs md:text-sm text-beige/70 font-light mt-2 max-w-xl">
              {flashSale.subtitle || "Cơ hội sở hữu các tuyệt tác nội thất nguyên bản với mức ưu đãi giới hạn theo khung giờ."}
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 bg-black/40 border border-gold/30 p-3 rounded-lg">
            <Clock size={18} className="text-gold shrink-0 mr-1" />
            <span className="text-xs uppercase tracking-wider text-beige/60 mr-2">
              Kết thúc trong:
            </span>
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
              <span className="bg-gold text-charcoal px-2 py-1 rounded">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-gold">:</span>
              <span className="bg-gold text-charcoal px-2 py-1 rounded">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-gold">:</span>
              <span className="bg-gold text-charcoal px-2 py-1 rounded">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {flashSale.items.map((item) => {
            const product = item.product;
            if (!product) return null;

            const discountPercent = Math.round(
              ((product.price - item.flash_price) / product.price) * 100
            );
            const soldPercent = Math.min(
              100,
              Math.round((item.sold_count / item.stock_for_sale) * 100)
            );
            const imgUrl =
              product.images?.[0]?.image_url || (product as any).image || "/images/sofa-1.jpg";

            return (
              <div
                key={item.id}
                className="bg-beige/5 border border-gold/20 p-5 group flex flex-col justify-between hover:border-gold/60 transition-all duration-300"
              >
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden bg-black/40 mb-5">
                    <Image
                      src={imgUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Discount badge */}
                    <div className="absolute top-3 right-3 bg-red-600 text-white font-bold text-xs px-2.5 py-1 rounded-sm shadow-md">
                      -{discountPercent > 0 ? discountPercent : 25}%
                    </div>
                  </div>

                  <p className="text-[10px] tracking-widest2 uppercase text-gold">
                    {product.category?.name || "Nội thất cao cấp"}
                  </p>
                  <h3 className="font-serif text-xl text-beige mt-1 line-clamp-1 group-hover:text-gold transition-colors">
                    {product.name}
                  </h3>

                  {/* Price comparison */}
                  <div className="flex items-baseline gap-3 mt-3">
                    <span className="font-serif text-2xl text-gold font-bold">
                      {formatPrice(item.flash_price)}
                    </span>
                    <span className="text-xs text-beige/50 line-through">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  {/* Sold Stock Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-beige/70">
                      <span>Đã bán: {item.sold_count}</span>
                      <span>Còn lại: {item.stock_for_sale - item.sold_count}</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-gold rounded-full transition-all duration-500"
                        style={{ width: `${soldPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                  <Link
                    href={`/products/${product.slug || product.id}`}
                    className="flex-1 py-3 text-center border border-beige/20 text-beige text-xs tracking-widest2 uppercase hover:border-gold hover:text-gold transition-colors"
                  >
                    Xem Chi Tiết
                  </Link>
                  <button
                    onClick={() =>
                      addToCart({
                        ...product,
                        price: item.flash_price,
                      })
                    }
                    className="px-5 py-3 bg-gold text-charcoal text-xs tracking-widest2 uppercase hover:bg-champagne transition-colors font-semibold flex items-center gap-1.5"
                  >
                    <ShoppingBag size={14} /> Săn Ngay
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
