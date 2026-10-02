"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, SlidersHorizontal, ArrowUpDown, Sparkles, Filter, X } from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import ProductCard from "@/components/ProductCard";
import FilterSidebar, { FilterState } from "@/components/FilterSidebar";
import ShoppableRoomBundle from "@/components/ShoppableRoomBundle";
import RealCustomerReviews from "@/components/RealCustomerReviews";
import { productService, catalogService, ApiProduct, ApiCategory } from "@/services/api";
import { products as fallbackProducts } from "@/lib/products";

export default function ProductsPage() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [productsList, setProductsList] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    maxPrice: 150000000,
    material: "all",
    color: "all",
    style: "all",
  });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("latest");

  // Load Categories on mount
  useEffect(() => {
    catalogService
      .getCategories()
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setCategories(res.data);
        }
      })
      .catch(() => {
        // Fallback categories
      });
  }, []);

  // Fetch Products whenever filters change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        sort: sortBy,
        max_price: filters.maxPrice,
      };

      if (filters.category !== "all") {
        params.category = filters.category;
      }

      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }

      const res = await productService.getAll(params);
      if (!res.success && (res as any).status === 0) {
        throw new Error(res.message); // không kết nối được -> dùng danh sách dự phòng bên dưới
      }
      if (res.success && res.data) {
        setProductsList(res.data);
      } else {
        setProductsList([]);
      }
    } catch (err) {
      console.warn("API request failed, using local fallback:", err);
      // Client-side fallback filter
      const filtered = fallbackProducts.filter((p) => {
        const matchesCategory =
          filters.category === "all" || p.categorySlug === filters.category;
        const matchesSearch =
          !searchQuery ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrice = p.price <= filters.maxPrice;
        return matchesCategory && matchesSearch && matchesPrice;
      });
      setProductsList(filtered as any);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleResetFilters = () => {
    setFilters({
      category: "all",
      maxPrice: 150000000,
      material: "all",
      color: "all",
      style: "all",
    });
    setSearchQuery("");
    setSortBy("latest");
  };

  return (
    <main className="min-h-screen bg-beige">
      <SiteChrome>
        {/* Hero Section Showcasing Flagship Collection */}
        <section className="relative py-24 md:py-32 px-6 bg-charcoal text-beige overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <Image
              src="/images/hero-banner.jpg"
              alt="GS Luxury Flagship Collection"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />

          <div className="relative mx-auto max-w-[1360px] text-center space-y-4">
            <div className="inline-flex items-center space-x-2 bg-gold/15 border border-gold/40 text-gold px-4 py-1.5 rounded-full text-xs font-serif font-bold tracking-widest uppercase shadow-lg">
              <Sparkles size={14} />
              <span>Bộ Sưu Tập Kiệt Tác 2026</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl tracking-wide text-champagne max-w-4xl mx-auto leading-tight">
              Định Nghĩa Lại Không Gian Sống Thượng Lưu
            </h1>

            <p className="text-beige/80 max-w-2xl mx-auto text-sm md:text-base font-light leading-relaxed">
              Mỗi món nội thất là một tác phẩm nghệ thuật độc bản, kết hợp tinh hoa thủ công Ý và công nghệ khảo sát 3D thực tế ảo.
            </p>

            <div className="pt-4 flex items-center justify-center gap-4">
              <a
                href="#product-grid"
                className="px-8 py-4 bg-gradient-to-r from-gold to-gold-dark text-charcoal font-serif font-bold text-xs uppercase tracking-widest2 rounded-xl shadow-lg hover:scale-105 transition-all"
              >
                Khám Phá Ngay
              </a>

              <Link
                href="/studio-3d"
                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-beige border border-white/20 font-serif text-xs uppercase tracking-widest2 rounded-xl backdrop-blur-md transition-all flex items-center gap-2"
              >
                <Sparkles size={14} className="text-gold" />
                <span>Trải Nghiệm 3D Studio</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Product Grid & Multi-Dimensional Filter Section */}
        <section id="product-grid" className="py-16 md:py-24 px-6">
          <div className="mx-auto max-w-[1360px]">
            {/* Top Toolbar: Search Bar, Mobile Filter Trigger & Sort */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 mb-8 border-b border-espresso/10">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso/40"
                />
                <input
                  type="text"
                  placeholder="Tìm sofa, bàn trà, giường ngủ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-espresso/15 rounded-xl text-xs text-espresso placeholder:text-espresso/40 focus-ring"
                />
              </div>

              {/* Action Tools */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-espresso/15 rounded-xl text-xs font-semibold text-espresso shadow-sm"
                >
                  <Filter size={15} className="text-gold" />
                  <span>Bộ Lọc</span>
                </button>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-espresso/60 hidden sm:inline">Sắp xếp:</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-white border border-espresso/15 rounded-xl px-4 py-2.5 pr-8 text-xs font-medium text-espresso cursor-pointer focus-ring shadow-sm"
                    >
                      <option value="latest">✨ Mới Nhất 2026</option>
                      <option value="price_asc">Giá: Thấp đến Cao</option>
                      <option value="price_desc">Giá: Cao đến Thấp</option>
                      <option value="rating">Đánh Giá Cao Nhất</option>
                    </select>
                    <ArrowUpDown
                      size={13}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/50 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Layout: Sidebar + Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Filter Sidebar (Desktop) */}
              <div className="hidden lg:block lg:col-span-3 sticky top-28">
                <FilterSidebar
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleResetFilters}
                  totalResults={productsList.length}
                />
              </div>

              {/* Right Column: Product Cards Grid (9 cols) */}
              <div className="lg:col-span-9">
                {loading ? (
                  /* Loading Skeletons */
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-white/50 border border-espresso/10 rounded-2xl p-4 space-y-3 animate-pulse"
                      >
                        <div className="aspect-[4/5] bg-espresso/10 rounded-xl" />
                        <div className="h-4 bg-espresso/10 rounded w-3/4" />
                        <div className="h-4 bg-espresso/10 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : productsList.length > 0 ? (
                  /* Products Grid */
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
                    {productsList.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="text-center py-20 bg-white/60 rounded-3xl border border-espresso/10 space-y-4">
                    <p className="font-serif text-2xl text-espresso font-bold">
                      Không tìm thấy kiệt tác phù hợp
                    </p>
                    <p className="text-xs text-espresso/60 max-w-sm mx-auto">
                      Hãy thử điều chỉnh lại mức giá hoặc chọn danh mục khác để khám phá bộ sưu tập.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-6 py-2.5 bg-espresso text-beige text-xs font-serif tracking-widest uppercase rounded-xl hover:bg-gold transition-colors"
                    >
                      Đặt Lại Bộ Lọc
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Shoppable Room Bundle Section */}
        <ShoppableRoomBundle />

        {/* Real Customer Verified Reviews */}
        <RealCustomerReviews />

        {/* Mobile Filter Drawer Modal */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex justify-end animate-fade-in">
            <div className="w-4/5 max-w-sm h-full bg-beige p-6 overflow-y-auto space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-espresso/10">
                <span className="font-serif font-bold text-lg text-espresso">Bộ Lọc Tuyển Chọn</span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-2 rounded-full hover:bg-espresso/10 text-espresso"
                >
                  <X size={18} />
                </button>
              </div>

              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                onReset={handleResetFilters}
                totalResults={productsList.length}
              />

              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3.5 bg-espresso text-beige font-serif font-bold text-xs uppercase tracking-widest rounded-xl"
              >
                Áp Dụng ({productsList.length} sản phẩm)
              </button>
            </div>
          </div>
        )}
      </SiteChrome>
    </main>
  );
}
