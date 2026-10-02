import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/StoreContext";
import { ToastProvider } from "@/components/ToastProvider";
import MobileBottomNav from "@/components/MobileBottomNav";

const heading = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#D4AF37",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "GS LUXURY | Nội Thất Cao Cấp & Thương Hiệu Thượng Lưu",
  description:
    "GS Luxury — thương hiệu nội thất cao cấp kiến tạo không gian sống vượt thời gian. Thủ công tinh xảo, chất liệu thượng hạng, dịch vụ đặt riêng theo yêu cầu.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GS Luxury",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${heading.variable} ${body.variable}`}>
      <body className="font-sans antialiased bg-beige text-espresso pb-16 md:pb-0">
        <ToastProvider>
          <StoreProvider>
            {children}
            <MobileBottomNav />
          </StoreProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
