"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import InRoom3DStagedFurniture from "./InRoom3DStagedFurniture";

type StagedProductProps = {
  product: {
    id: number;
    name: string;
    image: string;
    category_name: string;
    price: number;
    material: string;
  };
  scale: number;
  isFlipped: boolean;
  viewMode: "photo_cutout" | "three_d";
  selectedColorHex: string;
  selectedMaterial: "leather" | "velvet" | "wood" | "marble";
};

export default function StagedProjectProduct({
  product,
  scale,
  isFlipped,
  viewMode,
  selectedColorHex,
  selectedMaterial,
}: StagedProductProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  // Process image with canvas to create an isolated cutout with feathered edges
  useEffect(() => {
    if (viewMode !== "photo_cutout") return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = product.image;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Apply subtle radial feathered vignette mask to soften outer rectangular background
      ctx.globalCompositeOperation = "destination-in";
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height * 0.55,
        canvas.width * 0.22,
        canvas.width / 2,
        canvas.height * 0.55,
        canvas.width * 0.48
      );
      gradient.addColorStop(0, "rgba(0,0,0,1)");
      gradient.addColorStop(0.7, "rgba(0,0,0,0.95)");
      gradient.addColorStop(0.9, "rgba(0,0,0,0.5)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = "source-over";
      setProcessedImageUrl(canvas.toDataURL("image/png"));
    };
  }, [product.image, viewMode]);

  return (
    <div
      className="relative select-none pointer-events-auto"
      style={{
        transform: `scale(${scale}) ${isFlipped ? "scaleX(-1)" : ""}`,
        transformOrigin: "center center",
      }}
    >
      {viewMode === "three_d" ? (
        // 3D WebGL Isolated Mode
        <InRoom3DStagedFurniture
          category={product.category_name || product.name}
          colorHex={selectedColorHex}
          materialType={selectedMaterial}
          scale={1}
          isFlipped={false}
        />
      ) : (
        // Genuine Project Product Cutout Mode
        <div className="relative group">
          {/* Hidden Canvas for Processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Soft Realistic Contact Shadow on Floor */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[85%] h-8 bg-black/75 rounded-full blur-md" />

          {/* Rendered Isolated Product from Project Catalog */}
          <div className="relative w-64 sm:w-80 md:w-96 aspect-[4/3] drop-shadow-[0_18px_32px_rgba(0,0,0,0.65)] overflow-hidden rounded-2xl">
            <div className="relative w-full h-full">
              <Image
                src={processedImageUrl || product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
