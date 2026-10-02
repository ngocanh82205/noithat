"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, ShoppingBag, Check, Sparkles, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/products";
import { useStore } from "./StoreContext";

type BundleItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  material: string;
};

const BUNDLE_ITEMS: BundleItem[] = [
  {
    id: "bundle-1",
    name: "Sofa Góc L Da Bò Ý Tuscan Cognac",
    category: "Sofa chính",
    price: 38500000,
    image: "/images/sofa-1.jpg",
    material: "Da bò Tuscan, đệm lông vũ",
  },
  {
    id: "bundle-2",
    name: "Bàn Trà Đôi Đá Cẩm Thạch Carrara",
    category: "Bàn trà đi kèm",
    price: 18500000,
    image: "/images/dining-table-1.jpg",
    material: "Đá Marble Ý tự nhiên, mạ PVD vàng",
  },
  {
    id: "bundle-3",
    name: "Thảm Lông Cừu Dệt Tay New Zealand",
    category: "Thảm sàn",
    price: 12000000,
    image: "/images/rug-1.jpg",
    material: "100% len cừu tự nhiên dệt tay",
  },
];

export default function ShoppableRoomBundle() {
  const { addToCart, openCart } = useStore();
  const [added, setAdded] = useState(false);

  const totalPrice = BUNDLE_ITEMS.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = Math.floor(totalPrice * 0.12); // 12% combo discount
  const comboPrice = totalPrice - discountAmount;

  const handleAddBundle = () => {
    BUNDLE_ITEMS.forEach((item) => {
      addToCart(item as any, null, 1);
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 1000);
  };

  return (
    <section className="py-16 md:py-24 bg-sand/20 border-t border-espresso/10">
      <div className="mx-auto max-w-[1360px] px-6">
        <div className="bg-white border border-gold/40 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-gold text-xs font-bold uppercase tracking-widest2 mb-2">
                <Sparkles size={15} />
                <span>Gợi Ý Phối Trọn Bộ Không Gian</span>
              </div>
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-espresso">
                Bộ Sưu Tập Phòng Khách Hoàn Hảo (Gợi Ý Từ Kiến Trúc Sư)
              </h3>
            </div>
            <span className="bg-gold/20 text-wood-dark text-xs font-serif font-bold px-4 py-1.5 rounded-full border border-gold/30 self-start sm:self-auto">
              🎁 Giảm thêm 12% khi mua cả bộ
            </span>
          </div>

          {/* Bundle Items Visual Chain */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* 3 Item Cards (9 cols) */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {BUNDLE_ITEMS.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-sand/30 border border-espresso/10 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative group"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-gold uppercase font-bold tracking-wider">
                      {item.category}
                    </span>
                    <h4 className="font-serif font-bold text-xs text-espresso line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-espresso/60 line-clamp-1">{item.material}</p>
                    <div className="font-serif font-semibold text-xs text-gold">
                      {formatPrice(item.price)}
                    </div>
                  </div>

                  {idx < BUNDLE_ITEMS.length - 1 && (
                    <div className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gold text-charcoal items-center justify-center font-bold text-xs z-10 shadow-md">
                      +
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total Calculation & CTA (4 cols) */}
            <div className="md:col-span-4 bg-espresso text-beige rounded-2xl p-6 space-y-5 border border-gold/40 shadow-lg">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-beige/60">
                  <span>Tổng giá bán lẻ 3 món:</span>
                  <span className="line-through">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-green-400 font-medium">
                  <span>Ưu đãi mua combo (12%):</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-white/10 text-sm">
                  <span className="font-serif text-champagne font-bold">Giá trọn bộ 3 món:</span>
                  <span className="font-serif text-xl font-bold text-gold">
                    {formatPrice(comboPrice)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleAddBundle}
                disabled={added}
                className="w-full py-4 bg-gradient-to-r from-gold to-gold-dark text-charcoal font-serif font-bold text-xs uppercase tracking-widest2 rounded-xl shadow-lg hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} />
                <span>{added ? "✓ Đã Thêm 3 Món Vào Giỏ!" : "Thêm Trọn Bộ Vào Giỏ Hàng"}</span>
              </button>

              <p className="text-[10px] text-center text-beige/50 font-light">
                Vận chuyển White-Glove &amp; Lắp đặt hoàn thiện tận phòng
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
