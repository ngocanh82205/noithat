// lib/products.ts — THAY TOÀN BỘ FILE NÀY
export type Product = {
  id: string;
  name: string;
  collection: string;
  category: string;
  categorySlug: string;
  price: number;
  image: string;
  image2?: string;
  description: string;
  featured?: boolean;
};

// Định dạng tiền tệ VND
export function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export const products: Product[] = [
  {
    id: "sofa-velvet-01",
    name: "Sofa Velvet Aurora",
    collection: "The Velvet Sofa Series",
    category: "Living Room",
    categorySlug: "living-room",
    price: 128000000,
    image: "/images/sofa-1.jpg",
    image2: "/images/sofa-2.jpg",
    description:
      "Sofa bọc da Ý nguyên tấm, khung gỗ sồi tự nhiên hoàn thiện thủ công. Đường may tay tỉ mỉ, đệm mút định hình cao cấp giữ form dáng bền bỉ theo năm tháng.",
    featured: true,
  },
  {
    id: "sofa-velvet-02",
    name: "Sofa Modular Riviera",
    collection: "The Velvet Sofa Series",
    category: "Living Room",
    categorySlug: "living-room",
    price: 156000000,
    image: "/images/sofa-3.webp",
    description:
      "Thiết kế module linh hoạt, đệm lông vũ cao cấp, dáng bo tròn mềm mại, dễ dàng tùy biến theo không gian.",
  },
  {
    id: "chair-lounge-01",
    name: "Ghế Lounge Ombré",
    collection: "Statement Seating",
    category: "Living Room",
    categorySlug: "living-room",
    price: 42000000,
    image: "/images/chair-1.jpeg",
    image2: "/images/chair-2.jpg",
    description:
      "Ghế bành dáng vỏ sò, chân đồng thau đánh xước, vải nhập khẩu Ý, điểm nhấn hoàn hảo cho góc đọc sách.",
    featured: true,
  },
  {
    id: "chair-lounge-02",
    name: "Ghế Đọc Sách Noir",
    collection: "Statement Seating",
    category: "Living Room",
    categorySlug: "living-room",
    price: 38500000,
    image: "/images/chair-3.jpg",
    description: "Đường nét tối giản, tựa lưng cao, đệm foam định hình.",
  },
  {
    id: "table-marble-01",
    name: "Bàn Trà Marble Aria",
    collection: "Handcrafted Marble Tables",
    category: "Living Room",
    categorySlug: "living-room",
    price: 64000000,
    image: "/images/coffee-table-1.jpg",
    image2: "/images/coffee-table-3.jpg",
    description: "Mặt đá cẩm thạch nguyên khối, chân đế hợp kim mạ vàng 24K.",
  },
  {
    id: "table-dining-01",
    name: "Bàn Ăn Sovereign",
    collection: "Handcrafted Marble Tables",
    category: "Dining",
    categorySlug: "dining",
    price: 189000000,
    image: "/images/dining-table-1.jpg",
    image2: "/images/dining-table-2.webp",
    description:
      "Bộ bàn ăn 8 ghế, chạm khắc thủ công, hoàn thiện dát vàng — điểm nhấn trung tâm cho phòng ăn thượng lưu.",
    featured: true,
  },
  {
    id: "bed-canopy-01",
    name: "Giường Canopy Elysée",
    collection: "Bedroom Sanctuary",
    category: "Bedroom",
    categorySlug: "bedroom",
    price: 96000000,
    image: "/images/bed-1.jpg",
    image2: "/images/bed-2.jpg",
    description:
      "Khung giường bốn trụ, phủ vải lanh cao cấp, tay nghề nghệ nhân — mang lại cảm giác như một khu nghỉ dưỡng riêng tư.",
    featured: true,
  },
  {
    id: "wardrobe-01",
    name: "Tủ Áo Héritage",
    collection: "Bedroom Sanctuary",
    category: "Bedroom",
    categorySlug: "bedroom",
    price: 118000000,
    image: "/images/wardrobe-1.webp",
    image2: "/images/wardrobe-2.webp",
    description:
      "Vân gỗ óc chó tự nhiên, phào chỉ đồng, khoang lưu trữ tối ưu.",
  },
  {
    id: "mirror-01",
    name: "Gương Trang Trí Cascade",
    collection: "Finishing Details",
    category: "Lighting",
    categorySlug: "lighting",
    price: 24500000,
    image: "/images/mirror-1.jpg",
    image2: "/images/mirror-2.jpg",
    description: "Khung pha lê xếp lớp thủ công, tạo điểm nhấn ánh sáng.",
  },
  {
    id: "lamp-01",
    name: "Đèn Sàn Solstice",
    collection: "Finishing Details",
    category: "Lighting",
    categorySlug: "lighting",
    price: 18900000,
    image: "/images/lamp-1.jpg",
    image2: "/images/lamp-2.webp",
    description: "Thân đồng nguyên khối, chao đèn vải lụa thủ công.",
  },
  {
    id: "rug-01",
    name: "Thảm Dệt Tay Meridian",
    collection: "Finishing Details",
    category: "Living Room",
    categorySlug: "living-room",
    price: 32000000,
    image: "/images/rug-1.jpg",
    image2: "/images/rug-2.jpg",
    description: "Len tự nhiên dệt tay, hoạ tiết lấy cảm hứng từ vân đá.",
  },
  {
    id: "desk-01",
    name: "Bàn Làm Việc Executive",
    collection: "Bespoke Study",
    category: "Bespoke Service",
    categorySlug: "bespoke",
    price: 74000000,
    image: "/images/desk-1.jpg",
    image2: "/images/desk-2.jpg",
    description:
      "Mặt bàn da thuộc, khung thép sơn tĩnh điện, thiết kế đặt riêng.",
    featured: true,
  },
  {
    id: "kitchen-01",
    name: "Tủ Bếp Bespoke Provence",
    collection: "Kitchen Atelier",
    category: "Kitchen",
    categorySlug: "kitchen",
    price: 245000000,
    image: "/images/kitchen-3.jpg",
    image2: "/images/kitchen-1.jpg",
    description:
      "Hệ tủ bếp đóng riêng theo không gian, mặt đá tự nhiên, phụ kiện nhập khẩu châu Âu.",
  },
  {
    id: "kitchen-02",
    name: "Đảo Bếp Marble Grand",
    collection: "Kitchen Atelier",
    category: "Kitchen",
    categorySlug: "kitchen",
    price: 168000000,
    image: "/images/kitchen-2.jpg",
    description:
      "Đảo bếp trung tâm mặt đá cẩm thạch, khung gỗ sồi hoàn thiện tay.",
  },
];

