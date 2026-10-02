// components/SearchModal.tsx — GS Luxury Smart Search with History & Trending
"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, TrendingUp, ArrowRight, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { productService, ApiProduct } from "@/services/api";
import { products as fallbackProducts, formatPrice } from "@/lib/products";

const TRENDING_KEYWORDS = [
  "Sofa da bò Ý",
  "Bàn ăn Marble",
  "Đèn Solstice",
  "Giường ngủ Master",
  "Ghế thư giãn Lounge",
];

const SUGGESTION_MAP: Record<string, string[]> = {
  bàn: ["Bàn ăn cao cấp", "Bàn làm việc", "Bàn trà phòng khách", "Bàn trang điểm"],
  ghế: ["Ghế sofa da bò", "Ghế ăn phòng bếp", "Ghế văn phòng", "Ghế thư giãn"],
  sofa: ["Sofa da bò Ý", "Sofa góc chữ L", "Sofa phong cách Scandinavian", "Sofa Modular"],
  giường: ["Giường ngủ Master King", "Giường đầu bọc da", "Giường gỗ sồi"],
  tủ: ["Tủ quần áo âm tường", "Tủ tivi phòng khách", "Tủ rượu sành điệu", "Tủ đầu giường"],
  đèn: ["Đèn chùm pha lê", "Đèn sàn phong cách Wabi-Sabi", "Đèn bàn thành thư"],
  thảm: ["Thảm lông cao cấp", "Thảm Ba Tư trực tiếp", "Thảm Kilim thủ công"],
  nội: ["Nội thất phòng khách", "Nội thất phòng ngủ", "Nội thất văn phòng"],
};

export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [apiResults, setApiResults] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Generate suggestions based on query
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }
    const q = query.toLowerCase();
    const matched: string[] = [];
    Object.entries(SUGGESTION_MAP).forEach(([key, values]) => {
      if (key.includes(q) || q.includes(key)) {
        matched.push(...values);
      }
    });
    // Also add prefix suggestions from trending
    TRENDING_KEYWORDS.forEach((kw) => {
      if (kw.toLowerCase().includes(q) && !matched.includes(kw)) matched.push(kw);
    });
    setSuggestions(matched.slice(0, 5));
  }, [query]);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gs_recent_searches");
        if (saved) setRecentSearches(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, [open]);

  // Live search debounced
  useEffect(() => {
    if (!query.trim()) {
      setApiResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      productService
        .getAll({ q: query.trim(), per_page: 6 })
        .then((res) => {
          if (res.success && res.data) {
            setApiResults(res.data);
          }
        })
        .catch(() => {
          // Fallback search
          const q = query.toLowerCase();
          const filtered = fallbackProducts.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q)
          );
          setApiResults(filtered as any);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const saveSearchTerm = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter((t) => t !== term)].slice(0, 6);
    setRecentSearches(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("gs_recent_searches", JSON.stringify(updated));
    }
  };

  const removeSearchTerm = (term: string) => {
    const updated = recentSearches.filter((t) => t !== term);
    setRecentSearches(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("gs_recent_searches", JSON.stringify(updated));
    }
  };

  const clearAllSearches = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("gs_recent_searches");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] bg-charcoal/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto mt-20 w-[92%] max-w-2xl bg-beige border border-espresso/15 shadow-2xl overflow-hidden"
          >
            {/* Input Bar */}
            <div className="flex items-center gap-3 border-b border-espresso/10 px-6 py-5 bg-white/60 relative">
              <Search strokeWidth={1.5} size={22} className="text-espresso/50" />
              <div className="flex-1 relative">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && query.trim()) {
                      saveSearchTerm(query.trim());
                      setSuggestions([]);
                    }
                  }}
                  placeholder="Tìm sofa, bàn ăn, đèn chùm, da bò Mastrotto..."
                  className="w-full bg-transparent outline-none text-base sm:text-lg font-serif placeholder:text-espresso/40 text-espresso"
                />
                {/* Autocomplete suggestions dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-espresso/10 rounded-xl shadow-xl z-50 overflow-hidden">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setQuery(s); saveSearchTerm(s); setSuggestions([]); }}
                        className="w-full text-left px-4 py-2.5 text-xs text-espresso hover:bg-gold/10 hover:text-gold flex items-center gap-2 transition-colors"
                      >
                        <Search size={12} className="text-espresso/30" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {query && (
                <button onClick={() => { setQuery(""); setSuggestions([]); }} className="p-1 text-espresso/40 hover:text-espresso">
                  <X size={16} />
                </button>
              )}
              <button onClick={onClose} className="p-1 text-espresso/60 hover:text-espresso focus-ring" aria-label="Đóng tìm kiếm">
                <X strokeWidth={1.5} size={22} />
              </button>
            </div>

            {/* Content: Suggestions & History when input is empty */}
            {!query.trim() && (
              <div className="p-6 space-y-6">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] uppercase tracking-widest2 text-espresso/60 flex items-center gap-1.5 font-medium">
                        <Clock size={13} /> Lịch Sử Tìm Kiếm
                      </span>
                      <button
                        onClick={clearAllSearches}
                        className="text-[10px] text-espresso/40 hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 size={11} /> Xóa tất cả
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-espresso/10 text-xs text-espresso rounded-full hover:border-gold transition-colors"
                        >
                          <button
                            onClick={() => {
                              setQuery(term);
                              saveSearchTerm(term);
                            }}
                            className="hover:text-gold"
                          >
                            {term}
                          </button>
                          <button
                            onClick={() => removeSearchTerm(term)}
                            className="text-espresso/30 hover:text-espresso"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Keywords */}
                <div>
                  <span className="text-[11px] uppercase tracking-widest2 text-espresso/60 flex items-center gap-1.5 font-medium mb-3">
                    <TrendingUp size={13} className="text-gold" /> Từ Khóa Thịnh Hành
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_KEYWORDS.map((kw, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuery(kw);
                          saveSearchTerm(kw);
                        }}
                        className="px-3 py-1.5 bg-white/40 border border-espresso/15 text-xs text-espresso/80 hover:bg-gold hover:text-charcoal hover:border-gold transition-colors rounded-full"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Live Search Results */}
            {query.trim() && (
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-espresso/10 p-2">
                {loading ? (
                  <p className="px-6 py-8 text-center text-xs text-espresso/50">
                    Đang tìm kiếm...
                  </p>
                ) : apiResults.length > 0 ? (
                  apiResults.map((product) => {
                    const img =
                      product.images?.[0]?.image_url || (product as any).image || "/images/sofa-1.jpg";

                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug || product.id}`}
                        onClick={() => {
                          saveSearchTerm(query.trim());
                          onClose();
                        }}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-white/60 transition-colors rounded-lg"
                      >
                        <div className="relative w-14 h-14 shrink-0 overflow-hidden bg-white border border-espresso/10 rounded">
                          <Image src={img} alt={product.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-sm text-espresso truncate">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-espresso/50">
                            {product.category?.name || (product as any).collection || "Nội thất"}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-gold font-serif shrink-0">
                          {formatPrice(product.price)}
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <p className="px-6 py-8 text-center text-xs text-espresso/50">
                    Không tìm thấy sản phẩm phù hợp với &ldquo;{query}&rdquo;
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
