"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, Sparkles } from "lucide-react";

const SLIDES = [
  { src: "/images/hero-banner.webp", alt: "Phòng khách sang trọng với tầm nhìn toàn cảnh thành phố" },
  { src: "/images/sofa-1.webp", alt: "Sofa da cao cấp trong không gian ấm cúng" },
  { src: "/images/dining-table-1.webp", alt: "Phòng ăn dát vàng đẳng cấp" },
];

export default function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="top" className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-charcoal">
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
            scale: { duration: 6, ease: "linear" },
          }}
          className="absolute inset-0"
        >
          <Image
            src={SLIDES[index].src}
            alt={SLIDES[index].alt}
            fill
            priority={index === 0}
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-charcoal/40" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-champagne text-xs md:text-sm tracking-widest2 uppercase mb-6"
        >
          Bộ Sưu Tập 2026
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-beige text-[2.5rem] leading-[1.1] md:text-7xl lg:text-[5.5rem] tracking-wide text-balance max-w-4xl"
        >
          Kiến Tạo Không Gian Sống Vượt Thời Gian
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-beige/80 text-base md:text-lg max-w-xl font-light"
        >
          Nội thất thủ công thượng hạng, dành cho những không gian sống được
          định nghĩa lại bởi sự tinh tế.
        </motion.p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <motion.a
            href="#collections"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.02 }}
            className="group relative px-8 py-3.5 text-beige text-xs tracking-widest2 uppercase overflow-hidden focus-ring text-center min-w-[210px]"
          >
            <span className="absolute inset-0 border border-beige/50 transition-colors duration-500 group-hover:border-gold" />
            <span className="absolute inset-0 border border-gold scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-luxe" />
            <span className="relative">Khám Phá Bộ Sưu Tập</span>
          </motion.a>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.02 }}
          >
            <Link
              href="/ai-stylist"
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gold via-champagne to-gold text-charcoal text-xs font-semibold tracking-widest2 uppercase shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-all min-w-[210px]"
            >
              <Sparkles size={15} />
              <span>AI Spatial Stylist</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Chỉ số slide */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Chuyển đến ảnh ${i + 1}`}
            className={`h-[2px] transition-all duration-500 ease-luxe focus-ring ${
              i === index ? "w-8 bg-gold" : "w-4 bg-beige/40"
            }`}
          />
        ))}
      </div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-beige/70"
      >
        <ArrowDown strokeWidth={1.2} size={20} />
      </motion.div>
    </section>
  );
}
