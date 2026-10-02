"use client";

import { useState } from "react";
import { Filter, RotateCcw, Check, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { formatPrice } from "@/lib/products";

export type FilterState = {
  category: string;
  maxPrice: number;
  material: string;
  color: string;
  style: string;
};

type FilterSidebarProps = {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
  totalResults: number;
};

const CATEGORIES = [
  { id: "all", name: "Tất Cả Sản Phẩm" },
  { id: "living-room", name: "Sofa & Phòng Khách" },
  { id: "dining", name: "Bàn Ghế Ăn Dát Vàng" },
  { id: "bedroom", name: "Giường Ngủ Óc Chó" },
  { id: "decor", name: "Bàn Trà & Đèn Trang Trí" },
];

const MATERIALS = [
  { id: "all", name: "Tất cả chất liệu" },
  { id: "leather", name: "Da Bò Ý Tuscan" },
  { id: "walnut", name: "Gỗ Óc Chó Bắc Mỹ" },
  { id: "velvet", name: "Vải Nhung Bỉ" },
  { id: "marble", name: "Đá Cẩm Thạch Carrara" },
  { id: "gold_pvd", name: "Titan Mạ Vàng PVD" },
];

const COLORS = [
  { id: "all", name: "Tất cả màu", hex: "transparent" },
  { id: "cognac", name: "Cognac", hex: "#964B00" },
  { id: "charcoal", name: "Charcoal", hex: "#222222" },
  { id: "walnut", name: "Walnut Wood", hex: "#3E2723" },
  { id: "gold", name: "Champagne Gold", hex: "#D4AF37" },
  { id: "cream", name: "Nappa Cream", hex: "#F5EBE1" },
  { id: "emerald", name: "Emerald", hex: "#1B4332" },
];

const STYLES = [
  { id: "all", name: "Tất cả phong cách" },
  { id: "modern", name: "Hiện Đại (Modern Luxe)" },
  { id: "classic", name: "Hoàng Gia (Imperial Classic)" },
  { id: "minimalist", name: "Tối Giản (Minimalist)" },
  { id: "nordic", name: "Bắc Âu (Scandinavian)" },
];

export default function FilterSidebar({
  filters,
  onChange,
  onReset,
  totalResults,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    material: true,
    color: true,
    style: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters =
    filters.category !== "all" ||
    filters.material !== "all" ||
    filters.color !== "all" ||
    filters.style !== "all" ||
    filters.maxPrice < 150000000;

  return (
    <aside aria-label="Bộ lọc sản phẩm" className="bg-white/70 backdrop-blur-md border border-espresso/10 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-espresso/10">
        <div className="flex items-center space-x-2 text-espresso font-serif font-bold text-lg">
          <SlidersHorizontal size={18} className="text-gold" />
          <span>Bộ Lọc Tuyển Chọn</span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center space-x-1 text-[11px] text-espresso/60 hover:text-gold transition-colors font-medium"
          >
            <RotateCcw size={12} />
            <span>Đặt lại</span>
          </button>
        )}
      </div>

      {/* 1. Category Filter */}
      <div className="space-y-3 pb-4 border-b border-espresso/10">
        <button
          onClick={() => toggleSection("categories")}
          className="w-full flex items-center justify-between text-xs uppercase tracking-widest2 font-bold text-espresso"
        >
          <span>Danh Mục Không Gian</span>
          {expandedSections.categories ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expandedSections.categories && (
          <div className="space-y-1.5 pt-1">
            {CATEGORIES.map((cat) => {
              const isSelected = filters.category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onChange({ ...filters, category: cat.id })}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-espresso text-beige font-semibold shadow-sm"
                      : "text-espresso/70 hover:bg-espresso/5 hover:text-espresso"
                  }`}
                >
                  <span>{cat.name}</span>
                  {isSelected && <Check size={14} className="text-gold" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Price Range Slider */}
      <div className="space-y-3 pb-4 border-b border-espresso/10">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between text-xs uppercase tracking-widest2 font-bold text-espresso"
        >
          <span>Mức Giá Tối Đa</span>
          {expandedSections.price ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expandedSections.price && (
          <div className="space-y-2.5 pt-1">
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-espresso/60">Đến:</span>
              <span className="font-serif text-sm font-bold text-gold">
                {formatPrice(filters.maxPrice)}
              </span>
            </div>

            <input
              type="range"
              min="5000000"
              max="150000000"
              step="5000000"
              value={filters.maxPrice}
              onChange={(e) =>
                onChange({ ...filters, maxPrice: parseInt(e.target.value) })
              }
              className="w-full accent-gold h-1.5 bg-espresso/10 rounded cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 3. Materials Filter */}
      <div className="space-y-3 pb-4 border-b border-espresso/10">
        <button
          onClick={() => toggleSection("material")}
          className="w-full flex items-center justify-between text-xs uppercase tracking-widest2 font-bold text-espresso"
        >
          <span>Chất Liệu Thượng Hạng</span>
          {expandedSections.material ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expandedSections.material && (
          <div className="space-y-1.5 pt-1">
            {MATERIALS.map((mat) => {
              const isSelected = filters.material === mat.id;
              return (
                <button
                  key={mat.id}
                  onClick={() => onChange({ ...filters, material: mat.id })}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? "text-gold font-bold bg-gold/10"
                      : "text-espresso/70 hover:text-espresso"
                  }`}
                >
                  <span>{mat.name}</span>
                  {isSelected && <Check size={13} className="text-gold" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Color Swatch Filter */}
      <div className="space-y-3 pb-4 border-b border-espresso/10">
        <button
          onClick={() => toggleSection("color")}
          className="w-full flex items-center justify-between text-xs uppercase tracking-widest2 font-bold text-espresso"
        >
          <span>Bảng Màu Độc Bản</span>
          {expandedSections.color ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expandedSections.color && (
          <div className="grid grid-cols-4 gap-2 pt-1">
            {COLORS.map((c) => {
              const isSelected = filters.color === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onChange({ ...filters, color: c.id })}
                  title={c.name}
                  className={`relative flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "border-gold bg-gold/15 shadow-sm"
                      : "border-espresso/10 hover:border-espresso/30 bg-white/50"
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-black/20 shadow-inner block"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-[10px] text-espresso/70 mt-1 truncate w-full font-medium">
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Interior Style Filter */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection("style")}
          className="w-full flex items-center justify-between text-xs uppercase tracking-widest2 font-bold text-espresso"
        >
          <span>Phong Cách Nội Thất</span>
          {expandedSections.style ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expandedSections.style && (
          <div className="space-y-1.5 pt-1">
            {STYLES.map((st) => {
              const isSelected = filters.style === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => onChange({ ...filters, style: st.id })}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? "text-gold font-bold bg-gold/10"
                      : "text-espresso/70 hover:text-espresso"
                  }`}
                >
                  <span>{st.name}</span>
                  {isSelected && <Check size={13} className="text-gold" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Count Footer */}
      <div className="pt-2 text-center text-xs text-espresso/60 font-serif">
        Hiển thị <strong>{totalResults}</strong> kiệt tác phù hợp
      </div>
    </aside>
  );
}
