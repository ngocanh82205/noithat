# GS Luxury — Frontend Trang Chủ

Frontend trang chủ cho thương hiệu nội thất cao cấp **GS Luxury**, xây dựng bằng
Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion + Lucide React.
Đây là phần **frontend thuần túy** (chưa có backend/API thật — dữ liệu sản phẩm
và giỏ hàng đang được xử lý ở phía client bằng React Context).

## Cài đặt

```bash
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:3000`.

## Cấu trúc thư mục

```
gs-luxury-frontend/
├── app/
│   ├── layout.tsx        # Layout gốc, khai báo font & Provider
│   ├── page.tsx           # Trang chủ, ghép các section lại
│   └── globals.css        # Design tokens & style nền
├── components/
│   ├── Header.tsx          # Thanh thông báo + nav sticky + icon
│   ├── SearchModal.tsx     # Modal tìm kiếm sản phẩm
│   ├── Hero.tsx             # Section mở đầu, slider ken-burns
│   ├── Lookbook.tsx         # "Shop the Room" — hotspot tương tác
│   ├── ProductCard.tsx      # Card sản phẩm, hover đổi ảnh
│   ├── CollectionsGrid.tsx  # Lưới danh mục + sản phẩm nổi bật
│   ├── Heritage.tsx          # Section dark mode, parallax thương hiệu
│   ├── Testimonials.tsx      # Carousel đánh giá & báo chí
│   ├── CartDrawer.tsx         # Giỏ hàng slide-over
│   ├── Footer.tsx              # Footer + đăng ký nhận bản tin
│   └── StoreContext.tsx        # Context quản lý giỏ hàng & wishlist
├── lib/
│   ├── products.ts    # Dữ liệu sản phẩm mẫu (thay bằng API khi có backend)
│   └── utils.ts        # Hàm tiện ích (cn className merge)
└── public/images/       # Toàn bộ ảnh sản phẩm & banner
```

## Design tokens

| Token | Giá trị |
|---|---|
| Nền chính (beige) | `#FDFBF7` |
| Nền tối (charcoal) | `#121212` |
| Chữ chính (espresso) | `#1A1A1A` |
| Nhấn (gold) | `#D4AF37` |
| Nhấn phụ (champagne) | `#E6D5B8` |
| Font tiêu đề | Cormorant Garamond (serif) |
| Font nội dung | Plus Jakarta Sans (sans-serif) |

## Kết nối backend sau này

Toàn bộ dữ liệu sản phẩm hiện nằm trong `lib/products.ts`. Khi có backend/API,
chỉ cần thay các hàm đọc dữ liệu tĩnh này bằng lời gọi API tương ứng (ví dụ
`fetch` trong Server Component hoặc React Query), cấu trúc `Product` đã được
định nghĩa sẵn dạng TypeScript type để dễ dàng ánh xạ.

Giỏ hàng và wishlist hiện lưu tạm trong bộ nhớ (React Context — `StoreContext.tsx`).
Khi có backend, có thể thay bằng gọi API giỏ hàng thật hoặc đồng bộ với
`localStorage`/tài khoản người dùng.
