"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  UploadCloud,
  CheckCircle2,
  Layers,
  ShoppingBag,
  ArrowRight,
  Eye,
  Camera,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Info,
  Maximize2,
  Compass,
  Palette,
  SunMedium,
  CheckCheck,
} from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import { useStore } from "@/components/StoreContext";
import { useToast } from "@/components/ToastProvider";
import { formatPrice } from "@/lib/products";
import { aiRoomStylistService, AiRoomAnalysisResult } from "@/services/api";

const PRESET_ROOMS = [
  {
    id: "penthouse_living",
    title: "Phòng Khách Penthouse",
    style: "Modern Italian Luxury",
    image: "/images/hero-banner.webp",
    description: "Đại sảnh thông tầng, cửa kính panorama đón nắng và sàn đá tự nhiên.",
  },
  {
    id: "scandi_apartment",
    title: "Căn Hộ Chung Cư",
    style: "Warm Scandinavian & Japandi",
    image: "/images/sofa-2.webp",
    description: "Không gian mở ấm cúng, tối ưu diện tích và ánh sáng ban công.",
  },
  {
    id: "master_bedroom",
    title: "Phòng Ngủ Master",
    style: "Contemporary Serene",
    image: "/images/bed-1.webp",
    description: "Phòng ngủ lớn tiện nghi cao cấp, tông màu tĩnh tại thư giãn.",
  },
  {
    id: "dining_lounge",
    title: "Phòng Ăn & Bếp Mở",
    style: "Neoclassic Dining",
    image: "/images/dining-table-1.jpg",
    description: "Không gian tiệc gia đình sang trọng với bàn ăn lớn và tủ rượu.",
  },
];

