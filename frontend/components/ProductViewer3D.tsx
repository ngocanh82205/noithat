"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Camera,
  Play,
  Pause,
  Sparkles,
  Smartphone,
  Check,
  Eye,
  Layers,
  X,
} from "lucide-react";
import { formatPrice } from "@/lib/products";

export type ColorVariant = {
  id: string;
  name: string;
  colorHex: string;
  material: "leather" | "velvet" | "wood" | "marble";
  priceDiff?: number;
  previewColor: string;
};

type ProductViewer3DProps = {
  productName: string;
  basePrice: number;
  category?: string;
  variants?: ColorVariant[];
  onVariantChange?: (variant: ColorVariant, newPrice: number) => void;
  className?: string;
};

const DEFAULT_VARIANTS: ColorVariant[] = [
  {
    id: "cognac",
    name: "Da Bò Ý Tuscan Cognac",
    colorHex: "#964B00",
    material: "leather",
    priceDiff: 0,
    previewColor: "#9A5020",
  },
  {
    id: "charcoal",
    name: "Nỉ Nhung Bỉ Charcoal Black",
    colorHex: "#222222",
    material: "velvet",
    priceDiff: -2500000,
    previewColor: "#222222",
  },
  {
    id: "nappa_cream",
    name: "Da Nappa Kem Bắc Âu (Ivory)",
    colorHex: "#F2ECE1",
    material: "leather",
    priceDiff: 3000000,
    previewColor: "#EADDC7",
  },
  {
    id: "emerald",
    name: "Nhung Xanh Ngọc Lục Bảo (Emerald)",
    colorHex: "#1B4332",
    material: "velvet",
    priceDiff: 1500000,
    previewColor: "#1B4332",
  },
];

