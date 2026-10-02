"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  X,
  UploadCloud,
  Crosshair,
  Sliders,
  CheckCircle2,
  ShoppingCart,
  Maximize2,
  RefreshCw,
  Eye,
  Download,
  Lightbulb,
  Compass,
  Layers,
  Palette,
  Camera,
  Box,
} from "lucide-react";
import { useStore } from "./StoreContext";
import { useToast } from "./ToastProvider";
import {
  spatialRoomService,
  SpatialStagingResult,
  VisualSearchProductMatch,
} from "@/services/api";
import StagedProjectProduct from "./StagedProjectProduct";

// Thu nhỏ ảnh (tối đa 1024px, JPEG) trước khi gửi cho AI: nhanh hơn, tốn ít hạn mức hơn,
// và bỏ metadata (vị trí GPS...) của ảnh chụp từ điện thoại.
async function toAnalysisImage(src: string, maxSize = 1024): Promise<string | null> {
  try {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.src = src;
    await img.decode();
    const ratio = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  }
}

const MAX_UPLOAD_MB = 15;

// Curated sample rooms
const SAMPLE_ROOMS = [
  {
    id: "penthouse_living",
    title: "Phòng Khách Penthouse",
    image: "/images/hero-banner.jpg",
    defaultPin: { x: 50, y: 65 },
    defaultIntent: "Muốn đặt bộ sofa góc da bò Ý Velvet Aurora vào giữa phòng khách",
  },
  {
    id: "luxury_dining",
    title: "Góc Bếp & Phòng Ăn",
    image: "/images/dining-table-2.webp",
    defaultPin: { x: 50, y: 60 },
    defaultIntent: "Cần tìm bàn ăn Sovereign 8 ghế mạ vàng cho không gian phòng ăn",
  },
  {
    id: "warm_living",
    title: "Phòng Khách Ấm Cúng",
    image: "/images/sofa-2.jpg",
    defaultPin: { x: 45, y: 70 },
    defaultIntent: "Tìm sofa modular Riviera hoặc bàn trà marble Aria",
  },
];

// Quick intent chips mapped to actual project catalog
const QUICK_INTENTS = [
  { label: "🛋️ Sofa Velvet Aurora (GSL-001)", prompt: "Sofa Velvet Aurora da bò Ý cao cấp" },
  { label: "🛋️ Sofa Modular Riviera (GSL-002)", prompt: "Sofa Modular Riviera nỉ Bouclé Bỉ dáng cong" },
  { label: "🪑 Ghế Lounge Ombré (GSL-001)", prompt: "Ghế Lounge Ombré bọc nhung dệt Ý chân đồng thau" },
  { label: "☕ Bàn Trà Marble Aria", prompt: "Bàn trà Marble Aria mặt đá cẩm thạch Calacatta Ý" },
  { label: "🍽️ Bàn Ăn Sovereign", prompt: "Bàn ăn Sovereign dát vàng 8 ghế" },
  { label: "🛏️ Giường Canopy Elysée", prompt: "Giường Canopy Elysée gỗ sồi vải lanh Bỉ" },
];

const COLOR_SWATCHES = [
  { name: "Da Bò Ý Tuscan Cognac", colorHex: "#964B00", material: "leather" as const },
  { name: "Nỉ Nhung Bỉ Charcoal", colorHex: "#222222", material: "velvet" as const },
  { name: "Da Nappa Kem Ivory", colorHex: "#F2ECE1", material: "leather" as const },
  { name: "Nhung Emerald Hoàng Gia", colorHex: "#1B4332", material: "velvet" as const },
];

