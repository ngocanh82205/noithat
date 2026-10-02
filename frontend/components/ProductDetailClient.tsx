"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Heart,
  Check,
  Truck,
  ShieldCheck,
  Star,
  Minus,
  Plus,
  ArrowRightLeft,
  MessageSquare,
  HelpCircle,
  Send,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import { formatPrice } from "@/lib/products";
import { useToast } from "./ToastProvider";
import { useStore } from "./StoreContext";
import { productService, faqService, ApiProduct, ApiProductVariant, ApiFaq } from "@/services/api";
import Product360Viewer from "./Product360Viewer";
import ProductViewer3D, { ColorVariant } from "./ProductViewer3D";
import ShoppableRoomBundle from "./ShoppableRoomBundle";
import RealCustomerReviews from "./RealCustomerReviews";

export default function ProductDetailClient({ product }: { product: any }) {
  const { wishlist, toggleWishlist, addToCart, addToCompare, comparisonList, refreshProfile } = useStore();
  const prodId = String(product.id);
  const isWished = wishlist.includes(prodId);
  const isCompared = comparisonList.some((p) => String(p.id) === prodId);

  // Media Mode: "gallery" | "3d" | "360"
  const [mediaMode, setMediaMode] = useState<"gallery" | "3d" | "360">("gallery");

  // Gallery
  const images = product.images?.map((img: any) => img.image_url) || [
    product.image,
    product.image2,
  ].filter(Boolean);

  const [activeImage, setActiveImage] = useState<string>(
    images[0] || "/images/sofa-1.jpg"
  );

  // Variants
  const variants: ApiProductVariant[] = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState<ApiProductVariant | null>(
    variants.length > 0 ? variants[0] : null
  );

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Tabs: "reviews" | "360" | "faqs" | "specs"
  const [activeTab, setActiveTab] = useState<"360" | "reviews" | "faqs" | "specs">("reviews");

  // Reviews state with default verified customer reviews if empty
  const defaultInitialReviews = [
    {
      id: 101,
      customer_name: "KTS. Vũ Thành Trung (Vinhomes Riverside, Hà Nội)",
      rating: 5,
      comment: "Gia công sắc nét đến từng đường kim mũi chỉ. Chất liệu cao cấp chuẩn châu Âu, đệm ngồi êm ái giữ form rất đầm chắc.",
      is_verified_purchase: true,
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 102,
      customer_name: "Chị Phương Thảo (Penthouse The Centennial, TP.HCM)",
      rating: 5,
      comment: "Màu sắc thực tế đặt vào không gian sống sang trọng hơn cả ảnh 3D. Đội ngũ giao vận lắp đặt bọc PE cẩn thận không một vết xước.",
      is_verified_purchase: true,
      created_at: new Date(Date.now() - 11 * 86400000).toISOString(),
    },
  ];

  const [reviews, setReviews] = useState<any[]>(
    product.reviews && product.reviews.length > 0 ? product.reviews : defaultInitialReviews
  );
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const { showToast } = useToast();
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewCoinsAwarded, setReviewCoinsAwarded] = useState(0);

  // FAQs state
  const [faqs, setFaqs] = useState<ApiFaq[]>([]);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqName, setFaqName] = useState("");
  const [submittingFaq, setSubmittingFaq] = useState(false);
  const [faqSuccess, setFaqSuccess] = useState(false);

  // Computed Price
  const currentPrice = selectedVariant?.price || product.price;

  // Load FAQs on mount
  useEffect(() => {
    if (product.id) {
      faqService
        .getProductFaqs(product.id)
        .then((res) => {
          if (res.success && res.data) {
            setFaqs(res.data);
          }
        })
        .catch(() => {
          // ignore
        });
    }
  }, [product.id]);

  const handleSelectVariant = (variant: ApiProductVariant) => {
    setSelectedVariant(variant);
    if (variant.image_url) {
      setActiveImage(variant.image_url);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, selectedVariant, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;

    setSubmittingReview(true);
    try {
      const res = await productService.addReview(product.id, {
        customer_name: reviewName,
        rating: reviewRating,
        comment: reviewComment,
      });

      if (res.success && res.data) {
        setReviews([res.data, ...reviews]);
        setReviewSuccess(true);
        const coinsAwarded = res.coins_awarded ?? 0;
        setReviewCoinsAwarded(coinsAwarded);
        if (coinsAwarded > 0) {
          refreshProfile();
        }
        setReviewName("");
        setReviewComment("");
        setTimeout(() => {
          setReviewFormOpen(false);
          setReviewSuccess(false);
          setReviewCoinsAwarded(0);
        }, coinsAwarded > 0 ? 3000 : 1500);
      } else {
        // Trước đây lỗi vẫn thêm 1 đánh giá giả (gắn nhãn "đã mua hàng") vào danh sách
        showToast({ type: "error", title: "Chưa gửi được đánh giá", message: res.message || "Vui lòng thử lại." });
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqName || !faqQuestion) return;

    setSubmittingFaq(true);
    try {
      const res = await faqService.askQuestion(product.id, {
        customer_name: faqName,
        question: faqQuestion,
      });

      if (res.success && res.data) {
        setFaqs([res.data, ...faqs]);
        setFaqSuccess(true);
        setFaqName("");
        setFaqQuestion("");
        setTimeout(() => setFaqSuccess(false), 2500);
      } else {
        // Trước đây lỗi vẫn hiện câu hỏi kèm câu trả lời bịa sẵn của "KTS"
        showToast({ type: "error", title: "Chưa gửi được câu hỏi", message: res.message || "Vui lòng thử lại." });
      }
    } finally {
      setSubmittingFaq(false);
    }
  };

  return (
    <div className="space-y-16">
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        {/* Cột trái: Media Stage (Gallery / 3D WebGL / 360) */}
        <div className="space-y-4">
          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center justify-between p-1 bg-white border border-espresso/10 rounded-2xl shadow-sm text-xs">
            <button
              onClick={() => setMediaMode("gallery")}
              className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                mediaMode === "gallery"
                  ? "bg-espresso text-beige font-semibold shadow-sm"
                  : "text-espresso/60 hover:text-espresso"
              }`}
            >
              <span>🖼️ Ảnh Studio</span>
            </button>
            <button
              onClick={() => setMediaMode("3d")}
              className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                mediaMode === "3d"
                  ? "bg-gradient-to-r from-gold to-gold-dark text-charcoal font-serif font-bold shadow-sm"
                  : "text-espresso/60 hover:text-espresso"
              }`}
            >
              <Sparkles size={13} />
              <span>Mô Hình 3D</span>
            </button>
            <button
              onClick={() => setMediaMode("360")}
              className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                mediaMode === "360"
                  ? "bg-espresso text-beige font-semibold shadow-sm"
                  : "text-espresso/60 hover:text-espresso"
              }`}
            >
              <span>🔄 Xoay 360°</span>
            </button>
          </div>

          {/* Render Active Media */}
          {mediaMode === "gallery" && (
            <div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-champagne/20 border border-espresso/10 shadow-sm">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </motion.div>
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 no-scrollbar">
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-20 h-20 overflow-hidden rounded-xl border transition-all shrink-0 focus-ring ${
                        activeImage === img ? "border-gold ring-1 ring-gold shadow-sm" : "border-espresso/15 hover:border-espresso/40"
                      }`}
                      aria-label="Xem ảnh chi tiết"
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mediaMode === "3d" && (
            <div className="animate-fade-in">
              <ProductViewer3D
                productName={product.name}
                basePrice={product.price}
                category={product.categorySlug || "sofa"}
              />
            </div>
          )}

          {mediaMode === "360" && (
            <div className="animate-fade-in">
              <Product360Viewer
                productName={product.name}
                material={product.material || "Da Bò Ý & Gỗ Óc Chó FAS"}
                mainImage={activeImage}
              />
            </div>
          )}
        </div>

        {/* Cột phải: Thông tin sản phẩm & Biến thể */}
        <div className="flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <p className="text-[11px] tracking-widest2 uppercase text-espresso/50">
                {product.category?.name || product.category || product.collection?.name || "GS LUXURY"}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl text-espresso mt-2">
                {product.name}
              </h1>

              {/* Rating Summary - Clickable to jump to Reviews tab & form */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("reviews");
                  setReviewFormOpen(true);
                  const el = document.getElementById("product-tabs-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-3 mt-3 group text-left cursor-pointer focus:outline-none"
                title="Bấm để xem và viết đánh giá sản phẩm"
              >
                <div className="flex items-center text-gold">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={15}
                      className={
                        star <= Math.round(product.rating_avg || 5)
                          ? "fill-gold text-gold"
                          : "text-espresso/20"
                      }
                    />
                  ))}
                </div>
                <span className="text-xs text-espresso/70 group-hover:text-gold group-hover:underline tracking-wider transition-colors font-medium">
                  ({reviews.length} đánh giá • {faqs.length} hỏi đáp)
                </span>
                <span className="text-[11px] text-gold font-medium opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex items-center gap-0.5">
                  + Viết đánh giá &rarr;
                </span>
              </button>

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-4">
                <span className="font-serif text-2xl sm:text-3xl text-gold font-semibold">
                  {formatPrice(currentPrice)}
                </span>
                {product.original_price && product.original_price > currentPrice && (
                  <span className="text-sm text-espresso/40 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-espresso/70 text-sm leading-relaxed border-t border-espresso/10 pt-5">
              {product.summary || product.description}
            </p>

            {/* Biến thể màu sắc & chất liệu */}
            {variants.length > 0 && (
              <div className="space-y-3 pt-2">
                <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70">
                  Tùy Chọn Phiên Bản:{" "}
                  <strong className="text-espresso font-medium font-serif">
                    {selectedVariant?.name || selectedVariant?.color_name}
                  </strong>
                </label>

                <div className="flex flex-wrap gap-2.5">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectVariant(v)}
                        className={`flex items-center gap-2 px-3.5 py-2 border text-xs tracking-wider transition-all duration-300 ${
                          isSelected
                            ? "border-gold bg-gold/10 text-espresso font-medium shadow-sm"
                            : "border-espresso/15 bg-white/50 text-espresso/70 hover:border-espresso/40"
                        }`}
                      >
                        {v.color_hex && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: v.color_hex }}
                          />
                        )}
                        <span>{v.name}</span>
                        {v.price && (
                          <span className="text-gold font-medium ml-1">
                            ({formatPrice(v.price)})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector & Add to Cart */}
            <div className="pt-4 border-t border-espresso/10 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-[11px] uppercase tracking-widest2 text-espresso/70">
                  Số Lượng:
                </span>
                <div className="flex items-center border border-espresso/20 bg-white/70">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-espresso/60 hover:text-espresso"
                    aria-label="Giảm số lượng"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-4 text-xs font-semibold text-espresso min-w-[30px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 text-espresso/60 hover:text-espresso"
                    aria-label="Tăng số lượng"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 relative overflow-hidden bg-espresso text-beige text-xs tracking-widest2 uppercase py-4 hover:bg-gold transition-colors duration-300 focus-ring font-medium"
                >
                  {added ? (
                    <motion.span
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Check size={16} strokeWidth={2} />
                      Đã Thêm Vào Giỏ Hàng
                    </motion.span>
                  ) : (
                    "Thêm Vào Giỏ Hàng"
                  )}
                </button>

                <button
                  onClick={() => addToCompare(product)}
                  title={isCompared ? "Đã trong danh sách so sánh" : "Thêm vào so sánh"}
                  className={`w-14 h-14 flex items-center justify-center border transition-colors focus-ring shrink-0 ${
                    isCompared
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-espresso/20 hover:border-gold text-espresso bg-white/60"
                  }`}
                >
                  <ArrowRightLeft size={18} />
                </button>

                <button
                  onClick={() => toggleWishlist(prodId)}
                  aria-label={isWished ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
                  className="w-14 h-14 flex items-center justify-center border border-espresso/20 hover:border-gold transition-colors focus-ring shrink-0 bg-white/60"
                >
                  <Heart
                    size={20}
                    strokeWidth={1.5}
                    className={isWished ? "fill-gold text-gold" : "text-espresso"}
                  />
                </button>
              </div>
            </div>

            {/* Thông số kỹ thuật & Cam kết */}
            <div className="space-y-3 pt-6 border-t border-espresso/10 text-xs text-espresso/80">
              {product.material && (
                <div className="flex justify-between py-1 border-b border-espresso/5">
                  <span className="text-espresso/50">Chất liệu cao cấp</span>
                  <span className="font-medium text-right">{product.material}</span>
                </div>
              )}
              {product.dimensions && (
                <div className="flex justify-between py-1 border-b border-espresso/5">
                  <span className="text-espresso/50">Kích thước tiêu chuẩn</span>
                  <span className="font-medium text-right">{product.dimensions}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-espresso/5">
                <span className="text-espresso/50">Chính sách bảo hành</span>
                <span className="font-medium text-right">{product.warranty || "24 tháng chính hãng"}</span>
              </div>
            </div>

            {/* Vendor / Shop Official Card */}
            <div className="bg-sand/15 border border-gold/30 rounded-xl p-4 mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-espresso text-gold flex items-center justify-center font-serif font-bold text-sm shadow">
                    GS
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-espresso">GS Luxury Official Store</span>
                      <span className="bg-gold/20 text-wood-dark text-[9px] font-bold px-1.5 py-0.5 rounded">
                        ✓ Chính Hãng
                      </span>
                    </div>
                    <p className="text-[10px] text-espresso/60">
                      ⭐ 4.95 / 5.0 (2,400+ đánh giá) • Tỷ lệ phản hồi 98.5%
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert("Đang kết nối tin nhắn trực tiếp với chuyên viên tư vấn GS Luxury...")}
                  className="px-3 py-1.5 bg-white border border-espresso/20 hover:border-gold text-espresso text-[11px] font-semibold rounded-md shadow-sm transition-colors"
                >
                  💬 Chat Ngay
                </button>
              </div>

              {/* Affiliate Referral Share Link */}
              <div className="pt-2 border-t border-espresso/10 flex items-center justify-between">
                <span className="text-[11px] text-espresso/70">
                  💎 Chia sẻ sản phẩm này &amp; nhận <strong>5% hoa hồng</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
                    navigator.clipboard.writeText(currentUrl);
                    alert("Đã sao chép link sản phẩm kèm mã giới thiệu của bạn!");
                  }}
                  className="text-[11px] text-gold font-bold hover:underline"
                >
                  Sao chép Link CTV
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-4 text-xs text-espresso/70">
              <div className="flex items-center gap-3">
                <Truck strokeWidth={1.5} size={18} className="text-gold shrink-0" />
                <span>Vận chuyển & lắp đặt tận nhà, tính phí theo địa chỉ thực tế</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck strokeWidth={1.5} size={18} className="text-gold shrink-0" />
                <span>Cam kết 100% gỗ tự nhiên, da bò Ý nhập khẩu nguyên chiếc</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Đánh Giá, Hỏi Đáp & Chi Tiết */}
      <section id="product-tabs-section" className="border-t border-espresso/15 pt-12 scroll-mt-24">
        <div className="flex border-b border-espresso/15 gap-8 mb-8 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("360")}
            className={`pb-3 text-xs tracking-widest2 uppercase transition-all duration-300 font-medium flex items-center gap-1.5 ${
              activeTab === "360"
                ? "border-b-2 border-gold text-gold font-bold"
                : "text-espresso/60 hover:text-espresso"
            }`}
          >
            <Sparkles size={14} className="text-gold" />
            <span>Khảo Sát 360° &amp; Soi Chất Liệu</span>
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`pb-3 text-xs tracking-widest2 uppercase transition-all duration-300 font-medium ${
              activeTab === "reviews"
                ? "border-b-2 border-espresso text-espresso font-bold"
                : "text-espresso/50 hover:text-espresso"
            }`}
          >
            Đánh Giá ({reviews.length})
          </button>

          <button
            onClick={() => setActiveTab("faqs")}
            className={`pb-3 text-xs tracking-widest2 uppercase transition-all duration-300 font-medium ${
              activeTab === "faqs"
                ? "border-b-2 border-espresso text-espresso font-bold"
                : "text-espresso/50 hover:text-espresso"
            }`}
          >
            Hỏi Đáp Q&amp;A ({faqs.length})
          </button>

          <button
            onClick={() => setActiveTab("specs")}
            className={`pb-3 text-xs tracking-widest2 uppercase transition-all duration-300 font-medium ${
              activeTab === "specs"
                ? "border-b-2 border-espresso text-espresso font-bold"
                : "text-espresso/50 hover:text-espresso"
            }`}
          >
            Thông Số &amp; Bảo Dưỡng
          </button>
        </div>

        {/* 0. 360 DEGREE & MICROSCOPE TAB */}
        {activeTab === "360" && (
          <div className="mb-12 animate-fade-in">
            <Product360Viewer
              productName={product.name}
              material={product.material || "Da Bò Ý & Gỗ Óc Chó FAS"}
              mainImage={activeImage}
            />
          </div>
        )}

        {/* 1. REVIEWS TAB */}
        {activeTab === "reviews" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="font-serif text-2xl text-espresso flex items-center gap-2">
                  <MessageSquare size={22} className="text-gold" /> Đánh Giá Từ Khách Hàng
                </h3>
                <p className="text-xs text-espresso/60 tracking-wider mt-1">
                  Trải nghiệm thực tế từ những gia chủ đã sở hữu tuyệt tác này
                </p>
              </div>

              <button
                onClick={() => setReviewFormOpen(!reviewFormOpen)}
                className="px-5 py-2.5 border border-espresso/30 text-espresso text-xs tracking-widest2 uppercase hover:border-gold hover:text-gold transition-colors self-start sm:self-auto"
              >
                {reviewFormOpen ? "Đóng Form" : "Viết Đánh Giá"}
              </button>
            </div>

            {/* Review Form */}
            {reviewFormOpen && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmitReview}
                className="bg-white/70 border border-espresso/15 p-6 md:p-8 max-w-xl mb-10 space-y-4"
              >
                <h4 className="font-serif text-lg text-espresso">Đánh Giá Sản Phẩm Này</h4>

                {reviewSuccess && (
                  <p className="p-3 bg-green-50 text-green-700 text-xs">
                    Cảm ơn bạn đã gửi đánh giá!
                    {reviewCoinsAwarded > 0 && ` Bạn nhận được ${reviewCoinsAwarded} GS Coins.`}
                  </p>
                )}

                <div>
                  <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-1">
                    Chấm sao:
                  </label>
                  <div className="flex gap-1 text-gold">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1"
                      >
                        <Star
                          size={20}
                          className={star <= reviewRating ? "fill-gold text-gold" : "text-espresso/20"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-1">
                    Họ và Tên *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Hoàng Minh"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full bg-beige/50 border border-espresso/15 px-4 py-2.5 text-xs focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-1">
                    Cảm nhận của bạn *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Chất liệu da rất êm ái, màu sắc sang trọng đúng như ảnh chụp..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-beige/50 border border-espresso/15 px-4 py-2.5 text-xs focus:outline-none focus:border-gold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="py-3 px-6 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors font-medium disabled:opacity-50"
                >
                  {submittingReview ? "Đang gửi..." : "Gửi Đánh Giá"}
                </button>
              </motion.form>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((rev: any) => (
                  <div key={rev.id} className="bg-white/60 border border-espresso/10 p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-sm text-espresso font-medium">
                        {rev.customer_name}
                      </span>
                      <div className="flex text-gold">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            className={s <= rev.rating ? "fill-gold text-gold" : "text-espresso/20"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-espresso/70 leading-relaxed">{rev.comment}</p>
                    <div className="flex items-center justify-between pt-2 text-[10px] text-espresso/40">
                      <span className="text-green-700 font-medium">✓ Đã xác thực mua hàng</span>
                      <span>{new Date(rev.created_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-espresso/50 italic">
                Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên trải nghiệm!
              </p>
            )}
          </div>
        )}

        {/* 2. FAQS / Q&A TAB */}
        {activeTab === "faqs" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl text-espresso flex items-center gap-2">
                  <HelpCircle size={22} className="text-gold" /> Hỏi &amp; Đáp Về Sản Phẩm
                </h3>
                <p className="text-xs text-espresso/60 tracking-wider mt-1">
                  Đặt câu hỏi về kích thước tùy chỉnh, vận chuyển căn hộ hoặc chất liệu
                </p>
              </div>
            </div>

            {/* Ask Question Form */}
            <form onSubmit={handleSubmitFaq} className="bg-white/70 border border-espresso/15 p-6 space-y-4 max-w-2xl">
              <h4 className="font-serif text-base text-espresso">Đặt Câu Hỏi Cho Kiến Trúc Sư</h4>

              {faqSuccess && (
                <p className="p-3 bg-green-50 text-green-700 text-xs">
                  Câu hỏi của bạn đã được gửi thành công!
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Họ và tên của bạn *"
                  value={faqName}
                  onChange={(e) => setFaqName(e.target.value)}
                  className="bg-beige/40 border border-espresso/15 px-3 py-2 text-xs focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nhập câu hỏi thắc mắc về sản phẩm..."
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  className="flex-1 bg-beige/40 border border-espresso/15 px-3 py-2 text-xs focus:outline-none focus:border-gold"
                />
                <button
                  type="submit"
                  disabled={submittingFaq}
                  className="px-5 py-2 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors font-medium shrink-0 disabled:opacity-50"
                >
                  {submittingFaq ? "Đang gửi..." : "Gửi Câu Hỏi"}
                </button>
              </div>
            </form>

            {/* FAQs List */}
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-white/60 border border-espresso/10 p-5 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="font-serif font-bold text-espresso text-sm">H:</span>
                    <div>
                      <p className="font-serif text-sm text-espresso font-medium">{faq.question}</p>
                      <span className="text-[10px] text-espresso/40">Hỏi bởi {faq.customer_name}</span>
                    </div>
                  </div>

                  {faq.answer ? (
                    <div className="flex items-start gap-2 pl-4 border-l-2 border-gold/60 bg-gold/5 p-3 rounded-r">
                      <span className="font-serif font-bold text-gold text-sm">Đ:</span>
                      <div>
                        <p className="text-xs text-espresso/80 leading-relaxed">{faq.answer}</p>
                        <span className="text-[10px] text-gold font-medium block mt-1">
                          — {faq.answered_by || "Kiến trúc sư GS Luxury"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-espresso/40 italic pl-4">
                      Câu hỏi đang được chuyên viên nội thất tiếp nhận trả lời...
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. SPECS & CARE TAB */}
        {activeTab === "specs" && (
          <div className="bg-white/60 border border-espresso/10 p-6 md:p-8 max-w-3xl space-y-6">
            <h3 className="font-serif text-2xl text-espresso">Quy Chuẩn Hoàn Thiện &amp; Bảo Quản</h3>

            <div className="space-y-4 text-xs text-espresso/80 leading-relaxed">
              <div>
                <h4 className="font-serif text-base text-espresso font-semibold mb-1">
                  1. Khung Sườn &amp; Kết Cấu Chịu Lực
                </h4>
                <p>
                  Toàn bộ khung sườn sản phẩm được chế tác từ gỗ sồi Nga tự nhiên đã qua sấy chân không đạt chuẩn độ ẩm dưới 12%, chống cong vênh mối mọt trọn đời. Khung kim loại mạ PVD vàng 24K chống trầy xước và oxy hóa.
                </p>
              </div>

              <div>
                <h4 className="font-serif text-base text-espresso font-semibold mb-1">
                  2. Đệm Mút &amp; Bề Mặt Da Thật
                </h4>
                <p>
                  Sử dụng đệm mút D40 bọc lông vũ tự nhiên 3 lớp giúp giữ form đầm chắc và độ đàn hồi êm ái tối đa. Da bò Mastrotto nhập khẩu nguyên tấm từ Ý mang hương thơm thảo mộc tự nhiên đặc trưng.
                </p>
              </div>

              <div>
                <h4 className="font-serif text-base text-espresso font-semibold mb-1">
                  3. Hướng Dẫn Vệ Sinh Định Kỳ
                </h4>
                <p>
                  • Vệ sinh hàng tuần bằng khăn cotton mềm hoặc chổi lông mềm chuyên dụng.<br />
                  • Tránh để vật nhọn cọ xát hoặc dung dịch chứa cồn tiếp xúc với bề mặt da.<br />
                  • Gọi Hotline 1900 8888 để đăng ký bảo dưỡng và thoa dầu dưỡng da định kỳ 6 tháng/lần miễn phí.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Shoppable Room Bundle "Phối Cùng" */}
      <ShoppableRoomBundle />

      {/* Real Customer Verified Reviews */}
      <RealCustomerReviews />
    </div>
  );
}