export default function ProductViewer3D({
  productName,
  basePrice,
  category = "sofa",
  variants = DEFAULT_VARIANTS,
  onVariantChange,
  className = "",
}: ProductViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ColorVariant>(variants[0] || DEFAULT_VARIANTS[0]);
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeCameraAngle, setActiveCameraAngle] = useState<"hero" | "front" | "top">("hero");
  const [arOpen, setArOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // References for Three.js scene instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const mainMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Compute live current price
  const currentPrice = basePrice + (selectedVariant.priceDiff || 0);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 480;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(2.6, 1.8, 2.6);
    cameraRef.current = camera;

    // 3. Renderer with PBR settings
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. Studio Lighting System
    const hemiLight = new THREE.HemisphereLight(0xfff8e7, 0x333333, 0.9);
    scene.add(hemiLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainKeyLight.position.set(4, 6, 4);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    mainKeyLight.shadow.camera.near = 0.5;
    mainKeyLight.shadow.camera.far = 15;
    mainKeyLight.shadow.bias = -0.0005;
    scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight(0xd4af37, 0.6);
    fillLight.position.set(-4, 3, -2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffffff, 1.2, 10);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    // 5. Floor Reflection and Soft Ground Shadow
    const shadowPlaneGeo = new THREE.PlaneGeometry(8, 8);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.18 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.55;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 6. Build High-Fidelity 3D Furniture Mesh (Luxury Curved Sofa Architecture)
    const modelGroup = new THREE.Group();
    modelGroupRef.current = modelGroup;
    mainMaterialsRef.current = [];

    // Main Upholstery Material
    const upholsteryMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(selectedVariant.colorHex),
      roughness: selectedVariant.material === "velvet" ? 0.75 : 0.42,
      metalness: selectedVariant.material === "leather" ? 0.1 : 0.05,
    });
    mainMaterialsRef.current.push(upholsteryMaterial);

    // Gold Metal PVD Brass Accent Material
    const goldPvdMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd4af37),
      metalness: 0.85,
      roughness: 0.22,
    });

    // Dark Walnut Wood Base Material
    const woodBaseMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x3e2723),
      roughness: 0.55,
      metalness: 0.05,
    });

    // --- SOFA GEOMETRY CONSTRUCTION ---
    // A. Main Seat Cushion (Curved Luxury Slab)
    const seatGeo = new THREE.BoxGeometry(2.2, 0.35, 1.1, 16, 8, 16);
    const seatMesh = new THREE.Mesh(seatGeo, upholsteryMaterial);
    seatMesh.position.set(0, -0.1, 0);
    seatMesh.castShadow = true;
    seatMesh.receiveShadow = true;
    modelGroup.add(seatMesh);

    // B. Backrest (Plush Curved Cushion)
    const backGeo = new THREE.BoxGeometry(2.2, 0.65, 0.35, 16, 12, 8);
    const backMesh = new THREE.Mesh(backGeo, upholsteryMaterial);
    backMesh.position.set(0, 0.35, -0.42);
    backMesh.castShadow = true;
    modelGroup.add(backMesh);

    // C. Left Armrest
    const armGeo = new THREE.BoxGeometry(0.3, 0.55, 1.1, 8, 8, 16);
    const armLeft = new THREE.Mesh(armGeo, upholsteryMaterial);
    armLeft.position.set(-1.15, 0.15, 0);
    armLeft.castShadow = true;
    modelGroup.add(armLeft);

    // D. Right Armrest
    const armRight = new THREE.Mesh(armGeo, upholsteryMaterial);
    armRight.position.set(1.15, 0.15, 0);
    armRight.castShadow = true;
    modelGroup.add(armRight);

    // E. 2 Throw Pillows
    const pillowGeo = new THREE.BoxGeometry(0.42, 0.42, 0.18);
    const pillowMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd4af37),
      roughness: 0.6,
      metalness: 0.2,
    });
    const pillow1 = new THREE.Mesh(pillowGeo, pillowMat);
    pillow1.position.set(-0.85, 0.22, -0.22);
    pillow1.rotation.set(0.1, 0.35, 0.15);
    pillow1.castShadow = true;
    modelGroup.add(pillow1);

    const pillow2 = new THREE.Mesh(pillowGeo, pillowMat);
    pillow2.position.set(0.85, 0.22, -0.22);
    pillow2.rotation.set(0.1, -0.35, -0.15);
    pillow2.castShadow = true;
    modelGroup.add(pillow2);

    // F. Walnut Wood Foundation Plinth
    const plinthGeo = new THREE.BoxGeometry(2.4, 0.1, 1.2);
    const plinthMesh = new THREE.Mesh(plinthGeo, woodBaseMaterial);
    plinthMesh.position.set(0, -0.32, 0);
    plinthMesh.castShadow = true;
    modelGroup.add(plinthMesh);

    // G. 4 PVD Gold Legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.025, 0.25, 16);
    const legPositions = [
      [-1.05, -0.45, 0.45],
      [1.05, -0.45, 0.45],
      [-1.05, -0.45, -0.45],
      [1.05, -0.45, -0.45],
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, goldPvdMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      modelGroup.add(leg);
    });

    scene.add(modelGroup);

    // Center camera look target
    camera.lookAt(0, 0, 0);
    setLoading(false);

    // 7. Animation / Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && modelGroupRef.current && !isDraggingRef.current) {
        modelGroupRef.current.rotation.y += 0.005;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight || 480;

      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  // Update 3D Materials when color variant changes
  const handleSelectVariant = (variant: ColorVariant) => {
    setSelectedVariant(variant);

    if (mainMaterialsRef.current.length > 0) {
      mainMaterialsRef.current.forEach((mat) => {
        mat.color.set(variant.colorHex);
        mat.roughness = variant.material === "velvet" ? 0.75 : 0.42;
        mat.metalness = variant.material === "leather" ? 0.1 : 0.05;
        mat.needsUpdate = true;
      });
    }

    if (onVariantChange) {
      onVariantChange(variant, basePrice + (variant.priceDiff || 0));
    }
  };

  // Camera Presets
  const setCameraView = (angle: "hero" | "front" | "top") => {
    if (!cameraRef.current || !modelGroupRef.current) return;
    setActiveCameraAngle(angle);

    // Reset model rotation to face correctly
    modelGroupRef.current.rotation.set(0, 0, 0);

    if (angle === "hero") {
      cameraRef.current.position.set(2.6 / zoomLevel, 1.8 / zoomLevel, 2.6 / zoomLevel);
    } else if (angle === "front") {
      cameraRef.current.position.set(0, 0.4 / zoomLevel, 3.6 / zoomLevel);
    } else if (angle === "top") {
      cameraRef.current.position.set(0, 4.0 / zoomLevel, 0.4 / zoomLevel);
    }
    cameraRef.current.lookAt(0, 0, 0);
  };

  // Zoom controls
  const handleZoom = (factor: number) => {
    if (!cameraRef.current) return;
    const newZoom = Math.max(0.6, Math.min(2.0, zoomLevel * factor));
    setZoomLevel(newZoom);
    cameraRef.current.position.multiplyScalar(factor);
  };

  // Touch and Mouse Orbit Interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !modelGroupRef.current) return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    modelGroupRef.current.rotation.y += deltaX * 0.008;
    modelGroupRef.current.rotation.x = Math.max(
      -0.4,
      Math.min(0.6, modelGroupRef.current.rotation.x + deltaY * 0.005)
    );

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className={`relative bg-gradient-to-b from-[#F5F2EB] to-[#EAE4D7] border border-gold/40 rounded-3xl overflow-hidden shadow-2xl ${className}`}>
      {/* 3D Canvas Workspace */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative w-full h-[380px] sm:h-[460px] md:h-[540px] cursor-grab active:cursor-grabbing select-none flex items-center justify-center"
      >
        <canvas ref={canvasRef} className="w-full h-full block touch-none" />

        {/* Loading Skeleton */}
        {loading && (
          <div className="absolute inset-0 bg-sand/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-30">
            <div className="w-12 h-12 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
            <p className="font-serif text-espresso text-xs tracking-widest2 uppercase">
              Đang kết xuất mô hình 3D WebGL...
            </p>
          </div>
        )}

        {/* Top Badges & Realtime Price HUD */}
        <div className="absolute top-5 left-5 right-5 flex items-center justify-between pointer-events-none z-20">
          <div className="bg-espresso/90 backdrop-blur-md text-beige px-3.5 py-1.5 rounded-full border border-gold/40 text-xs font-serif flex items-center gap-2 shadow-lg">
            <Sparkles size={14} className="text-gold" />
            <span>3D Interactive Studio</span>
          </div>

          <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-gold/50 shadow-lg text-right">
            <span className="text-[10px] text-espresso/60 block uppercase tracking-wider">
              Giá phiên bản đang chọn
            </span>
            <span className="font-serif text-gold font-bold text-base md:text-lg">
              {formatPrice(currentPrice)}
            </span>
          </div>
        </div>

        {/* Left Floating Camera Presets */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
          <button
            onClick={() => setCameraView("hero")}
            title="Góc nghiêng 45° Hero"
            className={`p-2.5 rounded-xl border backdrop-blur-md transition-all text-xs font-medium flex items-center gap-1.5 shadow-md ${
              activeCameraAngle === "hero"
                ? "bg-espresso text-gold border-gold scale-105"
                : "bg-white/70 text-espresso/70 border-espresso/15 hover:bg-white"
            }`}
          >
            <Camera size={14} />
            <span className="hidden sm:inline">Góc Nghiêng</span>
          </button>

          <button
            onClick={() => setCameraView("front")}
            title="Góc chính diện"
            className={`p-2.5 rounded-xl border backdrop-blur-md transition-all text-xs font-medium flex items-center gap-1.5 shadow-md ${
              activeCameraAngle === "front"
                ? "bg-espresso text-gold border-gold scale-105"
                : "bg-white/70 text-espresso/70 border-espresso/15 hover:bg-white"
            }`}
          >
            <Eye size={14} />
            <span className="hidden sm:inline">Chính Diện</span>
          </button>

          <button
            onClick={() => setCameraView("top")}
            title="Nhìn từ trên xuống"
            className={`p-2.5 rounded-xl border backdrop-blur-md transition-all text-xs font-medium flex items-center gap-1.5 shadow-md ${
              activeCameraAngle === "top"
                ? "bg-espresso text-gold border-gold scale-105"
                : "bg-white/70 text-espresso/70 border-espresso/15 hover:bg-white"
            }`}
          >
            <Layers size={14} />
            <span className="hidden sm:inline">Từ Trên</span>
          </button>
        </div>

        {/* Right Floating Zoom & Rotation Tools */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? "Tạm dừng tự động xoay" : "Bật tự động xoay 360°"}
            className="p-2.5 rounded-xl bg-white/80 backdrop-blur-md border border-espresso/15 text-espresso hover:border-gold hover:text-gold shadow-md transition-all"
          >
            {autoRotate ? <Pause size={15} /> : <Play size={15} />}
          </button>

          <button
            onClick={() => handleZoom(0.85)}
            title="Phóng to"
            className="p-2.5 rounded-xl bg-white/80 backdrop-blur-md border border-espresso/15 text-espresso hover:border-gold hover:text-gold shadow-md transition-all"
          >
            <ZoomIn size={15} />
          </button>

          <button
            onClick={() => handleZoom(1.15)}
            title="Thu nhỏ"
            className="p-2.5 rounded-xl bg-white/80 backdrop-blur-md border border-espresso/15 text-espresso hover:border-gold hover:text-gold shadow-md transition-all"
          >
            <ZoomOut size={15} />
          </button>

          <button
            onClick={() => setArOpen(true)}
            title="Xem trong không gian thực qua Camera (AR)"
            className="p-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-charcoal border border-white font-bold shadow-lg hover:scale-105 transition-all"
          >
            <Smartphone size={16} />
          </button>
        </div>

        {/* Bottom Hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-espresso/75 backdrop-blur-md text-champagne px-4 py-1.5 rounded-full text-[11px] pointer-events-none tracking-wider shadow-md">
          ↔ Kéo chuột hoặc vuốt để xoay 360°
        </div>
      </div>

      {/* Material & Color Variant Selector Bar */}
      <div className="bg-white/90 backdrop-blur-md border-t border-gold/30 p-5 md:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest2 text-espresso font-bold">
            Chất Liệu &amp; Bảng Màu Da Đang Chọn:{" "}
            <strong className="text-gold font-serif text-sm ml-1 font-semibold">
              {selectedVariant.name}
            </strong>
          </span>
          <span className="text-[11px] text-espresso/60 hidden sm:inline">
            ✨ Cập nhật vân bề mặt 3D tức thì
          </span>
        </div>

        {/* Color Swatch Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {variants.map((v) => {
            const isSelected = selectedVariant.id === v.id;
            return (
              <button
                key={v.id}
                onClick={() => handleSelectVariant(v)}
                className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "border-gold bg-gold/15 shadow-md scale-102"
                    : "border-espresso/10 hover:border-gold/50 bg-sand/30"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full border border-black/15 shadow-inner shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: v.previewColor }}
                >
                  {isSelected && <Check size={14} className={v.id === "nappa_cream" ? "text-charcoal" : "text-white"} />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-espresso truncate">{v.name}</div>
                  <div className="text-[10px] text-espresso/60 font-serif">
                    {v.priceDiff === 0
                      ? "Tiêu chuẩn"
                      : v.priceDiff && v.priceDiff > 0
                      ? `+${formatPrice(v.priceDiff)}`
                      : `-${formatPrice(Math.abs(v.priceDiff || 0))}`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* AR Space Quick Look Modal Overlay */}
      {arOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-2xl bg-charcoal text-beige border border-gold/40 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
            <button
              onClick={() => setArOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-beige transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gold/20 text-gold flex items-center justify-center">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-champagne">
                  Trải Nghiệm Thực Tế Tăng Cường (AR Quick Look)
                </h3>
                <p className="text-xs text-beige/60">
                  Ướm thử kích thước thật của {productName} vào phòng của bạn
                </p>
              </div>
            </div>

            {/* Simulated AR Camera Viewport */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gold/30 bg-black/60 flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
              
              <div className="relative z-10 text-center space-y-3 p-6 bg-charcoal/85 backdrop-blur-md rounded-2xl border border-white/10 max-w-sm">
                <div className="text-3xl animate-bounce">📱</div>
                <div className="text-sm font-serif font-bold text-gold">
                  Kích thước thực tế: 2.4m (Dài) × 0.95m (Sâu) × 0.85m (Cao)
                </div>
                <p className="text-xs text-beige/70">
                  Quét mã QR bằng điện thoại iPhone (iOS AR QuickLook) hoặc Android (Scene Viewer) để đặt sofa vào phòng qua Camera.
                </p>
                <div className="p-3 bg-white text-charcoal rounded-xl inline-block font-mono text-[11px] font-bold">
                  [GS-LUXURY-AR-READY]
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 text-xs text-beige/70">
              <span>Độ chính xác kích thước 99.8%</span>
              <button
                onClick={() => setArOpen(false)}
                className="px-6 py-2.5 bg-gold text-charcoal font-bold rounded-xl font-serif tracking-wider uppercase text-xs"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
