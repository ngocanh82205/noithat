"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

const VALUES = [
  {
    title: "100% Da Ý Nguyên Tấm",
    desc: "Chọn lọc từ các xưởng thuộc da danh tiếng tại Tuscany, mềm mại và bền bỉ theo thời gian.",
  },
  {
    title: "Gỗ Hoàn Thiện Thủ Công",
    desc: "Mỗi đường vân gỗ được nghệ nhân xử lý và đánh bóng thủ công qua nhiều công đoạn.",
  },
  {
    title: "Giao Hàng White-Glove",
    desc: "Đội ngũ lắp đặt chuyên nghiệp, tận tay sắp đặt từng chi tiết trong không gian của bạn.",
  },
];

export default function Heritage() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section
      id="heritage"
      ref={ref}
      className="relative py-28 md:py-40 px-6 bg-charcoal text-beige overflow-hidden"
    >
      <motion.div style={{ y }} className="absolute inset-0 opacity-40">
        <Image
          src="/images/wardrobe-1.webp"
          alt="Nghệ nhân chế tác nội thất gỗ thủ công"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal via-charcoal/85 to-charcoal" />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="max-w-2xl">
          <p className="text-gold text-xs tracking-widest2 uppercase mb-6">
            Di Sản &amp; Tay Nghề
          </p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-4xl md:text-6xl leading-tight text-balance"
          >
            Ba Mươi Năm Tận Tâm Với Từng Đường Nét
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-beige/70 text-base md:text-lg font-light max-w-xl"
          >
            GS Luxury hợp tác cùng các xưởng thủ công lâu đời tại Ý, gìn giữ
            kỹ thuật truyền thống trong từng sản phẩm hiện diện tại không
            gian sống của bạn.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 md:gap-8 mt-20">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="border-t hairline-light pt-6"
            >
              <span className="text-gold font-serif text-2xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-serif text-xl mt-4 mb-2">{v.title}</h3>
              <p className="text-beige/60 text-sm leading-relaxed font-light">
                {v.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
