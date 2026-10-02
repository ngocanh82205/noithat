# GS LUXURY — DỰ ÁN WEBSITE NỘI THẤT CAO CẤP (FULL-STACK)

Website thương mại điện tử chuyên biệt cho thương hiệu nội thất cao cấp **GS Luxury**, được thiết kế theo kiến trúc tách biệt hoàn toàn giữa **Backend (Laravel 12 RESTful API)** và **Frontend (Next.js 14 App Router + TypeScript + Tailwind CSS)**.

---

## 1. Cấu trúc cây thư mục (Feature-Based & Separated Architecture)

```text
Duandonoithat/
├── backend/                       # Backend: Laravel 12 RESTful API & Business Logic
│   ├── app/
│   │   ├── Http/Controllers/Api/  # Controller tổ chức theo Module tính năng
│   │   │   ├── Auth/              # Đăng ký, Đăng nhập, Profile (Sanctum Tokens)
│   │   │   ├── Catalog/           # Danh mục (Categories) & Bộ sưu tập (Collections)
│   │   │   ├── Product/           # Sản phẩm, Biến thể màu sắc/kích thước, Lọc, Tìm kiếm
│   │   │   ├── Cart/              # Quản lý giỏ hàng (Guest Session & User Account)
│   │   │   ├── Order/             # Đặt hàng, Tính phí vận chuyển lắp đặt, Tra cứu đơn
│   │   │   ├── Lookbook/          # Phối cảnh "Shop The Room" & Hotspot tương tác
│   │   │   ├── Consultation/      # Đặt lịch hẹn kiến trúc sư tư vấn / may đo tại nhà
│   │   │   └── Review/            # Đánh giá, xếp hạng sản phẩm kèm nhận xét
│   │   └── Models/                # Eloquent Models (Product, Category, Order, CartItem...)
│   ├── config/
│   │   └── cors.php               # Cấu hình CORS cho phép Next.js kết nối an toàn
│   ├── database/
│   │   ├── migrations/            # Schema 12 bảng CSDL chuẩn cho ngành nội thất
│   │   └── seeders/               # Bộ dữ liệu mẫu nội thất cao cấp chân thực
│   └── routes/
│       └── api.php                # 23 RESTful API Endpoints chuẩn hóa
│
├── frontend/                      # Frontend: Next.js 14 App Router Storefront
│   ├── app/                       # Routing & Giao diện các trang
│   │   ├── page.tsx               # Trang chủ (Hero, Lookbook, Collections, Testimonials)
│   │   ├── products/
│   │   │   ├── page.tsx           # Trang danh mục & lọc sản phẩm (Search, Category, Sort)
│   │   │   └── [id]/page.tsx      # Trang chi tiết sản phẩm & thông số kỹ thuật
│   │   ├── collections/[slug]/    # Trang sản phẩm theo không gian (Living Room, Bedroom...)
│   │   ├── checkout/page.tsx      # Trang thanh toán (Thông tin, Địa chỉ, VietQR/COD/VNPAY)
│   │   ├── order-success/         # Trang xác nhận đơn hàng kèm mã VietQR tự động
│   │   └── booking/page.tsx       # Trang đặt lịch hẹn tư vấn thiết kế nội thất
│   ├── components/                # UI Components tái sử dụng (Header, Footer, CartDrawer...)
│   ├── services/
│   │   └── api.ts                 # API Service Client kết nối sang Laravel Backend
│   └── public/images/             # Hình ảnh sản phẩm, phối cảnh phòng, banner cao cấp
│
└── README.md                      # Tài liệu tổng quan dự án
```

---

## 2. Hướng dẫn khởi chạy dự án

### Yêu cầu môi trường
- PHP >= 8.2 + Composer, MySQL (XAMPP / MariaDB) — hoặc SQLite nếu không muốn cài MySQL
- Node.js >= 18.x & npm

---

### Bước 1: Khởi chạy Backend (Laravel API)

```bash
cd backend
composer install
cp .env.example .env          # Windows: copy .env.example .env
php artisan key:generate
```

Mở `backend/.env` và điền thông tin MySQL (tạo sẵn database `gs_luxury` trong phpMyAdmin):

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gs_luxury
DB_USERNAME=root
DB_PASSWORD=
```

> Không có MySQL: xoá các dòng `DB_*` ở trên, chỉ để `DB_CONNECTION=sqlite`, rồi tạo file rỗng `backend/database/database.sqlite`.

Tạo bảng + dữ liệu mẫu, rồi chạy server:

```bash
php artisan migrate:fresh --seed
php artisan serve --port=8000
```

> Backend API sẵn sàng tại: `http://127.0.0.1:8000/api`
>
> Đã có database từ trước và chỉ cập nhật code mới: chạy `php artisan migrate` (không `fresh`) để giữ dữ liệu.

---

### Bước 2: Khởi chạy Frontend (Next.js Storefront)

Mở một cửa sổ terminal mới:

```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt: **`http://localhost:3000`**

> Backend chạy ở địa chỉ khác `http://127.0.0.1:8000`: tạo `frontend/.env.local` từ `frontend/.env.example` và sửa `NEXT_PUBLIC_API_URL`.

### Chạy test backend

```bash
cd backend
php artisan test
```

---

## 3. Danh sách RESTful API Endpoints (Backend)

| Method | Endpoint | Mô tả chức năng |
|---|---|---|
| `POST` | `/api/auth/register` | Đăng ký tài khoản khách hàng |
| `POST` | `/api/auth/login` | Đăng nhập & cấp phát Sanctum Token |
| `GET` | `/api/auth/me` | Lấy thông tin tài khoản đang đăng nhập |
| `GET` | `/api/categories` | Lấy danh sách danh mục (Living Room, Bedroom...) |
| `GET` | `/api/collections` | Lấy danh sách bộ sưu tập theo phong cách |
| `GET` | `/api/products` | Lấy danh sách sản phẩm (hỗ trợ lọc `category`, `collection`, `min_price`, `max_price`, `q`, `sort`) |
| `GET` | `/api/products/{slugOrId}` | Chi tiết sản phẩm, biến thể, hình ảnh & sản phẩm liên quan |
| `POST` | `/api/products/{id}/reviews` | Gửi đánh giá và chấm sao cho sản phẩm |
| `GET` | `/api/lookbooks` | Lấy dữ liệu phối cảnh căn phòng & tọa độ Hotspot ("Shop The Room") |
| `GET` | `/api/cart` | Lấy danh sách giỏ hàng theo User hoặc Session ID |
| `POST` | `/api/cart` | Thêm sản phẩm / biến thể vào giỏ hàng |
| `PUT` | `/api/cart/{id}` | Cập nhật số lượng item trong giỏ |
| `DELETE` | `/api/cart/{id}` | Xóa sản phẩm khỏi giỏ |
| `POST` | `/api/orders` | Đặt hàng (Checkout) & tạo đơn hàng mới |
| `GET` | `/api/orders/track/{orderNumber}` | Tra cứu hành trình & chi tiết đơn hàng |
| `POST` | `/api/consultations` | Đăng ký lịch hẹn tư vấn thiết kế nội thất tại nhà |

---

## 4. Tài khoản quản trị & thử nghiệm

Tạo bởi `php artisan migrate:fresh --seed` (FurnitureSeeder):

- **Admin:** `admin@gsluxury.vn` / Mật khẩu: `GsLuxury#2026!Secure` — đăng nhập tại `http://localhost:3000/admin`
- **Khách hàng:** `customer@gmail.com` / Mật khẩu: `Customer@123456`

> Đổi mật khẩu admin ngay sau khi triển khai thật.
