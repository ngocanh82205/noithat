"use client";

import { useState } from "react";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import ProductViewer3D, { ColorVariant } from "./ProductViewer3D";
import { useStore } from "./StoreContext";
import { formatPrice } from "@/lib/products";
import Link from "next/link";

type Product3DModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: any;
};

export default function Product3DModal({
  isOpen,
  onClose,
  product,
}: Product3DModalProps) {
  const { addToCart, openCart } = useStore();
  const [selectedVariant, setSelectedVariant] = useState<ColorVariant | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(product?.price || 0);
  const [added, setAdded] = useState(false);

  if (!isOpen || !product) return null;

  const handleVariantChange = (variant: ColorVariant, newPrice: number) => {
    setSelectedVariant(variant);
    setCurrentPrice(newPrice);
  };

  const handleAddToCart = () => {
    addToCart(product, selectedVariant as any, 1);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
      openCart();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-beige border border-gold/40 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-charcoal/10 hover:bg-charcoal/20 text-espresso transition-colors z-30"
          aria-label="Đóng xem 3D"
        >
          <X size={20} />
        </button>

        {/* Modal Title */}
        <div className="pr-12">
          <span className="text-[10px] text-gold uppercase tracking-widest2 font-bold block">
            Khảo Sát 3D Trực Quan
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-espresso">
            {product.name}
          </h2>
          <p className="text-xs text-espresso/60 mt-1 line-clamp-1">
            {product.summary || product.description || "Nội thất cao cấp thủ công thượng hạng"}
          </p>
        </div>

        {/* Embedded 3D Interactive Canvas */}
        <ProductViewer3D
          productName={product.name}
          basePrice={product.price}
          category={product.categorySlug || "sofa"}
          onVariantChange={handleVariantChange}
        />

        {/* Bottom Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-espresso/10">
          <div>
            <span className="text-xs text-espresso/60 block">Giá thanh toán theo phiên bản:</span>
            <span className="font-serif text-2xl text-gold font-bold">
              {formatPrice(currentPrice || product.price)}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href={`/products/${product.id}`}
              className="px-5 py-3.5 border border-espresso/20 hover:border-gold text-espresso text-xs font-serif tracking-wider uppercase rounded-xl transition-colors text-center shrink-0"
            >
              Xem Chi Tiết Đầy Đủ
            </Link>

            <button
              onClick={handleAddToCart}
              disabled={added}
              className="flex-1 sm:flex-initial px-8 py-3.5 bg-espresso hover:bg-gold text-beige text-xs font-serif font-bold tracking-widest2 uppercase rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              <span>{added ? "✓ Đã Thêm Vào Giỏ!" : "Thêm Vào Giỏ Hàng"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
