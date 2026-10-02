"use client";

import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import AiShoppingAssistant from "./AiShoppingAssistant";
import ProductComparisonModal from "./ProductComparisonModal";
import MiniGameWheel from "./MiniGameWheel";

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <CartDrawer />
      <AiShoppingAssistant />
      <ProductComparisonModal />
      <MiniGameWheel />
    </>
  );
}
