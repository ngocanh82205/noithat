"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRightLeft, ShoppingBag, Trash2 } from "lucide-react";
import { useStore } from "./StoreContext";
import { formatPrice } from "@/lib/products";

export default function ProductComparisonModal() {
  const {
    comparisonList,
    removeFromCompare,
    clearCompare,
    isCompareOpen,
    openCompare,
    closeCompare,
    addToCart,
  } = useStore();

  if (comparisonList.length === 0) return null;

  return (
    <>
      {/* Floating Compare Bottom Bar */}
      {!isCompareOpen && (
        <div className="fixed bottom-6 left-6 z-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-espresso text-beige px-4 py-3 border border-gold/40 shadow-2xl rounded-full"
          >
            <div className="flex items-center gap-2">
              <ArrowRightLeft size={16} className="text-gold" />
              <span className="text-xs font-medium">
                So sánh ({comparisonList.length}/4)
              </span>
            </div>

            <div className="flex -space-x-2 overflow-hidden">
              {comparisonList.map((p) => {
                const img =
                  p.images?.[0]?.image_url || p.image || "/images/sofa-1.jpg";
                return (
                  <div
                    key={p.id}
                    className="relative w-7 h-7 rounded-full border border-gold overflow-hidden bg-white"
                  >
                    <Image src={img} alt={p.name} fill className="object-cover" />
                  </div>
                );
              })}
            </div>

            <button
              onClick={openCompare}
              className="px-3 py-1 bg-gold text-charcoal text-[11px] uppercase tracking-wider font-semibold rounded-full hover:bg-champagne transition-colors"
            >
              So Sánh Ngay
            </button>

            <button
              onClick={clearCompare}
              className="p-1 text-beige/50 hover:text-beige"
              title="Xóa danh sách so sánh"
            >
              <X size={14} />
            </button>
          </motion.div>
        </div>
      )}

      {/* Full Comparison Table Modal */}
      <AnimatePresence>
        {isCompareOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCompare}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-5xl bg-beige border border-espresso/20 shadow-2xl p-6 md:p-8 z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-espresso/15 mb-6">
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl text-espresso flex items-center gap-2">
                    <ArrowRightLeft className="text-gold" size={24} /> Bảng So Sánh Sản Phẩm
                  </h2>
                  <p className="text-xs text-espresso/60 tracking-wider mt-1">
                    Đối chiếu thông số kỹ thuật, chất liệu và giá trị hoàn thiện giữa các tuyệt tác
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={clearCompare}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <Trash2 size={13} /> Xóa tất cả
                  </button>
                  <button
                    onClick={closeCompare}
                    className="p-2 text-espresso/60 hover:text-espresso"
                    aria-label="Đóng"
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-espresso/15">
                      <th className="p-3 w-40 text-[11px] uppercase tracking-widest2 text-espresso/50 font-medium">
                        Sản phẩm
                      </th>
                      {comparisonList.map((p) => {
                        const img =
                          p.images?.[0]?.image_url || p.image || "/images/sofa-1.jpg";

                        return (
                          <th key={p.id} className="p-3 min-w-[200px] align-top">
                            <div className="relative aspect-[4/3] overflow-hidden bg-white/70 border border-espresso/10 mb-3">
                              <Image src={img} alt={p.name} fill className="object-cover" />
                              <button
                                onClick={() => removeFromCompare(p.id)}
                                className="absolute top-2 right-2 p-1 bg-white/80 rounded-full text-espresso hover:text-red-600"
                                title="Xóa"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <h4 className="font-serif text-sm text-espresso font-semibold line-clamp-2">
                              {p.name}
                            </h4>
                            <p className="font-serif text-base text-gold font-bold mt-1">
                              {formatPrice(p.price)}
                            </p>
                            <button
                              onClick={() => addToCart(p)}
                              className="mt-3 w-full py-2 bg-espresso text-beige text-[10px] tracking-widest2 uppercase hover:bg-gold transition-colors font-medium flex items-center justify-center gap-1"
                            >
                              <ShoppingBag size={12} /> Thêm Giỏ Hàng
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-espresso/10">
                    {/* Category */}
                    <tr>
                      <td className="p-3 font-medium text-espresso/70 bg-white/30">
                        Không gian / Phòng
                      </td>
                      {comparisonList.map((p) => (
                        <td key={p.id} className="p-3 text-espresso">
                          {p.category?.name || p.category || "Nội thất cao cấp"}
                        </td>
                      ))}
                    </tr>

                    {/* Material */}
                    <tr>
                      <td className="p-3 font-medium text-espresso/70 bg-white/30">
                        Chất liệu hoàn thiện
                      </td>
                      {comparisonList.map((p) => (
                        <td key={p.id} className="p-3 text-espresso font-medium">
                          {p.material || "Gỗ tự nhiên & da nhập khẩu"}
                        </td>
                      ))}
                    </tr>

                    {/* Dimensions */}
                    <tr>
                      <td className="p-3 font-medium text-espresso/70 bg-white/30">
                        Kích thước tiêu chuẩn
                      </td>
                      {comparisonList.map((p) => (
                        <td key={p.id} className="p-3 text-espresso">
                          {p.dimensions || "Theo bản vẽ tiêu chuẩn"}
                        </td>
                      ))}
                    </tr>

                    {/* Warranty */}
                    <tr>
                      <td className="p-3 font-medium text-espresso/70 bg-white/30">
                        Bảo hành chính hãng
                      </td>
                      {comparisonList.map((p) => (
                        <td key={p.id} className="p-3 text-espresso font-medium text-green-800">
                          {p.warranty || "24 tháng chính hãng"}
                        </td>
                      ))}
                    </tr>

                    {/* Care Instructions */}
                    <tr>
                      <td className="p-3 font-medium text-espresso/70 bg-white/30">
                        Hướng dẫn bảo dưỡng
                      </td>
                      {comparisonList.map((p) => (
                        <td key={p.id} className="p-3 text-espresso/70 text-[11px]">
                          {p.care_instructions || "Lau bằng khăn mềm ẩm, tránh tiếp xúc trực tiếp ánh nắng gay gắt."}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
