"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Sunset,
  Moon,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Camera,
  Layers,
  Check,
  ArrowRight,
  Download,
  Calendar,
} from "lucide-react";
import { useStore } from "./StoreContext";
import { formatPrice } from "@/lib/products";
import Link from "next/link";

type LightingPreset = "daylight" | "sunset" | "midnight" | "cinematic";

type FurnitureOption = {
  id: string;
  name: string;
  category: string;
  material: string;
  price: number;
  image: string;
  badge?: string;
};

const SOFA_OPTIONS: FurnitureOption[] = [
  {
    id: "sofa_cognac",
    name: "Sofa Góc L Da Bò Ý Tuscan Cognac",
    category: "Sofa",
    material: "Da bò thuộc thảo mộc vùng Tuscany, khung gỗ sồi",
    price: 38500000,
    image: "/images/sofa-1.jpg",
    badge: "Bán chạy nhất",
  },
  {
    id: "sofa_charcoal",
    name: "Sofa Văng 3 Chỗ Velvet Charcoal",
    category: "Sofa",
    material: "Vải nhung Bỉ chống bám bụi, đệm mút lông vũ",
    price: 34000000,
    image: "/images/sofa-3.jpg",
  },
  {
    id: "sofa_cream",
    name: "Sofa Cong Nordic Cream Nappa Luxury",
    category: "Sofa",
    material: "Da Nappa cao cấp nhập khẩu, đường may thủ công",
    price: 42000000,
    image: "/images/sofa-2.jpg",
    badge: "Mẫu mới 2026",
  },
];

const TABLE_OPTIONS: FurnitureOption[] = [
  {
    id: "table_carrara",
    name: "Bàn Trà Đôi Đá Cẩm Thạch Carrara",
    category: "Bàn trà",
    material: "Đá Marble tự nhiên Ý chống ố, chân mạ PVD vàng",
    price: 18500000,
    image: "/images/dining-table-1.jpg",
  },
  {
    id: "table_walnut",
    name: "Bàn Trà Gỗ Óc Chó Bắc Mỹ Nguyên Khối",
    category: "Bàn trà",
    material: "Gỗ óc chó FAS tự nhiên, sơn phủ dầu lau dưỡng gỗ",
    price: 22000000,
    image: "/images/coffee-table-2.jpg",
    badge: "Gỗ tự nhiên",
  },
  {
    id: "table_gold_glass",
    name: "Bàn Trà Mặt Kính Khói Viền Gold",
    category: "Bàn trà",
    material: "Kính cường lực 12mm, khung titan chống trầy",
    price: 16000000,
    image: "/images/coffee-table-3.jpg",
  },
];

const LIGHT_OPTIONS: FurnitureOption[] = [
  {
    id: "light_crystal",
    name: "Đèn Chùm Pha Lê K9 Imperial Royal",
    category: "Đèn chiếu sáng",
    material: "Pha lê cao cấp K9, khung mạ vàng 24K",
    price: 28000000,
    image: "/images/lamp-2.jpg",
    badge: "Hoàng gia",
  },
  {
    id: "light_arc",
    name: "Đèn Cây Vòm Nordic Brass Minimalist",
    category: "Đèn chiếu sáng",
    material: "Đồng thau nguyên chất, chao đèn điều hướng 360",
    price: 9500000,
    image: "/images/lamp-1.jpg",
  },
];

const CARPET_OPTIONS: FurnitureOption[] = [
  {
    id: "carpet_wool",
    name: "Thảm Lông Cừu Dệt Tay Thủ Công",
    category: "Thảm sàn",
    material: "100% len New Zealand, êm ái chống tĩnh điện",
    price: 12000000,
    image: "/images/rug-1.jpg",
  },
  {
    id: "carpet_silk",
    name: "Thảm Lụa Ba Tư Họa Tiết Vàng Hoàng Kim",
    category: "Thảm sàn",
    material: "Sợi tơ lụa tự nhiên dệt mật độ cao 1.2 triệu nút",
    price: 19500000,
    image: "/images/rug-2.jpg",
  },
];