export default function AiRoomStylistPage() {
  const { addToCart, openCart } = useStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"preset" | "upload">("preset");
  const [selectedPreset, setSelectedPreset] = useState("penthouse_living");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState("");

  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<AiRoomAnalysisResult | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [addedCombo, setAddedCombo] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        showToast({
          type: "error",
          title: "Ảnh quá lớn",
          message: "Vui lòng chọn ảnh dung lượng dưới 8MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImage(reader.result as string);
        setActiveTab("upload");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartAnalysis = async () => {
    setIsScanning(true);
    setScanStep(1);
    setResult(null);
    setAddedCombo(false);

    // Simulated scanning steps for smooth HUD effect
    const t1 = setTimeout(() => setScanStep(2), 600);
    const t2 = setTimeout(() => setScanStep(3), 1200);
    const t3 = setTimeout(() => setScanStep(4), 1800);

    try {
      const payload: any = {
        preset_id: activeTab === "preset" ? selectedPreset : "penthouse_living",
        prompt: userPrompt,
      };

      if (activeTab === "upload" && customImage) {
        payload.image_base64 = customImage;
      }

      const res = await aiRoomStylistService.analyze(payload);

      // Ensure minimum 2s scanning animation for WOW factor
      setTimeout(() => {
        if (res.success && res.data) {
          setResult(res.data);
          showToast({
            type: "success",
            title: "Phân tích AI hoàn tất",
            message: `Nhận diện thành công phong cách: ${res.data.detected_style}`,
          });
        } else {
          showToast({
            type: "error",
            title: "Lỗi phân tích",
            message: res.message || "Không thể phân tích ảnh, vui lòng thử lại.",
          });
        }
        setIsScanning(false);
      }, 2200);
    } catch (err) {
      setTimeout(() => {
        setIsScanning(false);
        showToast({
          type: "error",
          title: "Lỗi kết nối",
          message: "Không thể kết nối đến máy chủ AI Visual Search.",
        });
      }, 2200);
    }
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    showToast({
      type: "info",
      title: "Đã sao chép mã màu",
      message: `Đã lưu mã màu ${hex} vào bộ nhớ tạm.`,
    });
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleAddAllToCart = () => {
    if (!result?.combo_package?.items) return;

    result.combo_package.items.forEach((item) => {
      addToCart(
        {
          id: item.id,
          name: item.name,
          slug: item.slug,
          price: Math.round(item.price * 0.9), // Apply 10% combo discount
          original_price: item.price,
          category: { id: 1, name: item.category, slug: "luxury" },
          dimensions: item.dimensions,
          material: item.material,
          images: [{ id: 1, product_id: item.id, image_url: item.image, is_primary: true, sort_order: 1 }],
          sku: `GSL-AI-${item.id}`,
          stock_quantity: 10,
          sold_count: 5,
          rating_avg: 5,
          rating_count: 12,
          is_featured: true,
          is_bestseller: true,
          is_new: true,
          is_active: true,
        },
        1
      );
    });

    setAddedCombo(true);
    showToast({
      type: "success",
      title: "Đã thêm trọn bộ combo!",
      message: `Đã áp dụng ưu đãi giảm 10%, tiết kiệm ${formatPrice(result.combo_package.savings)}.`,
    });

    setTimeout(() => {
      openCart();
    }, 400);
  };

  return (
    <SiteChrome>
      <main className="min-h-screen bg-[#0E0E0E] text-beige py-8 md:py-10 px-4 sm:px-6 lg:px-8 selection:bg-gold selection:text-charcoal relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          {/* Header Banner */}
          <header className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-gold/20 via-amber-500/10 to-gold/20 border border-gold/40 text-gold text-xs font-mono uppercase tracking-widest2">
              <Sparkles size={14} className="text-gold animate-spin" />
              <span>AI Spatial Room Stylist 2.0 • Multimodal Vision</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-champagne tracking-tight leading-tight">
              Trợ Lý Thiết Kế Không Gian Sống Bằng AI
            </h1>

            <p className="text-xs sm:text-sm text-beige/70 leading-relaxed font-light">
              Tải lên ảnh căn phòng của bạn hoặc chọn các không gian mẫu bên dưới. Trí tuệ nhân tạo sẽ phân tích phong cách, ánh sáng, hòa sắc và phối sẵn bộ Combo nội thất chuẩn đo may GS LUXURY vừa vặn từng centimet.
            </p>
          </header>

          {/* Interactive Room Selection & Upload Panel */}
          <div className="bg-charcoal/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-8">
            {/* Tabs Switcher */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex bg-black/40 border border-white/10 rounded-2xl p-1 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab("preset")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-all ${
                    activeTab === "preset"
                      ? "bg-gold text-charcoal font-semibold shadow-md"
                      : "text-beige/60 hover:text-beige"
                  }`}
                >
                  <Compass size={15} />
                  <span>Chọn Không Gian Mẫu (Demo Nhanh)</span>
                </button>

                <button
                  onClick={() => setActiveTab("upload")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-all ${
                    activeTab === "upload"
                      ? "bg-gold text-charcoal font-semibold shadow-md"
                      : "text-beige/60 hover:text-beige"
                  }`}
                >
                  <UploadCloud size={15} />
                  <span>Tải Ảnh Phòng Của Bạn</span>
                </button>
              </div>

              <div className="text-[11px] text-gold/80 font-mono flex items-center gap-1.5">
                <Zap size={14} className="text-gold" />
                <span>Mô hình: Gemini 1.5 Flash Vision Engine</span>
              </div>
            </div>

            {/* TAB 1: PRESET ROOMS */}
            {activeTab === "preset" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {PRESET_ROOMS.map((room) => {
                    const isSelected = selectedPreset === room.id;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedPreset(room.id)}
                        className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? "border-gold shadow-lg shadow-gold/20 scale-[1.02]"
                            : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/30"
                        }`}
                      >
                        <div className="relative h-44 w-full">
                          <Image src={room.image} alt={room.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                          {isSelected && (
                            <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gold text-charcoal flex items-center justify-center shadow">
                              <Check size={14} strokeWidth={2.5} />
                            </span>
                          )}
                        </div>

                        <div className="p-3.5 bg-black/60 backdrop-blur-sm">
                          <h4 className={`text-xs font-serif font-bold truncate ${isSelected ? "text-gold" : "text-beige"}`}>
                            {room.title}
                          </h4>
                          <p className="text-[10px] text-gold/70 font-mono mt-0.5">{room.style}</p>
                          <p className="text-[10px] text-beige/50 line-clamp-2 mt-1">{room.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* TAB 2: UPLOAD CUSTOM IMAGE */
              <div className="space-y-4">
                {customImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gold/50 max-h-80 w-full flex items-center justify-center bg-black/60 group">
                    <img src={customImage} alt="Uploaded room" className="max-h-80 w-auto object-contain" />
                    <button
                      onClick={() => setCustomImage(null)}
                      className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/80 border border-white/20 text-xs text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw size={13} />
                      <span>Chọn ảnh khác</span>
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-white/15 hover:border-gold/50 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:bg-white/[0.02] text-center group">
                    <div className="w-16 h-16 rounded-2xl bg-gold/10 text-gold flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Camera size={30} strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium text-beige mb-1">
                      Kéo thả bức ảnh phòng khách / phòng ngủ của bạn vào đây
                    </span>
                    <span className="text-xs text-beige/50 mb-4">
                      Hỗ trợ định dạng JPG, PNG, WEBP lên đến 8MB
                    </span>
                    <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gold font-medium group-hover:bg-gold group-hover:text-charcoal transition-colors">
                      Chọn tệp từ thiết bị
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            )}

            {/* Optional Architect Note Input */}
            <div className="pt-2">
              <label className="block text-[11px] uppercase tracking-widest2 text-beige/60 mb-2">
                Yêu cầu kiến trúc bổ sung (Tùy chọn)
              </label>
              <input
                type="text"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Ví dụ: Cần sofa da màu nâu cognac, phong cách Wabi-Sabi, nhà có nuôi mèo..."
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-xs text-beige placeholder:text-beige/30 focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            {/* Trigger Button */}
            <div className="text-center pt-2">
              <button
                onClick={handleStartAnalysis}
                disabled={isScanning}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-gold via-[#F0D8A8] to-gold text-charcoal font-semibold text-xs uppercase tracking-widest2 shadow-xl shadow-gold/25 hover:brightness-110 active:scale-95 transition-all duration-200 disabled:opacity-50 inline-flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Sparkles size={16} className={isScanning ? "animate-spin" : ""} />
                <span>{isScanning ? "AI Đang Quét & Phân Tích Không Gian..." : "Kích Hoạt Phân Tích Bằng AI"}</span>
              </button>
            </div>
          </div>

          {/* SCANNING SIMULATION HUD */}
          {isScanning && (
            <div className="bg-charcoal/90 border border-gold/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden animate-fade-in">
              {/* Laser scanning beam line animation */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />

              <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center mx-auto animate-bounce">
                <Sparkles size={28} className="text-gold" />
              </div>

              <div>
                <h3 className="font-serif text-xl text-champagne">
                  Hệ Thống Đang Xử Lý Không Gian Thực Tế
                </h3>
                <p className="text-xs text-beige/60 mt-1 font-mono">
                  Mô hình Vision AI đang bóc tách từng lớp điểm ảnh...
                </p>
              </div>

              {/* Progress checklist steps */}
              <div className="max-w-md mx-auto space-y-2.5 text-left text-xs font-mono">
                <div className={`flex items-center gap-2.5 transition-colors ${scanStep >= 1 ? "text-emerald-400" : "text-beige/30"}`}>
                  <CheckCircle2 size={15} />
                  <span>[01/04] Nhận diện trần nhà, tường &amp; hướng cửa sổ tự nhiên</span>
                </div>
                <div className={`flex items-center gap-2.5 transition-colors ${scanStep >= 2 ? "text-emerald-400" : "text-beige/30"}`}>
                  <CheckCircle2 size={15} />
                  <span>[02/04] Đo đạc diện tích &amp; xác định tỷ lệ kiến trúc tương thích</span>
                </div>
                <div className={`flex items-center gap-2.5 transition-colors ${scanStep >= 3 ? "text-emerald-400" : "text-beige/30"}`}>
                  <CheckCircle2 size={15} />
                  <span>[03/04] Trích xuất bảng mã hòa sắc HEX &amp; độ tương phản vật liệu</span>
                </div>
                <div className={`flex items-center gap-2.5 transition-colors ${scanStep >= 4 ? "text-emerald-400" : "text-beige/30"}`}>
                  <CheckCircle2 size={15} />
                  <span>[04/04] Phối trọn bộ combo nội thất GS Luxury và áp mã ưu đãi 10%</span>
                </div>
              </div>
            </div>
          )}

          {/* AI ANALYSIS RESULTS & RECOMMENDED COMBO */}
          {result && !isScanning && (
            <div className="space-y-10 animate-fade-in">
              {/* Architecture & Color Report Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Spatial Identification */}
                <div className="bg-charcoal/80 border border-white/10 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono tracking-widest2 text-gold">
                      Nhận Diện Không Gian
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                      Khớp {result.confidence_score}%
                    </span>
                  </div>
                  <h3 className="font-serif text-lg text-champagne">{result.detected_room_type}</h3>
                  <div className="space-y-1 text-xs text-beige/70">
                    <p><strong className="text-beige">Phong cách:</strong> {result.detected_style}</p>
                    <p><strong className="text-beige">Diện tích ước tính:</strong> {result.estimated_area}</p>
                  </div>
                </div>

                {/* 2. Lighting & Architecture Advice */}
                <div className="bg-charcoal/80 border border-white/10 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest2 text-gold">
                    <SunMedium size={14} />
                    <span>Ánh Sáng &amp; Kiến Trúc</span>
                  </div>
                  <p className="text-xs text-beige/80 leading-relaxed italic">
                    &ldquo;{result.lighting_analysis}&rdquo;
                  </p>
                  <p className="text-[11px] text-beige/60 leading-relaxed">
                    {result.architect_advice}
                  </p>
                </div>

                {/* 3. Color Palette */}
                <div className="bg-charcoal/80 border border-white/10 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest2 text-gold">
                    <Palette size={14} />
                    <span>Bảng Mã Màu Hòa Sắc Đề Xuất</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {result.color_palette.map((c) => (
                      <div
                        key={c.hex}
                        onClick={() => handleCopyColor(c.hex)}
                        className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5 hover:border-gold/40 cursor-pointer transition-all group"
                        title="Bấm để sao chép mã màu"
                      >
                        <span className="w-5 h-5 rounded-lg border border-white/20 shrink-0" style={{ backgroundColor: c.hex }} />
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-beige truncate group-hover:text-gold">{c.name}</p>
                          <p className="text-[10px] text-beige/40 font-mono flex items-center gap-1">
                            <span>{c.hex}</span>
                            {copiedHex === c.hex ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RECOMMENDED COMBO PACKAGE */}
              <div className="bg-gradient-to-b from-charcoal via-charcoal/95 to-black border border-gold/40 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-6 py-2 bg-gradient-to-l from-gold to-amber-500 text-charcoal font-bold text-xs uppercase tracking-widest2 rounded-bl-2xl shadow">
                  Combo Đề Xuất Giảm 10%
                </div>

                {/* Package Header */}
                <div className="space-y-2">
                  <p className="text-gold text-xs font-mono uppercase tracking-widest2">Gợi ý từ GS Luxury Senior Stylist</p>
                  <h2 className="font-serif text-2xl sm:text-3xl text-champagne">
                    {result.combo_package.name}
                  </h2>
                  <p className="text-xs text-beige/60">
                    Bộ 3 món nội thất tâm điểm được AI tuyển chọn chính xác theo màu sắc và tỷ lệ phòng của bạn.
                  </p>
                </div>

                {/* 3 Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {result.combo_package.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-gold/50 transition-all duration-300 group"
                    >
                      <div className="space-y-3">
                        <div className="relative h-48 w-full rounded-xl overflow-hidden bg-black/60">
                          <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/80 border border-gold/40 text-gold text-[10px] font-mono">
                            Món 0{index + 1}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-gold font-mono uppercase tracking-wider block">{item.role}</span>
                          <h4 className="font-serif text-sm font-bold text-champagne mt-0.5 truncate">{item.name}</h4>
                          <p className="text-[11px] text-beige/50 line-clamp-1 mt-0.5">{item.material}</p>
                          <p className="text-[10px] text-beige/40 font-mono mt-0.5">{item.dimensions}</p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-beige/70 leading-relaxed italic">
                          &ldquo;{item.reason}&rdquo;
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-3">
                        <div>
                          <span className="text-[10px] text-beige/40 block">Giá gốc niêm yết:</span>
                          <span className="font-serif text-sm text-beige font-semibold line-through decoration-gold/60">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-400 block font-mono">Giá theo Combo:</span>
                          <span className="font-serif text-sm text-gold font-bold">
                            {formatPrice(Math.round(item.price * 0.9))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total & Checkout Action Bar */}
                <div className="bg-black/60 border border-gold/30 rounded-2xl p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-center lg:text-left">
                    <p className="text-xs text-beige/60">Tổng giá trị trọn bộ 3 sản phẩm:</p>
                    <div className="flex flex-wrap items-baseline gap-3 justify-center lg:justify-start">
                      <span className="text-base text-beige/50 line-through">
                        {formatPrice(result.combo_package.original_total)}
                      </span>
                      <span className="font-serif text-2xl sm:text-3xl text-gold font-bold">
                        {formatPrice(result.combo_package.combo_price)}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold font-mono border border-emerald-500/40">
                        Tiết kiệm {formatPrice(result.combo_package.savings)} (-10%)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <button
                      onClick={handleAddAllToCart}
                      className={`flex-1 lg:flex-none px-8 py-4 rounded-xl text-xs uppercase tracking-widest2 font-semibold transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl ${
                        addedCombo
                          ? "bg-emerald-500 text-charcoal shadow-emerald-500/25"
                          : "bg-gradient-to-r from-gold via-[#F0D8A8] to-gold text-charcoal shadow-gold/30 hover:brightness-110 active:scale-95"
                      }`}
                    >
                      {addedCombo ? (
                        <>
                          <CheckCheck size={18} />
                          <span>Đã Thêm Trọn Bộ Vào Giỏ Hàng!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={18} />
                          <span>Thêm Cả Bộ Combo Vào Giỏ Hàng</span>
                        </>
                      )}
                    </button>

                    <Link
                      href="/checkout"
                      className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 hover:border-gold/50 text-beige hover:text-gold text-xs uppercase tracking-wider font-semibold transition-all inline-flex items-center gap-1.5"
                    >
                      <span>Vào Thanh Toán</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </SiteChrome>
  );
}
