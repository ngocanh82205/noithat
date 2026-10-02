"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "GS Luxury định hình lại khái niệm nội thất cao cấp tại thị trường Việt Nam, với sự tinh xảo ngang tầm các thương hiệu châu Âu.",
    source: "Architectural Digest",
  },
  {
    quote:
      "Từng chi tiết đều toát lên sự tỉ mỉ hiếm có — một trải nghiệm mua sắm nội thất thực sự đẳng cấp.",
    source: "Vogue Living",
  },
  {
    quote:
      "Dịch vụ đặt riêng và đội ngũ tư vấn của GS Luxury vượt xa mọi kỳ vọng của gia đình tôi.",
    source: "Khách hàng VIP",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  const next = useCallback(
    () => setIndex((prev) => (prev + 1) % TESTIMONIALS.length),
    []
  );
  const prev = () =>
    setIndex((p) => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

  useEffect(() => {
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="py-24 md:py-32 px-6 bg-champagne/15">
      <div className="mx-auto max-w-3xl text-center">
        <Quote
          className="mx-auto mb-8 text-gold"
          strokeWidth={1}
          size={40}
        />

        <div className="relative min-h-[180px] md:min-h-[140px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-serif text-2xl md:text-3xl leading-snug text-balance">
                &ldquo;{TESTIMONIALS[index].quote}&rdquo;
              </p>
              <p className="mt-6 text-xs tracking-widest2 uppercase text-espresso/50">
                {TESTIMONIALS[index].source}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-6 mt-10">
          <button
            onClick={prev}
            aria-label="Đánh giá trước"
            className="p-2 hover:text-gold transition-colors focus-ring"
          >
            <ChevronLeft strokeWidth={1.5} size={20} />
          </button>
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Đánh giá ${i + 1}`}
                className={`h-[2px] transition-all duration-500 ease-luxe ${
                  i === index ? "w-8 bg-gold" : "w-4 bg-espresso/20"
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            aria-label="Đánh giá tiếp theo"
            className="p-2 hover:text-gold transition-colors focus-ring"
          >
            <ChevronRight strokeWidth={1.5} size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
