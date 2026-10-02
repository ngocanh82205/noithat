"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Star, Sparkles, ShoppingBag, ArrowRightLeft, Zap } from "lucide-react";
import { formatPrice } from "@/lib/products";
import { useStore } from "./StoreContext";
import { cn } from "@/lib/utils";
import Product3DModal from "./Product3DModal";

export default function ProductCard({
  product,
  className,
}: {
  product: any;
  className?: string;
}) {
  const { wishlist, toggleWishlist, addToCart, addToCompare, comparisonList, openCart } = useStore();
  const router = useRouter();
  const [modal3DOpen, setModal3DOpen] = useState(false);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    router.push("/checkout");
  };

  const prodId = String(product.id);
  const isWished = wishlist.includes(prodId);
  const isCompared = comparisonList.some((p) => String(p.id) === prodId);

  // Normalize fields
  const slug = product.slug || product.id;
  const name = product.name;
  const price = product.price;
  const originalPrice = product.original_price;
  const categoryName = product.category?.name || product.category || product.collection || "";

  const mainImage =
    product.images?.[0]?.image_url || product.image || "/images/sofa-1.jpg";
  const hoverImage =
    product.images?.[1]?.image_url || product.image2 || null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    openCart();
  };

  const handleOpen3D = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModal3DOpen(true);
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCompare(product);
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "group relative flex flex-col justify-between bg-white/60 border border-espresso/10 rounded-2xl overflow-hidden p-3.5 hover:border-gold/50 hover:shadow-lg transition-all",
          className
        )}
      >
        <Link href={`/products/${slug}`} prefetch={true} className="block">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-champagne/20 border border-espresso/5">
            {/* Main Product Image */}
            <Image
              src={mainImage}
              alt={name}
              fill
              className={cn(
                "object-cover transition-all duration-700 ease-luxe",
                hoverImage ? "group-hover:scale-[1.03] group-hover:opacity-0" : "group-hover:scale-[1.03]"
              )}
              sizes="(max-width: 768px) 50vw, 25vw"
            />

            {/* Secondary Hover Image */}
            {hoverImage && (
              <Image
                src={hoverImage}
                alt={`${name} - góc nhìn khác`}
                fill
                className="object-cover opacity-0 scale-[1.03] transition-all duration-700 ease-luxe group-hover:opacity-100 group-hover:scale-100"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            )}

            {/* Badges: 3D Ready / Bestseller */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
              <span className="bg-gradient-to-r from-gold to-gold-dark text-charcoal text-[9px] uppercase tracking-widest px-2 py-0.5 font-serif font-bold rounded-md shadow-md flex items-center gap-1">
                <Sparkles size={10} /> 3D Ready
              </span>
              {product.is_bestseller && (
                <span className="bg-espresso text-champagne text-[9px] uppercase tracking-widest px-2 py-0.5 font-medium rounded-md">
                  Best Seller
                </span>
              )}
            </div>

            {/* Action Tools: Wishlist & Compare */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleWishlist(prodId);
                }}
                aria-label={isWished ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
                className="flex items-center justify-center w-8 h-8 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
              >
                <Heart
                  size={15}
                  strokeWidth={1.5}
                  className={isWished ? "fill-gold text-gold" : "text-espresso"}
                />
              </button>

              <button
                onClick={handleToggleCompare}
                title="Thêm vào so sánh"
                className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm transition-colors ${
                  isCompared
                    ? "bg-gold text-charcoal"
                    : "bg-white/80 backdrop-blur-md text-espresso hover:bg-white hover:text-gold"
                }`}
              >
                <ArrowRightLeft size={13} />
              </button>
            </div>

            {/* Hover Overlay: 3 buttons — Xem 3D | Thêm Giỏ | Mua Ngay */}
            <div className="absolute inset-x-0 bottom-0 p-2.5 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-luxe flex flex-col gap-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-6">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={handleOpen3D}
                  className="bg-white/90 hover:bg-white text-espresso text-[11px] font-serif font-bold tracking-wider py-2 rounded-lg shadow-md flex items-center justify-center gap-1 transition-transform hover:scale-102"
                >
                  <Sparkles size={12} className="text-gold" />
                  <span>Xem 3D</span>
                </button>

                <button
                  onClick={handleQuickAdd}
                  className="bg-espresso/80 hover:bg-espresso text-beige text-[11px] font-serif font-bold tracking-wider py-2 rounded-lg shadow-md flex items-center justify-center gap-1 transition-transform hover:scale-102"
                >
                  <ShoppingBag size={12} />
                  <span>Thêm Giỏ</span>
                </button>
              </div>
              <button
                onClick={handleBuyNow}
                className="w-full bg-gradient-to-r from-gold via-amber-400 to-gold text-charcoal text-[11px] font-serif font-bold tracking-wider py-2.5 rounded-lg shadow-md flex items-center justify-center gap-1.5 hover:brightness-110 transition-all"
              >
                <Zap size={12} />
                <span>Mua Ngay</span>
              </button>
            </div>
          </div>

          {/* Product Meta */}
          <div className="mt-3.5 space-y-1">
            {categoryName && (
              <p className="text-[10px] tracking-widest2 uppercase text-espresso/50 truncate">
                {categoryName}
              </p>
            )}

            <h3 className="font-serif text-sm md:text-base text-espresso line-clamp-1 group-hover:text-gold transition-colors font-medium">
              {name}
            </h3>

            {/* Rating Stars */}
            <div className="flex items-center space-x-1 text-gold text-[10px]">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={11} className="fill-gold" />
                ))}
              </div>
              <span className="text-espresso/50 font-sans ml-1">(5.0)</span>
            </div>

            {/* Price Row */}
            <div className="flex items-center gap-2 pt-1">
              <span className="font-serif text-sm md:text-base text-gold font-bold">
                {formatPrice(price)}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-[11px] text-espresso/40 line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          </div>
        </Link>
      </motion.div>

      {/* 3D Quick View Modal */}
      <Product3DModal
        isOpen={modal3DOpen}
        onClose={() => setModal3DOpen(false)}
        product={product}
      />
    </>
  );
}
