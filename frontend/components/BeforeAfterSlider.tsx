"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Sparkles, MoveHorizontal, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <section className="py-20 md:py-28 bg-charcoal text-beige overflow-hidden relative">
      {/* Background Subtle Luxury Ornament */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-[1280px] px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center space-x-2 text-gold text-xs font-semibold uppercase tracking-widest2 mb-3">
              <Sparkles size={15} />
              <span>Năng Lực Kiến Tạo Không Gian</span>
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-beige max-w-2xl leading-tight">
              Biến Đổi Không Gian: Trước &amp; Sau Khi Chạm Tay GS Luxury
            </h2>
          </div>
          <p className="text-xs md:text-sm text-beige/70 max-w-md font-light leading-relaxed">
            Từ một căn hộ thô trống trải thành dinh thự penthouse thượng lưu ngập tràn cảm hứng sống với trọn gói thiết kế &amp; thi công nội thất độc bản.
          </p>
        </div>

        {/* Interactive Comparison Canvas */}
        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
          className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-2xl overflow-hidden border border-gold/30 shadow-2xl select-none cursor-ew-resize group"
        >
          {/* AFTER Image (Full Width Underneath) */}
          <div className="absolute inset-0">
            <Image
              src="/images/hero-banner.jpg"
              alt="Sau khi thi công GS Luxury"
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
            />
            {/* After Tag */}
            <div className="absolute top-6 right-6 bg-charcoal/90 backdrop-blur-md text-gold border border-gold/40 px-4 py-1.5 rounded-full text-xs font-serif font-bold tracking-wider shadow-lg flex items-center gap-1.5">
              <span>✨ SAU: Hoàn Thiện GS Luxury</span>
            </div>
          </div>

          {/* BEFORE Image (Clipped by slider position) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <div className="relative w-full h-full min-w-[100%] aspect-[16/9] md:aspect-[21/9]">
              <Image
                src="/images/sofa-2.jpg"
                alt="Trước khi thi công"
                fill
                className="object-cover grayscale brightness-75 contrast-125"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </div>
            {/* Before Tag */}
            <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-md text-gray-300 border border-white/20 px-4 py-1.5 rounded-full text-xs font-serif tracking-wider shadow-lg">
              <span>🏗️ TRƯỚC: Mặt Bằng Thô</span>
            </div>
          </div>

          {/* Divider Line & Interactive Handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold via-champagne to-gold shadow-[0_0_15px_rgba(212,175,55,0.9)]"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-gradient-to-tr from-gold to-gold-dark text-charcoal border-2 border-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              <MoveHorizontal size={20} strokeWidth={2.5} />
            </div>
          </div>

          {/* Bottom Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-beige/80 px-4 py-1 rounded-full text-[11px] pointer-events-none tracking-wide">
            ↔ Kéo thanh trượt để so sánh sự thay đổi
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-6 p-6 bg-white/5 border border-white/10 rounded-2xl">
          <div className="space-y-1">
            <h4 className="font-serif text-lg text-champagne">Bạn muốn biến đổi căn hộ của mình?</h4>
            <p className="text-xs text-beige/60">
              Đăng ký nhận bản vẽ phối cảnh 3D và tư vấn may đo nội thất tại nhà từ kiến trúc sư trưởng.
            </p>
          </div>

          <Link
            href="/booking"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-gold to-gold-dark text-charcoal text-xs font-serif font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-md"
          >
            <span>Đặt Lịch Tư Vấn 3D Ngay</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
