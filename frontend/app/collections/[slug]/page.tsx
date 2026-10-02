// app/collections/[slug]/page.tsx — Trang danh mục / bộ sưu tập theo phòng
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import ProductCard from "@/components/ProductCard";
import { catalogService } from "@/services/api";
import { collections, getProductsByCategory } from "@/lib/products";

async function fetchCategoryData(slug: string) {
  const catRes = await catalogService.getCategoryDetail(slug);
  if (catRes.success && catRes.data) {
    const cat = (catRes.data as any).category || catRes.data;
    return {
      name: cat.name || "Bộ Sưu Tập",
      description: cat.description || "",
      image: cat.image || "/images/hero-banner.jpg",
      products: catRes.data.products || [],
    };
  }

  // Máy chủ không phản hồi -> báo lỗi tải trang thay vì "không tìm thấy"
  const catStatus = (catRes as any).status ?? 0;
  const apiDown = !catRes.success && (catStatus === 0 || catStatus >= 500);

  // Không phải danh mục -> thử bộ sưu tập (slug của collection)
  const colRes = apiDown ? catRes : await catalogService.getCollectionDetail(slug);
  if (colRes.success && colRes.data) {
    const col = (colRes.data as any).collection || colRes.data;
    return {
      name: col.name || "Bộ Sưu Tập",
      description: col.description || "",
      image: col.banner_image || col.image || "/images/hero-banner.jpg",
      products: colRes.data.products || [],
    };
  }

  // Fallback
  const fallbackCol = collections.find((c) => c.id === slug);
  if (fallbackCol) {
    return {
      name: fallbackCol.label,
      description: `Khám phá các tuyệt tác nội thất không gian ${fallbackCol.label} từ GS Luxury.`,
      image: fallbackCol.image,
      products: getProductsByCategory(slug),
    };
  }

  if (apiDown) {
    throw new Error("API_UNAVAILABLE");
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await fetchCategoryData(params.slug);
  if (!data) return { title: "Không tìm thấy danh mục | GS LUXURY" };

  return {
    title: `${data.name} | GS LUXURY`,
    description: data.description,
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const data = await fetchCategoryData(params.slug);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-beige">
      <SiteChrome>
        <section className="relative h-[45vh] min-h-[300px] w-full overflow-hidden bg-charcoal">
          <Image
            src={data.image}
            alt={data.name}
            fill
            priority
            className="object-cover opacity-60"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-charcoal/60" />
          <div className="relative h-full flex flex-col items-center justify-center text-center px-6 max-w-3xl mx-auto">
            <p className="text-gold text-xs tracking-widest2 uppercase mb-3 font-medium">
              Không Gian Sống Thượng Lưu
            </p>
            <h1 className="font-serif text-champagne text-4xl md:text-6xl mb-3">
              {data.name}
            </h1>
            {data.description && (
              <p className="text-beige/70 text-xs md:text-sm font-light max-w-xl">
                {data.description}
              </p>
            )}
          </div>
        </section>

        <section className="py-16 md:py-24 px-6">
          <div className="mx-auto max-w-[1440px]">
            <div className="flex items-center justify-between mb-10 pb-4 border-b border-espresso/10">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-xs tracking-widest2 uppercase text-espresso/60 hover:text-gold transition-colors focus-ring"
              >
                <ArrowLeft strokeWidth={1.5} size={14} />
                Tất Cả Sản Phẩm
              </Link>
              <span className="text-xs text-espresso/60 tracking-wider">
                {data.products.length} sản phẩm
              </span>
            </div>

            {data.products.length === 0 ? (
              <div className="text-center py-20 bg-white/40 border border-dashed border-espresso/15">
                <p className="font-serif text-xl text-espresso mb-2">
                  Danh mục này hiện chưa có sản phẩm
                </p>
                <p className="text-xs text-espresso/60 tracking-wider mb-6">
                  Vui lòng quay lại sau hoặc xem các bộ sưu tập khác.
                </p>
                <Link
                  href="/products"
                  className="px-6 py-3 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors"
                >
                  Khám Phá Toàn Bộ
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-6 md:gap-y-16">
                {data.products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      </SiteChrome>
    </main>
  );
}
