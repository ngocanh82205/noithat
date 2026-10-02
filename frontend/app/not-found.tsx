import Link from "next/link";
import SiteChrome from "@/components/SiteChrome";

// Trang 404 tiếng Việt (thay cho "This page could not be found." mặc định của Next.js)
export default function NotFound() {
  return (
    <main className="min-h-screen bg-beige">
      <SiteChrome>
        <section className="py-24 px-6">
          <div className="mx-auto max-w-xl text-center">
            <p className="font-serif text-7xl text-gold">404</p>
            <h1 className="font-serif text-2xl md:text-3xl text-espresso mt-4">Không tìm thấy trang</h1>
            <p className="text-sm text-espresso/60 mt-3">
              Đường dẫn không tồn tại hoặc sản phẩm đã ngừng kinh doanh.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/products"
                className="px-8 py-3.5 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors"
              >
                Xem sản phẩm
              </Link>
              <Link
                href="/"
                className="px-8 py-3.5 border border-espresso/20 text-espresso text-xs tracking-widest2 uppercase hover:border-gold hover:text-gold transition-colors"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </section>
      </SiteChrome>
    </main>
  );
}
