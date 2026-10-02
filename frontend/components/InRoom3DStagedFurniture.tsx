"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type InRoom3DProps = {
  category: string;
  colorHex?: string;
  materialType?: "leather" | "velvet" | "wood" | "marble";
  scale: number;
  isFlipped: boolean;
  onPointerDown?: () => void;
};

export default function InRoom3DStagedFurniture({
  category = "sofa",
  colorHex = "#964B00",
  materialType = "leather",
  scale = 1,
  isFlipped = false,
}: InRoom3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const rotationYRef = useRef(isFlipped ? Math.PI : 0);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera Setup (Hero 45° angle)
    const camera = new THREE.PerspectiveCamera(38, 4 / 3, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);
    camera.lookAt(0, -0.1, 0);
    cameraRef.current = camera;

    // 3. Renderer with 100% TRANSPARENT ALPHA BACKGROUND
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true, // Transparent background! No square box!
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(400, 300);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // 100% Alpha Transparent
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. Studio Lighting tailored for in-room blending
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff8e7, 2.2);
    keyLight.position.set(4, 5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xd4af37, 0.8);
    fillLight.position.set(-4, 3, 2);
    scene.add(fillLight);

    // Soft Contact Floor Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(6, 6);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.7;
    shadowMesh.receiveShadow = true;
    scene.add(shadowMesh);

    // 5. Build 3D Furniture Geometry according to category
    const modelGroup = new THREE.Group();
    modelGroupRef.current = modelGroup;
    modelGroup.rotation.y = rotationYRef.current;

    // Materials
    const upholsteryMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: materialType === "velvet" ? 0.75 : 0.38,
      metalness: materialType === "leather" ? 0.12 : 0.05,
    });

    const goldPvdMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd4af37),
      metalness: 0.85,
      roughness: 0.22,
    });

    const darkWalnutMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x3e2723),
      roughness: 0.5,
      metalness: 0.05,
    });

    const marbleMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xf5f5f0),
      roughness: 0.15,
      metalness: 0.1,
    });

    const catLower = category.toLowerCase();

    if (catLower.includes("dining") || catLower.includes("bàn ăn")) {
      // --- DINING TABLE 3D ---
      // Marble Slab Top
      const topGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.08, 32);
      const topMesh = new THREE.Mesh(topGeo, marbleMat);
      topMesh.position.y = 0.35;
      topMesh.castShadow = true;
      modelGroup.add(topMesh);

      // Gold PVD Pedestal Frame
      const pedGeo = new THREE.CylinderGeometry(0.5, 0.8, 0.85, 24);
      const pedMesh = new THREE.Mesh(pedGeo, goldPvdMat);
      pedMesh.position.y = -0.15;
      pedMesh.castShadow = true;
      modelGroup.add(pedMesh);

      // 2 Dining Chairs
      [-1.3, 1.3].forEach((posX) => {
        const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), upholsteryMat);
        chairSeat.position.set(posX, -0.05, 0);
        chairSeat.castShadow = true;
        modelGroup.add(chairSeat);

        const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), upholsteryMat);
        chairBack.position.set(posX, 0.22, posX < 0 ? -0.22 : 0.22);
        chairBack.castShadow = true;
        modelGroup.add(chairBack);

        // Legs
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.55, 12), goldPvdMat);
        leg.position.set(posX, -0.35, 0);
        leg.castShadow = true;
        modelGroup.add(leg);
      });
    } else if (catLower.includes("coffee") || catLower.includes("bàn trà") || catLower.includes("marble")) {
      // --- COFFEE TABLE 3D ---
      // Big Tier Marble
      const top1 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.06, 32), marbleMat);
      top1.position.set(-0.35, -0.1, 0);
      top1.castShadow = true;
      modelGroup.add(top1);

      const base1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 0.45, 24), goldPvdMat);
      base1.position.set(-0.35, -0.38, 0);
      base1.castShadow = true;
      modelGroup.add(base1);

      // Nested Small Tier Marble
      const top2 = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.05, 32), darkWalnutMat);
      top2.position.set(0.65, 0.05, 0.2);
      top2.castShadow = true;
      modelGroup.add(top2);

      const base2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.6, 24), goldPvdMat);
      base2.position.set(0.65, -0.3, 0.2);
      base2.castShadow = true;
      modelGroup.add(base2);
    } else if (catLower.includes("giường") || catLower.includes("bed")) {
      // --- LUXURY BED 3D ---
      // Headboard
      const headGeo = new THREE.BoxGeometry(2.4, 1.2, 0.2, 16, 8, 4);
      const headMesh = new THREE.Mesh(headGeo, upholsteryMat);
      headMesh.position.set(0, 0.3, -1.1);
      headMesh.castShadow = true;
      modelGroup.add(headMesh);

      // Mattress / Bed Base
      const bedGeo = new THREE.BoxGeometry(2.1, 0.45, 2.0);
      const bedMesh = new THREE.Mesh(bedGeo, darkWalnutMat);
      bedMesh.position.set(0, -0.2, 0);
      bedMesh.castShadow = true;
      modelGroup.add(bedMesh);

      const duvet = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.2, 1.7), upholsteryMat);
      duvet.position.set(0, 0.05, 0.1);
      duvet.castShadow = true;
      modelGroup.add(duvet);
    } else if (catLower.includes("đèn") || catLower.includes("lamp")) {
      // --- FLOOR LAMP 3D ---
      // Base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 24), marbleMat);
      base.position.set(0, -0.65, 0);
      base.castShadow = true;
      modelGroup.add(base);

      // Pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 16), goldPvdMat);
      pole.position.set(0, 0.15, 0);
      pole.castShadow = true;
      modelGroup.add(pole);

      // Shade
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.4, 24, 1, true), goldPvdMat);
      shade.position.set(0, 0.9, 0);
      shade.rotation.x = Math.PI;
      shade.castShadow = true;
      modelGroup.add(shade);
    } else {
      // --- LUXURY SOFA 3D (DEFAULT) ---
      // 1. Seat Cushion
      const seatGeo = new THREE.BoxGeometry(2.2, 0.32, 1.1, 16, 8, 16);
      const seatMesh = new THREE.Mesh(seatGeo, upholsteryMat);
      seatMesh.position.set(0, -0.12, 0);
      seatMesh.castShadow = true;
      modelGroup.add(seatMesh);

      // 2. Backrest
      const backGeo = new THREE.BoxGeometry(2.2, 0.6, 0.32, 16, 12, 8);
      const backMesh = new THREE.Mesh(backGeo, upholsteryMat);
      backMesh.position.set(0, 0.28, -0.4);
      backMesh.castShadow = true;
      modelGroup.add(backMesh);

      // 3. Armrests
      const armGeo = new THREE.BoxGeometry(0.28, 0.5, 1.1, 8, 8, 16);
      const armL = new THREE.Mesh(armGeo, upholsteryMat);
      armL.position.set(-1.18, 0.1, 0);
      armL.castShadow = true;
      modelGroup.add(armL);

      const armR = new THREE.Mesh(armGeo, upholsteryMat);
      armR.position.set(1.18, 0.1, 0);
      armR.castShadow = true;
      modelGroup.add(armR);

      // 4. Pillows
      const pillowGeo = new THREE.BoxGeometry(0.38, 0.38, 0.16);
      const p1 = new THREE.Mesh(pillowGeo, goldPvdMat);
      p1.position.set(-0.85, 0.18, -0.2);
      p1.rotation.set(0.1, 0.3, 0.1);
      p1.castShadow = true;
      modelGroup.add(p1);

      const p2 = new THREE.Mesh(pillowGeo, goldPvdMat);
      p2.position.set(0.85, 0.18, -0.2);
      p2.rotation.set(0.1, -0.3, -0.1);
      p2.castShadow = true;
      modelGroup.add(p2);

      // 5. Plinth & Gold Legs
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.16), darkWalnutMat);
      plinth.position.set(0, -0.32, 0);
      plinth.castShadow = true;
      modelGroup.add(plinth);

      const legGeo = new THREE.CylinderGeometry(0.035, 0.02, 0.22, 16);
      [
        [-1.1, -0.45, 0.45],
        [1.1, -0.45, 0.45],
        [-1.1, -0.45, -0.45],
        [1.1, -0.45, -0.45],
      ].forEach(([x, y, z]) => {
        const leg = new THREE.Mesh(legGeo, goldPvdMat);
        leg.position.set(x, y, z);
        leg.castShadow = true;
        modelGroup.add(leg);
      });
    }

    scene.add(modelGroup);

    // 6. Animation Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // 7. Interactive Drag to Rotate 3D Model in Room
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !modelGroupRef.current) return;
      const deltaX = e.clientX - prevMouseRef.current.x;
      modelGroupRef.current.rotation.y += deltaX * 0.012;
      rotationYRef.current = modelGroupRef.current.rotation.y;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !modelGroupRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseRef.current.x;
      modelGroupRef.current.rotation.y += deltaX * 0.015;
      rotationYRef.current = modelGroupRef.current.rotation.y;
      prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const canvas = canvasRef.current;
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      renderer.dispose();
    };
  }, [category, colorHex, materialType]);

  return (
    <div
      ref={containerRef}
      className="relative cursor-grab active:cursor-grabbing select-none"
      style={{
        transform: `scale(${scale}) ${isFlipped ? "scaleX(-1)" : ""}`,
        transformOrigin: "center center",
      }}
      title="Giữ chuột và kéo để xoay 3D góc nhìn nội thất trong phòng"
    >
      {/* 100% Transparent WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-64 sm:w-80 md:w-96 aspect-[4/3] drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)]"
      />
    </div>
  );
}
