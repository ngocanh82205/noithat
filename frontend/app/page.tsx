import SiteChrome from "@/components/SiteChrome";
import Hero from "@/components/Hero";
import VirtualRoomStudio from "@/components/VirtualRoomStudio";
import FlashSaleSection from "@/components/FlashSaleSection";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import Lookbook from "@/components/Lookbook";
import CollectionsGrid from "@/components/CollectionsGrid";
import Heritage from "@/components/Heritage";
import Testimonials from "@/components/Testimonials";
import ShowroomAmbientAudio from "@/components/ShowroomAmbientAudio";
import GoldCursorGlow from "@/components/GoldCursorGlow";

export default function Home() {
  return (
    <main className="min-h-screen bg-beige">
      <GoldCursorGlow />
      <ShowroomAmbientAudio />
      <SiteChrome>
        <Hero />
        <VirtualRoomStudio />
        <FlashSaleSection />
        <BeforeAfterSlider />
        <Lookbook />
        <CollectionsGrid />
        <Heritage />
        <Testimonials />
      </SiteChrome>
    </main>
  );
}
