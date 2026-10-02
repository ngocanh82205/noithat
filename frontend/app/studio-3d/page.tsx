import type { Metadata } from "next";
import SiteChrome from "@/components/SiteChrome";
import VirtualRoomStudio from "@/components/VirtualRoomStudio";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import ShowroomAmbientAudio from "@/components/ShowroomAmbientAudio";
import GoldCursorGlow from "@/components/GoldCursorGlow";

export const metadata: Metadata = {
  title: "3D Virtual Studio — Phối Cảnh Không Gian Đa Chiều | GS Luxury",
  description:
    "Trải nghiệm Studio 3D độc quyền của GS Luxury: Tùy biến vật liệu, đổi 4 chế độ ánh sáng real-time và tính toán ngân sách hoàn thiện dinh thự.",
};

export default function Studio3DPage() {
  return (
    <main className="min-h-screen bg-charcoal text-beige">
      <GoldCursorGlow />
      <ShowroomAmbientAudio />
      <SiteChrome>
        <VirtualRoomStudio />
        <BeforeAfterSlider />
      </SiteChrome>
    </main>
  );
}
