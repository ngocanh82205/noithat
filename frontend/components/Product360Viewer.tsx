"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { RotateCw, ZoomIn, Sparkles, Layers, ShieldCheck, Check } from "lucide-react";

type Product360Props = {
  productName: string;
  material: string;
  mainImage: string;
  variants?: any[];
};

export default function Product360Viewer({
  productName,
  material,
  mainImage,
}: Product360Props) {
  const [rotationDeg, setRotationDeg] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [activeMode, setActiveMode] = useState<"360" | "microscope">("360");
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startX;
    setRotationDeg((prev) => (prev + delta * 0.5) % 360);
    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - startX;
    setRotationDeg((prev) => (prev + delta * 0.5) % 360);
    setStartX(e.touches[0].clientX);
  };

  const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="bg-white/80 border border-gold/30 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-espresso/10">
        <div>
          <div className="flex items-center space-x-2 text-gold text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Trải Nghiệm Khảo Sát Đa Chiều</span>
          </div>
          <h3 className="font-serif text-xl font-bold text-espresso mt-0.5">
            Xoay 360° &amp; Soi Cận Cảnh Chất Liệu Thượng Hạng
          </h3>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-beige/60 p-1 rounded-xl border border-espresso/10 text-xs">
          <button
            onClick={() => setActiveMode("360")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeMode === "360"
                ? "bg-espresso text-beige shadow-sm"
                : "text-espresso/60 hover:text-espresso"
            }`}
          >
            <RotateCw size={13} /> <span>Xoay 360° 3D</span>
          </button>
          <button
            onClick={() => setActiveMode("microscope")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeMode === "microscope"
                ? "bg-gold text-charcoal font-bold shadow-sm"
                : "text-espresso/60 hover:text-espresso"
            }`}
          >
            <ZoomIn size={13} /> <span>Soi Vân Vật Liệu</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      {activeMode === "360" ? (
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className="relative aspect-video w-full bg-gradient-to-b from-sand/20 via-sand/5 to-transparent rounded-xl overflow-hidden border border-espresso/10 cursor-grab active:cursor-grabbing select-none flex items-center justify-center group"
        >
          {/* Simulated 3D Rotational Perspective Render */}
          <div
            className="relative w-4/5 h-4/5 transition-transform duration-75"
            style={{
              transform: `perspective(900px) rotateY(${rotationDeg}deg)`,
            }}
          >
            <Image
              src={mainImage}
              alt={productName}
              fill
              className="object-contain drop-shadow-2xl pointer-events-none"
            />
          </div>

          {/* Floor Shadow Reflection */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/20 blur-xl rounded-full pointer-events-none" />

          {/* Interactive 3D Orbit Guide */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-charcoal/80 backdrop-blur-sm text-champagne px-4 py-1.5 rounded-full text-xs font-serif tracking-wider shadow-lg flex items-center gap-2 pointer-events-none">
            <RotateCw size={14} className="animate-spin text-gold" />
            <span>Vuốt ngang để xoay 360° ({Math.round(rotationDeg)}°)</span>
          </div>

          {/* Floating Craftsmanship Hotspot Badges */}
          <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm p-2.5 rounded-xl border border-gold/40 shadow-md text-[11px] space-y-1">
            <div className="flex items-center space-x-1 text-gold font-bold">
              <Check size={13} /> <span>Da Bò Thuộc Thảo Mộc</span>
            </div>
            <p className="text-espresso/60 text-[10px]">Độ dày 1.6mm chống trầy xước</p>
          </div>

          <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm p-2.5 rounded-xl border border-gold/40 shadow-md text-[11px] space-y-1 text-right">
            <div className="flex items-center justify-end space-x-1 text-gold font-bold">
              <ShieldCheck size={13} /> <span>Khung Gỗ Sồi Sấy Nhiệt</span>
            </div>
            <p className="text-espresso/60 text-[10px]">Chống cong vênh, bảo hành 10 năm</p>
          </div>
        </div>
      ) : (
        /* Microscope Texture Zoom Lens Mode */
        <div
          onMouseMove={handleZoomMove}
          className="relative aspect-video w-full bg-sand/30 rounded-xl overflow-hidden border border-gold/40 cursor-crosshair group shadow-inner"
        >
          {/* Base Image */}
          <Image
            src={mainImage}
            alt={productName}
            fill
            className="object-cover brightness-90"
          />

          {/* Magnifier Lens Follows Cursor */}
          <div
            className="absolute w-44 h-44 rounded-full border-2 border-gold shadow-[0_0_25px_rgba(212,175,55,0.7)] overflow-hidden pointer-events-none -translate-x-1/2 -translate-y-1/2 bg-white"
            style={{
              left: `${zoomPos.x}%`,
              top: `${zoomPos.y}%`,
            }}
          >
            <div
              className="absolute w-[400%] h-[400%]"
              style={{
                left: `-${zoomPos.x * 4 - 88}px`,
                top: `-${zoomPos.y * 4 - 88}px`,
              }}
            >
              <Image
                src={mainImage}
                alt="Microscope Zoom"
                fill
                className="object-cover scale-150"
              />
            </div>
          </div>

          {/* Microscope HUD Overlay */}
          <div className="absolute top-4 left-4 bg-charcoal/85 backdrop-blur-md text-beige p-3 rounded-xl border border-gold/30 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-gold font-bold font-serif">
              <ZoomIn size={14} /> <span>Kính Hiển Vi Cận Cảnh (Zoom 4X)</span>
            </div>
            <p className="text-[11px] text-beige/70">
              Chiêm ngưỡng đường chỉ may thủ công chuẩn Hermès &amp; thớ vân tự nhiên không tì vết.
            </p>
          </div>
        </div>
      )}

      {/* Craftsmanship Guarantee Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs text-espresso/70">
        <div className="flex items-center space-x-2.5 p-3 bg-beige/40 rounded-xl border border-espresso/10">
          <span className="text-lg">🧵</span>
          <div>
            <strong className="text-espresso block font-serif">Chỉ Sáp Khâu Tay</strong>
            <span className="text-[10px] text-espresso/60">Gia công thủ công từng mũi kim</span>
          </div>
        </div>
        <div className="flex items-center space-x-2.5 p-3 bg-beige/40 rounded-xl border border-espresso/10">
          <span className="text-lg">🌲</span>
          <div>
            <strong className="text-espresso block font-serif">Gỗ Óc Chó FAS</strong>
            <span className="text-[10px] text-espresso/60">Tuyển chọn giác gỗ vân chun quý</span>
          </div>
        </div>
        <div className="flex items-center space-x-2.5 p-3 bg-beige/40 rounded-xl border border-espresso/10">
          <span className="text-lg">👑</span>
          <div>
            <strong className="text-espresso block font-serif">Mạ Vàng Titan PVD</strong>
            <span className="text-[10px] text-espresso/60">Bền màu vĩnh cửu theo thời gian</span>
          </div>
        </div>
      </div>
    </div>
  );
}
