// app/products/[id]/page.tsx — Chi tiết sản phẩm kết nối Laravel Backend API
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import ProductDetailClient from "@/components/ProductDetailClient";
import ProductCard from "@/components/ProductCard";
import { productService, ApiProduct } from "@/services/api";
import { products as fallbackProducts, getProductById, getRelatedProducts } from "@/lib/products";

async function fetchProduct(slugOrId: string): Promise<{ product: any; related_products: any[] } | null> {
  const res = await productService.getDetail(slugOrId);
  if (res.success && res.data) {
    return res.data;
  }

  const fallback = getProductById(slugOrId);
  if (fallback) {
    return {
      product: fallback,
      related_products: getRelatedProducts(fallback, 4),
    };
  }

  // Máy chủ không phản hồi / lỗi 5xx: KHÔNG báo 404 (sản phẩm vẫn tồn tại) mà để app/error.tsx
  // hiện "Chưa tải được trang — Thử lại".
  const status = (res as any).status ?? 0;
  if (status === 0 || status >= 500) {
    throw new Error("API_UNAVAILABLE");
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const data = await fetchProduct(params.id);
  if (!data) return { title: "Không tìm thấy sản phẩm | GS LUXURY" };

  return {
    title: `${data.product.name} | GS LUXURY`,
    description: data.product.summary || data.product.description,
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const data = await fetchProduct(params.id);
  if (!data) notFound();

  const { product, related_products } = data;
  const categoryName = product.category?.name || product.category || "Bộ Sưu Tập";
  const categorySlug = product.category?.slug || product.categorySlug || "products";

  return (
    <main className="min-h-screen bg-beige">
      <SiteChrome>
        <section className="pt-12 pb-24 md:pb-32 px-6">
          <div className="mx-auto max-w-[1200px]">
            <Link
              href={categorySlug === "products" ? "/products" : `/collections/${categorySlug}`}
              className="inline-flex items-center gap-2 text-xs tracking-widest2 uppercase text-espresso/60 hover:text-gold transition-colors mb-10 focus-ring"
            >
              <ArrowLeft strokeWidth={1.5} size={14} />
              {categoryName}
            </Link>

            <ProductDetailClient product={product} />
          </div>
        </section>

        {related_products && related_products.length > 0 && (
          <section className="pb-24 md:pb-32 px-6 border-t border-espresso/10 pt-16">
            <div className="mx-auto max-w-[1440px]">
              <h2 className="font-serif text-2xl md:text-3xl text-espresso mb-10">
                Tuyệt Tác Cùng Bộ Sưu Tập
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-6 md:gap-y-16">
                {related_products.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </SiteChrome>
    </main>
  );
}
