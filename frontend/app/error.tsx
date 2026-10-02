"use client";

import { useEffect } from "react";
import Link from "next/link";

// Trang lỗi chung tiếng Việt: hiện khi một trang không tải được dữ liệu (vd. máy chủ đang khởi động
// trên Render free, mất mạng). Không hiển thị chi tiết kỹ thuật cho khách.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-beige flex items-center justify-center px-6">
      <div className="max-w-xl text-center py-24">
        <p className="font-serif text-3xl text-gold">GS LUXURY</p>
        <h1 className="font-serif text-2xl md:text-3xl text-espresso mt-6">Chưa tải được trang</h1>
        <p className="text-sm text-espresso/60 mt-3 leading-relaxed">
          Máy chủ có thể đang khởi động hoặc kết nối mạng bị gián đoạn.
          <br />
          Vui lòng đợi vài giây rồi bấm <strong>Thử lại</strong>.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-8 py-3.5 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors"
          >
            Thử lại
          </button>
          <Link
            href="/"
            className="px-8 py-3.5 border border-espresso/20 text-espresso text-xs tracking-widest2 uppercase hover:border-gold hover:text-gold transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