// Danh sách bộ sưu tập hiển thị trên trang chủ & điều hướng
export const collections = [
  {
    id: "living-room",
    name: "Living Room",
    label: "Phòng Khách",
    image: "/images/sofa-1.jpg",
  },
  {
    id: "bedroom",
    name: "Bedroom",
    label: "Phòng Ngủ",
    image: "/images/bed-1.jpg",
  },
  {
    id: "dining",
    name: "Dining",
    label: "Phòng Ăn",
    image: "/images/dining-table-1.jpg",
  },
  {
    id: "lighting",
    name: "Lighting",
    label: "Chiếu Sáng",
    image: "/images/mirror-1.jpg",
  },
  {
    id: "kitchen",
    name: "Kitchen",
    label: "Nhà Bếp",
    image: "/images/kitchen-3.jpg",
  },
  {
    id: "bespoke",
    name: "Bespoke Service",
    label: "Đặt Riêng Theo Yêu Cầu",
    image: "/images/desk-1.jpg",
  },
];

export const hotspots = [
  { id: "hs-1", top: "58%", left: "22%", productId: "sofa-velvet-01" },
  { id: "hs-2", top: "68%", left: "48%", productId: "table-marble-01" },
  { id: "hs-3", top: "34%", left: "76%", productId: "lamp-01" },
];

// Lấy danh sách sản phẩm nổi bật cho trang chủ
export function getFeaturedProducts(limit = 4): Product[] {
  const featured = products.filter((p) => p.featured);
  return (featured.length > 0 ? featured : products).slice(0, limit);
}

// Lấy sản phẩm theo danh mục (dùng cho trang /collections/[slug])
export function getProductsByCategory(slug: string): Product[] {
  return products.filter((p) => p.categorySlug === slug);
}

// Lấy thông tin 1 sản phẩm theo id (dùng cho trang /products/[id])
export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

// Lấy vài sản phẩm liên quan (cùng danh mục, khác id hiện tại)
export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter(
      (p) => p.categorySlug === product.categorySlug && p.id !== product.id,
    )
    .slice(0, limit);
}
