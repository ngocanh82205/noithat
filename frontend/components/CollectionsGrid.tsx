// components/CollectionsGrid.tsx — THAY TOÀN BỘ FILE NÀY
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { collections, getFeaturedProducts } from "@/lib/products";
import ProductCard from "./ProductCard";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

export default function CollectionsGrid() {
  // Trang chủ chỉ hiển thị sản phẩm nổi bật (featured: true trong lib/products.ts)
  const featured = getFeaturedProducts(4);

  return (
    <section id="collections" className="py-24 md:py-32 px-6 bg-beige">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-gold text-xs tracking-widest2 uppercase mb-4">
              Bộ Sưu Tập Tuyển Chọn
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-balance max-w-lg">
              Từng Món Đồ, Một Câu Chuyện Thủ Công
            </h2>
          </div>
          <p className="text-espresso/60 max-w-sm text-sm">
            Mỗi sản phẩm được chế tác bởi nghệ nhân hàng đầu, sử dụng chất liệu
            tự nhiên thượng hạng — từ da Ý nguyên tấm đến gỗ óc chó quý.
          </p>
        </div>

        {/* Lưới danh mục bất đối xứng — bấm vào để xem toàn bộ sản phẩm trong danh mục */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 mb-20">
          {collections.map((col, i) => (
            <motion.div
              key={col.id}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              transition={{
                duration: 0.6,
                delay: i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={
                i === 0 || i === 3
                  ? "col-span-2 md:col-span-3 aspect-[16/10]"
                  : "col-span-1 md:col-span-2 aspect-square"
              }
            >
              <Link
                href={`/collections/${col.id}`}
                className="group relative block w-full h-full overflow-hidden"
              >
                <Image
                  src={col.image}
                  alt={col.label}
                  fill
                  className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/0 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 md:p-5">
                  <span className="text-beige font-serif text-lg md:text-2xl">
                    {col.label}
                  </span>
                  <span className="block w-8 h-px bg-gold mt-2 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-luxe" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Sản phẩm nổi bật — chỉ hiện số lượng giới hạn, xem thêm dẫn sang trang riêng */}
        <div className="flex items-end justify-between mb-10">
          <h3 className="font-serif text-2xl md:text-3xl">Sản Phẩm Nổi Bật</h3>
          <Link
            href="/collections"
            className="hidden md:flex items-center gap-2 text-xs tracking-widest2 uppercase hover:text-gold transition-colors focus-ring"
          >
            Xem Tất Cả Sản Phẩm
            <ArrowRight strokeWidth={1.5} size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-6 md:gap-y-16">
          {featured.map((product, i) => (
            <motion.div
              key={product.id}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              transition={{
                duration: 0.6,
                delay: (i % 4) * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        <div className="mt-14 flex justify-center md:hidden">
          <Link
            href="/collections"
            className="flex items-center gap-2 text-xs tracking-widest2 uppercase border border-espresso/20 px-8 py-4 hover:border-gold hover:text-gold transition-colors duration-300"
          >
            Xem Tất Cả Sản Phẩm
            <ArrowRight strokeWidth={1.5} size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
