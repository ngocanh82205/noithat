"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Sparkles, ArrowLeft, Zap } from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import { useStore } from "@/components/StoreContext";
import { useToast } from "@/components/ToastProvider";
import { formatPrice } from "@/lib/products";
import { productService } from "@/services/api";
import { useRouter } from "next/navigation";

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart, openCart } = useStore();
  const { showToast } = useToast();
  const router = useRouter();
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlist.length === 0) {
      setWishlistProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    productService
      .getAll({ per_page: 100 })
      .then((res) => {
        if (res.success && res.data) {
          const filtered = res.data.filter((p: any) => wishlist.includes(String(p.id)));
          setWishlistProducts(filtered);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [wishlist]);

  const handleRemove = (productId: string) => {
    toggleWishlist(productId);
    showToast({ type: "info", title: "Da bo yeu thich", message: "San pham da duoc xoa khoi danh sach." });
  };

  const handleAddToCart = (product: any) => {
    addToCart(product);
    openCart();
    showToast({ type: "success", title: "Da them vao gio hang!", message: product.name });
  };

  const handleBuyNow = (product: any) => {
    addToCart(product);
    router.push("/checkout");
  };

  return (
    <SiteChrome>
      <main className="min-h-screen bg-[#F5F0E8] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/products" className="flex items-center gap-2 text-espresso/60 hover:text-espresso text-xs tracking-wider transition-colors">
              <ArrowLeft size={16} />
              <span>Tiep Tuc Mua Sam</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
              <Heart size={20} className="fill-red-400 text-red-400" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl text-espresso">San Pham Yeu Thich</h1>
              <p className="text-xs text-espresso/50 mt-0.5">
                {wishlist.length > 0 ? `${wishlist.length} san pham trong danh sach` : "Danh sach trong"}
              </p>
            </div>
          </div>

          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white/60 rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/5] bg-espresso/10" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-espresso/10 rounded w-3/4" />
                    <div className="h-3 bg-espresso/10 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && wishlist.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
              <div className="w-24 h-24 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
                <Heart size={40} className="text-red-200" />
              </div>
              <h2 className="font-serif text-2xl text-espresso mb-2">Chua co san pham yeu thich</h2>
              <p className="text-espresso/50 text-sm mb-6">Bam vao icon tim tren san pham de luu vao danh sach yeu thich.</p>
              <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors">
                <Sparkles size={14} />
                Kham Pha San Pham
              </Link>
            </motion.div>
          )}

          {!loading && wishlistProducts.length > 0 && (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {wishlistProducts.map((product) => {
                  const mainImage = product.images?.[0]?.image_url || product.image || "/images/sofa-1.jpg";
                  const slug = product.slug || product.id;
                  return (
                    <motion.div key={product.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }} className="group bg-white/70 border border-espresso/10 rounded-2xl overflow-hidden hover:border-gold/50 hover:shadow-lg transition-all flex flex-col">
                      <Link href={`/products/${slug}`} className="relative aspect-[4/5] block overflow-hidden bg-champagne/20">
                        <Image src={mainImage} alt={product.name} fill className="object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                        <button onClick={(e) => { e.preventDefault(); handleRemove(String(product.id)); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors shadow" title="Bo yeu thich">
                          <Heart size={14} className="fill-red-400" />
                        </button>
                      </Link>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] tracking-widest2 uppercase text-espresso/50 truncate mb-0.5">{product.category?.name || "Noi that"}</p>
                          <Link href={`/products/${slug}`}><h3 className="font-serif text-sm text-espresso line-clamp-1 hover:text-gold transition-colors font-medium">{product.name}</h3></Link>
                          <p className="font-serif text-sm text-gold font-bold mt-1">{formatPrice(product.price)}</p>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-3">
                          <button onClick={() => handleBuyNow(product)} className="w-full py-2 rounded-lg bg-gradient-to-r from-gold via-amber-400 to-gold text-charcoal text-[11px] font-bold tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 transition-all">
                            <Zap size={12} />
                            Mua Ngay
                          </button>
                          <button onClick={() => handleAddToCart(product)} className="w-full py-2 rounded-lg bg-espresso/90 hover:bg-espresso text-beige text-[11px] font-bold tracking-wider flex items-center justify-center gap-1.5 transition-colors">
                            <ShoppingBag size={12} />
                            Them Gio Hang
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>
    </SiteChrome>
  );
}