export default function VisualSearchModal() {
  const { isVisualSearchOpen, closeVisualSearch, addToCart } = useStore();
  const { showToast } = useToast();

  // State
  const [currentRoomImage, setCurrentRoomImage] = useState<string>(SAMPLE_ROOMS[0].image);
  const [pinPosition, setPinPosition] = useState<{ x: number; y: number }>(SAMPLE_ROOMS[0].defaultPin);
  const [userIntent, setUserIntent] = useState<string>(SAMPLE_ROOMS[0].defaultIntent);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [stagingData, setStagingData] = useState<SpatialStagingResult | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<VisualSearchProductMatch | null>(null);

  // Staged Item Controls (Scale, Position, Flip, Swatch Color, View Mode)
  const [itemScale, setItemScale] = useState<number>(1);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"photo_cutout" | "three_d">("photo_cutout");
  const [selectedColorHex, setSelectedColorHex] = useState<string>("#964B00");
  const [selectedMaterial, setSelectedMaterial] = useState<"leather" | "velvet" | "wood" | "marble">("leather");
  const [isAddedSuccess, setIsAddedSuccess] = useState<boolean>(false);
  // Ảnh phòng đã thu nhỏ để gửi cho AI (ảnh mẫu hoặc ảnh khách tải lên)
  const [roomImageData, setRoomImageData] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageCanvasRef = useRef<HTMLDivElement>(null);

  // Trigger initial scan when opening
  useEffect(() => {
    if (isVisualSearchOpen && !stagingData) {
      analyzeRoom(SAMPLE_ROOMS[0].image, SAMPLE_ROOMS[0].defaultIntent);
    }
  }, [isVisualSearchOpen]);

  if (!isVisualSearchOpen) return null;

  // Handle click on canvas to place target pin
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageCanvasRef.current) return;
    const rect = stageCanvasRef.current.getBoundingClientRect();
    const x = Math.max(12, Math.min(88, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(20, Math.min(80, ((e.clientY - rect.top) / rect.height) * 100));
    setPinPosition({ x, y });
  };

  // Perform AI Spatial Search
  const handlePerformSpatialMatch = async (intentQuery?: string, imageData?: string | null) => {
    const query = intentQuery || userIntent;
    const image = imageData === undefined ? roomImageData : imageData;
    setIsScanning(true);
    setIsAddedSuccess(false);

    try {
      const res = await spatialRoomService.search({
        prompt: query,
        room_type: "luxury_spatial",
        image_base64: image || undefined,
      });

      if (res.success && res.data) {
        setStagingData(res.data);
        if (res.data.products.length > 0) {
          setSelectedProduct(res.data.products[0]);
          setItemScale(res.data.products[0].default_scale || 1);
        }
        // AI tìm được khoảng trống trong ảnh -> đặt ghim vào đó (khách vẫn bấm để đổi được)
        if (res.data.placement) {
          setPinPosition({ x: res.data.placement.x, y: res.data.placement.y });
        }
      } else {
        showToast({ type: "error", title: "Chưa tìm được gợi ý", message: res.message || "Vui lòng thử lại sau." });
      }
    } catch (err) {
      console.error("Spatial match error:", err);
    } finally {
      setTimeout(() => {
        setIsScanning(false);
      }, 900);
    }
  };

  // Handle Upload User Room Photo
  // Chuẩn bị ảnh (thu nhỏ) rồi gửi cho AI phân tích cùng câu mô tả
  const analyzeRoom = async (imageSrc: string, intent: string) => {
    setIsScanning(true);
    const data = await toAnalysisImage(imageSrc);
    setRoomImageData(data);
    await handlePerformSpatialMatch(intent, data);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng một ảnh
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      showToast({ type: "warning", title: "Định dạng chưa hỗ trợ", message: "Vui lòng chọn ảnh JPG, PNG hoặc WEBP." });
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      showToast({ type: "warning", title: "Ảnh quá lớn", message: `Vui lòng chọn ảnh dưới ${MAX_UPLOAD_MB}MB.` });
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    setCurrentRoomImage(imageUrl);
    setPinPosition({ x: 50, y: 65 });
    analyzeRoom(imageUrl, userIntent);
  };

  // Handle Quick Add to Cart
  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addToCart({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      image: selectedProduct.image,
      quantity: 1,
      variant: selectedProduct.material,
    });
    setIsAddedSuccess(true);
    setTimeout(() => {
      setIsAddedSuccess(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-beige text-espresso w-full max-w-6xl max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gold/40 animate-scale-up">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-espresso/10 bg-gradient-to-r from-sand/30 via-beige to-gold/10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gold/20 text-gold flex items-center justify-center shadow-inner">
              <Sparkles size={20} className="text-gold animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-espresso flex items-center gap-2">
                <span>AI Phối Nội Thất Dự Án Vào Không Gian Thực Tế</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold text-charcoal font-mono uppercase font-bold tracking-wider">
                  GS Catalog 2026
                </span>
              </h2>
              <p className="text-xs text-espresso/60 hidden sm:block">
                AI phân tích ảnh phòng, gợi ý mẫu nội thất có thật trong catalog &amp; cho bạn ướm thử lên ảnh
              </p>
            </div>
          </div>

          <button
            onClick={closeVisualSearch}
            className="p-2 text-espresso/60 hover:text-espresso hover:bg-black/5 rounded-full transition-colors"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Control Bar: Upload & Room Templates */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/60 backdrop-blur-sm p-3.5 rounded-2xl border border-espresso/10">
            {/* Upload Button */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-espresso text-champagne hover:bg-gold hover:text-charcoal rounded-xl text-xs font-serif font-bold tracking-wider transition-all shadow-md"
              >
                <UploadCloud size={15} />
                <span>Tải Ảnh Phòng Của Bạn</span>
              </button>
              <span className="text-[11px] text-espresso/50 hidden md:inline">
                (JPG, PNG, WEBP — ảnh chỉ dùng để AI phân tích, không lưu lại)
              </span>
            </div>

            {/* Curated Sample Room Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-serif font-semibold text-espresso/70 whitespace-nowrap">
                Hoặc chọn phòng mẫu:
              </span>
              {SAMPLE_ROOMS.map((room) => (
                <button
                  key={room.id}
                  onClick={() => {
                    setCurrentRoomImage(room.image);
                    setPinPosition(room.defaultPin);
                    setUserIntent(room.defaultIntent);
                    analyzeRoom(room.image, room.defaultIntent);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                    currentRoomImage === room.image
                      ? "bg-gold/20 border-gold text-espresso font-semibold shadow-sm"
                      : "bg-white border-espresso/10 text-espresso/70 hover:border-gold/50"
                  }`}
                >
                  <span>{room.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Centerpiece: Interactive Spatial Staging Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Room Canvas (8 cols) */}
            <div className="lg:col-span-8 flex flex-col space-y-3">
              <div
                ref={stageCanvasRef}
                onClick={handleCanvasClick}
                className="relative aspect-[16/10] md:aspect-[16/9] w-full rounded-2xl overflow-hidden border-2 border-gold/40 shadow-2xl bg-black cursor-crosshair select-none group"
              >
                {/* 1. Base Room Background Photo */}
                <div className="relative w-full h-full">
                  <Image
                    src={currentRoomImage}
                    alt="Không gian phòng khách"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 75vw, 66vw"
                    className={`object-cover transition-all duration-500 ${
                      isScanning ? "brightness-75 contrast-125" : "brightness-95"
                    }`}
                    priority
                  />
                </div>

                {/* 2. Interactive Target Placement Pin */}
                <div
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300"
                  style={{ left: `${pinPosition.x}%`, top: `${pinPosition.y}%` }}
                >
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-12 h-12 rounded-full bg-gold/30 animate-ping" />
                    <div className="w-8 h-8 rounded-full bg-gold text-charcoal flex items-center justify-center font-bold shadow-xl border-2 border-white">
                      <Crosshair size={16} />
                    </div>
                  </div>
                  <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-charcoal/90 text-gold px-2.5 py-1 rounded-full text-[10px] font-mono whitespace-nowrap shadow-lg border border-gold/40">
                    {stagingData?.placement ? "Vị trí trống AI gợi ý" : "Vị trí đặt đồ"}
                  </div>
                </div>

                {/* 3. AI Scanning Beam Animation */}
                {isScanning && (
                  <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden flex flex-col justify-between">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_20px_#D4AF37] animate-pulse" />
                    <div className="absolute inset-0 bg-gold/10 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="bg-charcoal/90 border border-gold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-gold">
                        <RefreshCw size={20} className="animate-spin" />
                        <div className="text-left">
                          <div className="font-serif font-bold text-sm">AI Đang Phân Tích Ảnh Phòng...</div>
                          <div className="text-[11px] text-beige/70 font-mono">
                            Nhận diện không gian & chọn sản phẩm trong catalog GS Luxury
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Staged Furniture Layer (Uses Exact Project Product) */}
                {selectedProduct && !isScanning && (
                  <div
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
                    style={{
                      left: `${pinPosition.x}%`,
                      top: `${pinPosition.y}%`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StagedProjectProduct
                      product={selectedProduct}
                      scale={itemScale}
                      isFlipped={isFlipped}
                      viewMode={viewMode}
                      selectedColorHex={selectedColorHex}
                      selectedMaterial={selectedMaterial}
                    />
                  </div>
                )}

                {/* Canvas Bottom Tooltip */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-charcoal/85 backdrop-blur-md px-4 py-2 rounded-xl text-[11px] text-beige border border-gold/30 z-20">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={14} className="text-gold shrink-0" />
                    <span>
                      👉 <strong>Nhấp vào khoảng trống</strong> trên phòng để di chuyển vị trí đặt đồ
                    </span>
                  </div>
                  <div className="font-mono text-gold hidden sm:block">
                    Tọa độ: {Math.round(pinPosition.x)}%, {Math.round(pinPosition.y)}%
                  </div>
                </div>
              </div>

              {/* Controls: Mode Switcher, Scale Slider & Swatches */}
              {selectedProduct && (
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-espresso/10 text-xs shadow-sm">
                  {/* View Mode Switcher */}
                  <div className="flex items-center gap-1.5 bg-sand/30 p-1 rounded-xl border border-espresso/10">
                    <button
                      onClick={() => setViewMode("photo_cutout")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-serif font-bold text-[11px] transition-all ${
                        viewMode === "photo_cutout"
                          ? "bg-espresso text-champagne shadow-sm"
                          : "text-espresso/70 hover:text-espresso"
                      }`}
                    >
                      <Camera size={13} />
                      <span>Ảnh Thật Dự Án</span>
                    </button>
                    <button
                      onClick={() => setViewMode("three_d")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-serif font-bold text-[11px] transition-all ${
                        viewMode === "three_d"
                          ? "bg-espresso text-champagne shadow-sm"
                          : "text-espresso/70 hover:text-espresso"
                      }`}
                    >
                      <Box size={13} />
                      <span>Mô Hình 3D Xoay</span>
                    </button>
                  </div>

                  {/* Swatches (If 3D Mode) */}
                  {viewMode === "three_d" && (
                    <div className="flex items-center gap-2">
                      <Palette size={14} className="text-gold" />
                      <div className="flex items-center gap-1.5">
                        {COLOR_SWATCHES.map((swatch, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedColorHex(swatch.colorHex);
                              setSelectedMaterial(swatch.material);
                            }}
                            className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                              selectedColorHex === swatch.colorHex
                                ? "border-gold scale-110 shadow-md ring-2 ring-gold/40"
                                : "border-white shadow-sm"
                            }`}
                            style={{ backgroundColor: swatch.colorHex }}
                            title={swatch.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scale Slider */}
                  <div className="flex items-center gap-3 flex-1 max-w-xs">
                    <span className="text-[11px] text-espresso/60">Thu nhỏ</span>
                    <input
                      type="range"
                      min="0.6"
                      max="1.5"
                      step="0.05"
                      value={itemScale}
                      onChange={(e) => setItemScale(parseFloat(e.target.value))}
                      className="w-full accent-gold cursor-pointer"
                    />
                    <span className="text-[11px] text-espresso/60">Phóng to</span>
                  </div>

                  {/* Flip Button */}
                  <button
                    onClick={() => setIsFlipped((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-espresso/5 hover:bg-gold/20 border border-espresso/10 rounded-lg text-espresso font-medium transition-colors"
                  >
                    <RefreshCw size={13} />
                    <span>Lật ({isFlipped ? "Phải" : "Trái"})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right: User Intent Input & Selected Product Details (4 cols) */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              {/* 1. Natural Language Intent Input */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gold/30 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-sm text-espresso flex items-center gap-1.5">
                    <Compass size={16} className="text-gold" />
                    <span>Chọn Mẫu Nội Thất Trong Dự Án</span>
                  </h3>
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    value={userIntent}
                    onChange={(e) => setUserIntent(e.target.value)}
                    placeholder="Ví dụ: Cần 1 bộ sofa Velvet Aurora da bò Ý..."
                    className="w-full p-3 text-xs bg-sand/15 border border-espresso/15 rounded-xl focus:outline-none focus:border-gold text-espresso resize-none"
                  />
                </div>

                {/* Quick Intent Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_INTENTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setUserIntent(item.prompt);
                        handlePerformSpatialMatch(item.prompt);
                      }}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-sand/30 hover:bg-gold/20 border border-espresso/10 text-espresso transition-colors font-medium"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Action Trigger Button */}
                <button
                  onClick={() => handlePerformSpatialMatch()}
                  disabled={isScanning}
                  className="w-full py-3 bg-gradient-to-r from-espresso via-charcoal to-espresso hover:from-gold hover:via-gold-light hover:to-gold text-champagne hover:text-charcoal rounded-xl text-xs font-serif font-bold tracking-wider uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles size={15} />
                  <span>{isScanning ? "AI Đang Phân Tích..." : "AI Phân Tích Ảnh & Gợi Ý Sản Phẩm"}</span>
                </button>
              </div>

              {/* 2. AI Spatial Vision Report */}
              {stagingData && (
                <div className="bg-charcoal text-beige p-4 rounded-2xl border border-gold/40 shadow-md space-y-2.5 text-xs">
                  <div className="pb-2 border-b border-white/10 space-y-1.5">
                    <span className="text-gold font-serif font-bold">
                      {stagingData.image_analyzed ? "Phân Tích Ảnh Phòng:" : "Gợi Ý Theo Mô Tả:"}
                    </span>
                    {/* Ghi rõ nguồn của kết quả: AI nhìn ảnh thật hay chỉ gợi ý theo từ khoá */}
                    <p
                      className={`text-[10px] font-mono px-2 py-1 rounded ${
                        stagingData.engine === "gemini_vision"
                          ? "bg-green-500/15 text-green-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {stagingData.engine === "gemini_vision" ? "✓ " : "ⓘ "}
                      {stagingData.engine_label}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-beige/60">Loại phòng:</span>
                      <p className="font-semibold text-white">{stagingData.detected_room_type}</p>
                    </div>
                    <div>
                      <span className="text-beige/60">
                        {stagingData.image_analyzed ? "Diện tích (AI ước lượng):" : "Diện tích tham khảo:"}
                      </span>
                      <p className="font-semibold text-white">{stagingData.estimated_area}</p>
                    </div>
                    {stagingData.style && (
                      <div>
                        <span className="text-beige/60">Phong cách:</span>
                        <p className="font-semibold text-gold">{stagingData.style}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-beige/60">Nhóm sản phẩm gợi ý:</span>
                      <p className="font-semibold text-gold truncate">{stagingData.recommended_type}</p>
                    </div>
                  </div>

                  <div className="text-[11px] pt-1">
                    <span className="text-beige/60">Ánh sáng:</span>
                    <p className="text-beige/90 leading-snug">{stagingData.lighting_analysis}</p>
                  </div>

                  {stagingData.image_analyzed && (stagingData.palette?.length ?? 0) > 0 && (
                    <div className="text-[11px] pt-1">
                      <span className="text-beige/60">Màu chủ đạo trong ảnh:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {stagingData.palette!.map((c) => (
                          <span key={c.hex} className="flex items-center gap-1 text-[10px] text-beige/80">
                            <span className="w-3.5 h-3.5 rounded-full border border-white/30" style={{ backgroundColor: c.hex }} />
                            {c.name || c.hex}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {stagingData.placement?.description && (
                    <p className="text-[11px] text-beige/80">
                      <span className="text-beige/60">Vị trí trống: </span>
                      {stagingData.placement.description}
                    </p>
                  )}

                  {stagingData.summary && (
                    <p className="text-[11px] text-beige/90 leading-snug border-t border-white/10 pt-2">
                      {stagingData.summary}
                    </p>
                  )}
                </div>
              )}

              {/* 3. Selected Product Card & Direct Buy */}
              {selectedProduct && (
                <div className="bg-white p-4 rounded-2xl border border-gold/40 shadow-lg space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gold font-bold">Sản phẩm đang ướm thử</span>
                    <span className="text-espresso/50 font-mono text-[11px]">{selectedProduct.dimensions}</span>
                  </div>
                  {selectedProduct.match_reason && (
                    <p className="text-[11px] text-espresso/80 bg-sand/20 border border-espresso/10 rounded-lg px-2.5 py-2 leading-snug">
                      <strong>Vì sao gợi ý: </strong>
                      {selectedProduct.match_reason}
                    </p>
                  )}

                  <div className="space-y-1">
                    <h4 className="font-serif font-bold text-sm text-espresso leading-snug">
                      {selectedProduct.name}
                    </h4>
                    <p className="text-[11px] text-espresso/70 line-clamp-2">
                      {selectedProduct.material}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-2 pt-1 border-t border-espresso/10">
                    <span className="font-serif font-bold text-base text-gold">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                        selectedProduct.price
                      )}
                    </span>
                    {selectedProduct.original_price && (
                      <span className="text-xs text-espresso/40 line-through">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                          selectedProduct.original_price
                        )}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/products/${selectedProduct.id}`}
                      onClick={closeVisualSearch}
                      className="py-2.5 px-3 bg-sand/30 hover:bg-sand text-espresso rounded-xl text-[11px] font-serif font-bold text-center transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye size={13} />
                      <span>Xem Chi Tiết</span>
                    </Link>

                    <button
                      onClick={handleAddToCart}
                      className={`py-2.5 px-3 rounded-xl text-[11px] font-serif font-bold text-center transition-all flex items-center justify-center gap-1 shadow-md ${
                        isAddedSuccess
                          ? "bg-green-600 text-white"
                          : "bg-espresso text-champagne hover:bg-gold hover:text-charcoal"
                      }`}
                    >
                      {isAddedSuccess ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Đã Thêm!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={13} />
                          <span>Thêm Vào Giỏ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Shelf: All Actual Products in the Project Catalog */}
          {stagingData && stagingData.products.length > 1 && (
            <div className="space-y-3 pt-4 border-t border-espresso/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-gold" />
                  <h3 className="font-serif font-bold text-sm text-espresso">
                    Sản Phẩm Gợi Ý Cho Không Gian Này ({stagingData.products.length} Mẫu)
                  </h3>
                </div>
                <span className="text-xs text-espresso/60">
                  👉 Nhấp vào bất kỳ mẫu nào để đổi trực tiếp lên ảnh phòng
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {stagingData.products.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setSelectedProduct(prod);
                      setItemScale(prod.default_scale || 1);
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedProduct?.id === prod.id
                        ? "border-gold bg-gold/15 shadow-md scale-[1.02]"
                        : "border-espresso/10 hover:border-gold/50 bg-white"
                    }`}
                  >
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-sand/10 mb-2">
                      <Image
                        src={prod.image}
                        alt={prod.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        className="object-cover"
                      />
                    </div>
                    <h4 className="text-xs font-serif font-bold text-espresso truncate">
                      {prod.name}
                    </h4>
                    <p className="text-xs font-serif font-semibold text-gold mt-0.5">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                        prod.price
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