export default function VirtualRoomStudio() {
  const { addToCart, openCart } = useStore();

  const [lighting, setLighting] = useState<LightingPreset>("daylight");
  const [selectedSofa, setSelectedSofa] = useState<FurnitureOption>(SOFA_OPTIONS[0]);
  const [selectedTable, setSelectedTable] = useState<FurnitureOption>(TABLE_OPTIONS[0]);
  const [selectedLight, setSelectedLight] = useState<FurnitureOption>(LIGHT_OPTIONS[0]);
  const [selectedCarpet, setSelectedCarpet] = useState<FurnitureOption>(CARPET_OPTIONS[0]);

  const [activeSlot, setActiveSlot] = useState<"sofa" | "table" | "light" | "carpet">("sofa");
  const [cameraAngle, setCameraAngle] = useState<"panorama" | "sofa_close" | "window">("panorama");
  const [addedAll, setAddedAll] = useState(false);

  // Total Room Calculation
  const totalRoomPrice = useMemo(() => {
    return selectedSofa.price + selectedTable.price + selectedLight.price + selectedCarpet.price;
  }, [selectedSofa, selectedTable, selectedLight, selectedCarpet]);

  const discountedRoomPrice = useMemo(() => {
    return Math.floor(totalRoomPrice * 0.85); // 15% discount for complete room set
  }, [totalRoomPrice]);

  const handleAddFullRoomToCart = () => {
    addToCart(selectedSofa, null, 1);
    addToCart(selectedTable, null, 1);
    addToCart(selectedLight, null, 1);
    addToCart(selectedCarpet, null, 1);
    setAddedAll(true);
    setTimeout(() => {
      setAddedAll(false);
      openCart();
    }, 1200);
  };

  // Dynamic Lighting Atmosphere Classes
  const getLightingStyle = () => {
    switch (lighting) {
      case "sunset":
        return "brightness-95 sepia-[0.35] hue-rotate-[-10deg] contrast-105";
      case "midnight":
        return "brightness-75 contrast-125 saturate-125";
      case "cinematic":
        return "brightness-90 contrast-135 saturate-90";
      default:
        return "brightness-100 contrast-100";
    }
  };

  const getAmbientOverlay = () => {
    switch (lighting) {
      case "sunset":
        return "bg-gradient-to-tr from-amber-950/40 via-orange-900/15 to-transparent mix-blend-color-burn";
      case "midnight":
        return "bg-gradient-to-t from-black/80 via-blue-950/40 to-transparent mix-blend-multiply";
      case "cinematic":
        return "bg-gradient-to-r from-black/60 via-amber-950/20 to-black/60 mix-blend-overlay";
      default:
        return "bg-gradient-to-t from-black/30 to-transparent";
    }
  };

  return (
    <section className="py-20 md:py-28 bg-charcoal text-beige relative overflow-hidden">
      <div className="mx-auto max-w-[1360px] px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center space-x-2 text-gold text-xs font-semibold uppercase tracking-widest2 mb-3">
              <Sparkles size={16} />
              <span>Công Nghệ Trải Nghiệm Độc Quyền</span>
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-beige max-w-2xl leading-tight">
              3D Virtual Studio: Phối Cảnh &amp; Đổi Ánh Sáng Thời Gian Thực
            </h2>
          </div>
          <p className="text-xs md:text-sm text-beige/70 max-w-md font-light leading-relaxed">
            Tự do thử nghiệm vật liệu, thay đổi 4 chế độ ánh sáng và tính toán ngân sách hoàn thiện phòng khách Penthouse trong chớp mắt.
          </p>
        </div>

        {/* Studio Main Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left / Center: Interactive 3D Canvas (8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            {/* Canvas Container */}
            <div className="relative aspect-[16/10] md:aspect-[16/9] w-full rounded-2xl overflow-hidden border border-gold/40 shadow-2xl bg-black select-none group">
              {/* Main Room Base Render */}
              <div className={`relative w-full h-full transition-all duration-700 ease-in-out ${getLightingStyle()}`}>
                <Image
                  src={
                    cameraAngle === "sofa_close"
                      ? "/images/sofa-1.jpg"
                      : cameraAngle === "window"
                        ? "/images/dining-table-2.jpg"
                        : "/images/hero-banner.jpg"
                  }
                  alt="3D Virtual Room Studio"
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Dynamic Atmospheric Light Overlay */}
              <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ${getAmbientOverlay()}`} />

              {/* Floating Hotspots on Scene */}
              {/* 1. Hotspot Sofa */}
              <div className="absolute top-[58%] left-[48%] -translate-x-1/2 -translate-y-1/2 z-20">
                <button
                  onClick={() => setActiveSlot("sofa")}
                  className={`group relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${activeSlot === "sofa"
                    ? "bg-gold text-charcoal border-white scale-110 shadow-[0_0_15px_rgba(212,175,55,1)]"
                    : "bg-black/70 text-gold border-gold/80 hover:scale-105"
                    }`}
                >
                  <span className="text-xs font-bold font-serif">1</span>
                  <span className="absolute left-10 whitespace-nowrap bg-charcoal/90 backdrop-blur-sm text-beige border border-gold/40 px-3 py-1 rounded-full text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                    🛋️ {selectedSofa.name} ({formatPrice(selectedSofa.price)})
                  </span>
                </button>
              </div>

              {/* 2. Hotspot Table */}
              <div className="absolute top-[72%] left-[62%] -translate-x-1/2 -translate-y-1/2 z-20">
                <button
                  onClick={() => setActiveSlot("table")}
                  className={`group relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${activeSlot === "table"
                    ? "bg-gold text-charcoal border-white scale-110 shadow-[0_0_15px_rgba(212,175,55,1)]"
                    : "bg-black/70 text-gold border-gold/80 hover:scale-105"
                    }`}
                >
                  <span className="text-xs font-bold font-serif">2</span>
                  <span className="absolute left-10 whitespace-nowrap bg-charcoal/90 backdrop-blur-sm text-beige border border-gold/40 px-3 py-1 rounded-full text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                    ☕ {selectedTable.name} ({formatPrice(selectedTable.price)})
                  </span>
                </button>
              </div>

              {/* 3. Hotspot Lighting */}
              <div className="absolute top-[22%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-20">
                <button
                  onClick={() => setActiveSlot("light")}
                  className={`group relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${activeSlot === "light"
                    ? "bg-gold text-charcoal border-white scale-110 shadow-[0_0_15px_rgba(212,175,55,1)]"
                    : "bg-black/70 text-gold border-gold/80 hover:scale-105"
                    }`}
                >
                  <span className="text-xs font-bold font-serif">3</span>
                  <span className="absolute left-10 whitespace-nowrap bg-charcoal/90 backdrop-blur-sm text-beige border border-gold/40 px-3 py-1 rounded-full text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                    💡 {selectedLight.name} ({formatPrice(selectedLight.price)})
                  </span>
                </button>
              </div>

              {/* Top Controls: Camera Angles & Reset */}
              <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => setCameraAngle("panorama")}
                  className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${cameraAngle === "panorama" ? "bg-gold text-charcoal font-bold" : "text-beige/70 hover:text-white"
                    }`}
                >
                  <Camera size={12} /> Panorama
                </button>
                <button
                  onClick={() => setCameraAngle("sofa_close")}
                  className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${cameraAngle === "sofa_close" ? "bg-gold text-charcoal font-bold" : "text-beige/70 hover:text-white"
                    }`}
                >
                  Góc Sofa
                </button>
                <button
                  onClick={() => setCameraAngle("window")}
                  className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${cameraAngle === "window" ? "bg-gold text-charcoal font-bold" : "text-beige/70 hover:text-white"
                    }`}
                >
                  Góc Cửa Sổ
                </button>
              </div>

              {/* Bottom Bar: Lighting Atmosphere Presets */}
              <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between gap-2 bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-gold/30">
                <div className="flex items-center space-x-2 text-[11px] font-serif text-champagne">
                  <Sparkles size={14} className="text-gold" />
                  <span className="hidden sm:inline">Khí quyển ánh sáng:</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setLighting("daylight")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${lighting === "daylight"
                      ? "bg-gold text-charcoal font-bold shadow-md"
                      : "text-beige/70 hover:bg-white/10"
                      }`}
                  >
                    <Sun size={14} /> <span>Ban Ngày</span>
                  </button>

                  <button
                    onClick={() => setLighting("sunset")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${lighting === "sunset"
                      ? "bg-amber-600 text-white font-bold shadow-md"
                      : "text-beige/70 hover:bg-white/10"
                      }`}
                  >
                    <Sunset size={14} /> <span>Hoàng Hôn</span>
                  </button>

                  <button
                    onClick={() => setLighting("midnight")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${lighting === "midnight"
                      ? "bg-indigo-900 text-gold font-bold shadow-md"
                      : "text-beige/70 hover:bg-white/10"
                      }`}
                  >
                    <Moon size={14} /> <span>Dạ Tiệc Đêm</span>
                  </button>

                  <button
                    onClick={() => setLighting("cinematic")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${lighting === "cinematic"
                      ? "bg-gradient-to-r from-gold to-gold-dark text-charcoal font-bold shadow-md"
                      : "text-beige/70 hover:bg-white/10"
                      }`}
                  >
                    <Sparkles size={14} /> <span>Cinematic</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-bar: Hotspot Category Selectors */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setActiveSlot("sofa")}
                className={`p-3 rounded-xl border text-left transition-all ${activeSlot === "sofa"
                  ? "bg-white/10 border-gold shadow-md"
                  : "bg-white/5 border-white/10 hover:border-gold/40"
                  }`}
              >
                <div className="text-[10px] text-gold uppercase font-bold">1. Sofa Chính</div>
                <div className="text-xs font-semibold truncate text-beige mt-0.5">{selectedSofa.name}</div>
              </button>

              <button
                onClick={() => setActiveSlot("table")}
                className={`p-3 rounded-xl border text-left transition-all ${activeSlot === "table"
                  ? "bg-white/10 border-gold shadow-md"
                  : "bg-white/5 border-white/10 hover:border-gold/40"
                  }`}
              >
                <div className="text-[10px] text-gold uppercase font-bold">2. Bàn Trà</div>
                <div className="text-xs font-semibold truncate text-beige mt-0.5">{selectedTable.name}</div>
              </button>

              <button
                onClick={() => setActiveSlot("light")}
                className={`p-3 rounded-xl border text-left transition-all ${activeSlot === "light"
                  ? "bg-white/10 border-gold shadow-md"
                  : "bg-white/5 border-white/10 hover:border-gold/40"
                  }`}
              >
                <div className="text-[10px] text-gold uppercase font-bold">3. Đèn Chiếu Sáng</div>
                <div className="text-xs font-semibold truncate text-beige mt-0.5">{selectedLight.name}</div>
              </button>

              <button
                onClick={() => setActiveSlot("carpet")}
                className={`p-3 rounded-xl border text-left transition-all ${activeSlot === "carpet"
                  ? "bg-white/10 border-gold shadow-md"
                  : "bg-white/5 border-white/10 hover:border-gold/40"
                  }`}
              >
                <div className="text-[10px] text-gold uppercase font-bold">4. Thảm Sàn</div>
                <div className="text-xs font-semibold truncate text-beige mt-0.5">{selectedCarpet.name}</div>
              </button>
            </div>
          </div>

          {/* Right: Customization Drawer & Budget Summary (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6 bg-white/5 border border-gold/30 p-6 rounded-2xl shadow-xl backdrop-blur-md">
            {/* Slot Customizer Options */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h3 className="font-serif text-lg font-bold text-champagne">
                  {activeSlot === "sofa" && "🛋️ Tùy Biến Sofa Phòng Khách"}
                  {activeSlot === "table" && "☕ Tùy Biến Bàn Trà Đi Kèm"}
                  {activeSlot === "light" && "💡 Tùy Biến Đèn Chùm Chiếu Sáng"}
                  {activeSlot === "carpet" && "🧶 Tùy Biến Thảm Sàn Thượng Hạng"}
                </h3>
                <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded-full font-mono">
                  Chọn mẫu
                </span>
              </div>

              {/* Options List */}
              <div className="space-y-3">
                {activeSlot === "sofa" &&
                  SOFA_OPTIONS.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedSofa(opt)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${selectedSofa.id === opt.id
                        ? "border-gold bg-gold/15 shadow-md"
                        : "border-white/10 hover:border-gold/50 bg-white/5"
                        }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white truncate">{opt.name}</span>
                          {opt.badge && (
                            <span className="bg-gold text-charcoal text-[9px] font-bold px-1.5 py-0.2 rounded">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-beige/60 line-clamp-1">{opt.material}</p>
                        <span className="text-xs font-serif font-semibold text-gold">
                          {formatPrice(opt.price)}
                        </span>
                      </div>
                      {selectedSofa.id === opt.id && (
                        <Check size={16} className="text-gold shrink-0 mt-1" />
                      )}
                    </div>
                  ))}

                {activeSlot === "table" &&
                  TABLE_OPTIONS.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedTable(opt)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${selectedTable.id === opt.id
                        ? "border-gold bg-gold/15 shadow-md"
                        : "border-white/10 hover:border-gold/50 bg-white/5"
                        }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white truncate">{opt.name}</span>
                          {opt.badge && (
                            <span className="bg-gold text-charcoal text-[9px] font-bold px-1.5 py-0.2 rounded">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-beige/60 line-clamp-1">{opt.material}</p>
                        <span className="text-xs font-serif font-semibold text-gold">
                          {formatPrice(opt.price)}
                        </span>
                      </div>
                      {selectedTable.id === opt.id && (
                        <Check size={16} className="text-gold shrink-0 mt-1" />
                      )}
                    </div>
                  ))}

                {activeSlot === "light" &&
                  LIGHT_OPTIONS.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedLight(opt)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${selectedLight.id === opt.id
                        ? "border-gold bg-gold/15 shadow-md"
                        : "border-white/10 hover:border-gold/50 bg-white/5"
                        }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white truncate">{opt.name}</span>
                          {opt.badge && (
                            <span className="bg-gold text-charcoal text-[9px] font-bold px-1.5 py-0.2 rounded">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-beige/60 line-clamp-1">{opt.material}</p>
                        <span className="text-xs font-serif font-semibold text-gold">
                          {formatPrice(opt.price)}
                        </span>
                      </div>
                      {selectedLight.id === opt.id && (
                        <Check size={16} className="text-gold shrink-0 mt-1" />
                      )}
                    </div>
                  ))}

                {activeSlot === "carpet" &&
                  CARPET_OPTIONS.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedCarpet(opt)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${selectedCarpet.id === opt.id
                        ? "border-gold bg-gold/15 shadow-md"
                        : "border-white/10 hover:border-gold/50 bg-white/5"
                        }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white truncate">{opt.name}</span>
                        </div>
                        <p className="text-[11px] text-beige/60 line-clamp-1">{opt.material}</p>
                        <span className="text-xs font-serif font-semibold text-gold">
                          {formatPrice(opt.price)}
                        </span>
                      </div>
                      {selectedCarpet.id === opt.id && (
                        <Check size={16} className="text-gold shrink-0 mt-1" />
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Room Budget Summary & 1-Click Buy */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-beige/60">
                  <span>Tổng giá bán lẻ 4 món:</span>
                  <span className="line-through">{formatPrice(totalRoomPrice)}</span>
                </div>
                <div className="flex justify-between text-green-400 font-medium">
                  <span>Ưu đãi trọn gói không gian (15%):</span>
                  <span>-{formatPrice(totalRoomPrice - discountedRoomPrice)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
                  <span className="font-serif text-sm text-champagne">Tổng Trọn Gói Combo:</span>
                  <span className="font-serif text-2xl font-bold text-gold">
                    {formatPrice(discountedRoomPrice)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleAddFullRoomToCart}
                  disabled={addedAll}
                  className="w-full py-4 bg-gradient-to-r from-gold to-gold-dark text-charcoal text-xs font-serif font-bold uppercase tracking-widest2 rounded-xl shadow-lg hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={16} />
                  <span>
                    {addedAll ? "✓ Đã Thêm 4 Món Vào Giỏ Hàng!" : "Mua Trọn Gói Phòng Khách Này"}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => alert("Đang xuất bản vẽ phối cảnh 3D độ phân giải 4K định dạng PDF...")}
                    className="py-2.5 px-3 bg-white/10 hover:bg-white/15 text-beige text-[11px] font-medium rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download size={13} /> Tải Bản Vẽ 3D
                  </button>

                  <Link
                    href="/booking"
                    className="py-2.5 px-3 bg-white/10 hover:bg-white/15 text-beige text-[11px] font-medium rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-1.5 text-center"
                  >
                    <Calendar size={13} /> Đặt May Đo VIP
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
