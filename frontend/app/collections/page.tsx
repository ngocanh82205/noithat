// app/collections/page.tsx — TẠO ĐƯỜNG DẪN app/collections/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import SiteChrome from "@/components/SiteChrome";
import ProductCard from "@/components/ProductCard";
import { products, collections } from "@/lib/products";

export const metadata: Metadata = {
  title: "Tất Cả Sản Phẩm | GS LUXURY",
  description: "Toàn bộ bộ sưu tập nội thất cao cấp từ GS Luxury.",
};

export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-beige">
      <SiteChrome>
        <section className="pt-16 pb-8 px-6">
          <div className="mx-auto max-w-[1440px]">
            <p className="text-gold text-xs tracking-widest2 uppercase mb-4">
              Toàn Bộ Bộ Sưu Tập
            </p>
            <h1 className="font-serif text-4xl md:text-5xl">Tất Cả Sản Phẩm</h1>

            {/* Lọc nhanh theo danh mục */}
            <div className="flex flex-wrap gap-3 mt-8">
              {collections.map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.id}`}
                  className="text-xs tracking-widest2 uppercase border border-espresso/20 px-5 py-2.5 hover:border-gold hover:text-gold transition-colors duration-300"
                >
                  {col.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-24 md:pb-32 px-6">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-6 md:gap-y-16">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      </SiteChrome>
    </main>
  );
}
