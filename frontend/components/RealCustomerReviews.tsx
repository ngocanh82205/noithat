"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, CheckCircle, ThumbsUp, Sparkles, MessageSquare, ShieldCheck } from "lucide-react";

type RealReview = {
  id: string;
  author: string;
  location: string;
  project: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  images: string[];
  likes: number;
  productName: string;
};

const REAL_REVIEWS: RealReview[] = [
  {
    id: "rev-1",
    author: "Anh Hoàng Minh",
    location: "Penthouse The Centennial, Ba Son, Q.1, TP.HCM",
    project: "Căn hộ Penthouse 380m²",
    rating: 5,
    date: "12/02/2026",
    title: "Chất da Tuscan siêu êm, màu Cognac đẹp hơn cả ảnh chụp showroom",
    content:
      "Gia đình mình đặt trọn bộ sofa góc L da bò Ý và bàn trà cẩm thạch Carrara. Đội ngũ kỹ sư của GS Luxury đến tận nhà lắp ráp cực kỳ cẩn thận, bọc lót sàn không để lại một vết xước. Da mềm, mùi thơm tự nhiên thảo mộc rất quý phái.",
    images: ["/images/sofa-2.jpg", "/images/sofa-1.jpg"],
    likes: 42,
    productName: "Sofa Góc L Da Bò Ý Tuscan Cognac",
  },
  {
    id: "rev-2",
    author: "Chị Thảo Linh & Anh Tuấn",
    location: "Biệt thự Đảo Ecopark Grand The Island, Hưng Yên",
    project: "Biệt thự Đơn Lập 550m²",
    rating: 5,
    date: "28/01/2026",
    title: "Bàn ăn dát vàng và ghế bọc nhung là tâm điểm của mọi bữa tiệc",
    content:
      "Mỗi lần bạn bè đối tác đến dùng bữa đều trầm trồ khen ngợi bộ bàn ăn mạ PVD vàng của GS Luxury. Khung kim loại sáng bóng vĩnh cửu, đệm ghế ngồi 3 tiếng không hề ê mỏi. Rất xứng đáng từng đồng chi phí đầu tư.",
    images: ["/images/dining-table-1.jpg", "/images/dining-table-2.webp"],
    likes: 38,
    productName: "Bàn Ăn 8 Ghế Mạ Vàng PVD Hoàng Gia",
  },
  {
    id: "rev-3",
    author: "KTS. Lê Quang Dũng",
    location: "Vinhomes Riverside, Long Biên, Hà Nội",
    project: "Khu đô thị sinh thái cao cấp",
    rating: 5,
    date: "05/01/2026",
    title: "Chất lượng hoàn thiện chuẩn thủ công Ý, độ chính xác tuyệt đối",
    content:
      "Là kiến trúc sư thiết kế biệt thự cho khách hàng VIP, tôi cực kỳ khắt khe về đường may và độ hoàn thiện vân gỗ óc chó. GS Luxury đã đáp ứng vượt kỳ vọng của tôi và chủ nhà từ khâu 3D đến khi bàn giao thực tế.",
    images: ["/images/bed-1.jpg", "/images/hero-banner.jpg"],
    likes: 65,
    productName: "Giường Ngủ Master Gỗ Óc Chó FAS",
  },
];

export default function RealCustomerReviews() {
  const [likesState, setLikesState] = useState<{ [id: string]: number }>(
    REAL_REVIEWS.reduce((acc, r) => ({ ...acc, [r.id]: r.likes }), {})
  );
  const [hasLiked, setHasLiked] = useState<{ [id: string]: boolean }>({});

  const handleLike = (id: string) => {
    if (hasLiked[id]) return;
    setLikesState((prev) => ({ ...prev, [id]: prev[id] + 1 }));
    setHasLiked((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section className="py-20 md:py-28 bg-[#F8F5EE] border-t border-espresso/10">
      <div className="mx-auto max-w-[1360px] px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center space-x-2 text-gold text-xs font-bold uppercase tracking-widest2 mb-3">
              <ShieldCheck size={16} />
              <span>Đánh Giá Độc Bản &amp; Ảnh Thực Tế</span>
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-espresso max-w-2xl leading-tight">
              Không Gian Thật, Cảm Xúc Thật Từ Những Gia Chủ Thượng Lưu
            </h2>
          </div>
          <p className="text-xs md:text-sm text-espresso/70 max-w-md font-light leading-relaxed">
            100% hình ảnh được chụp thực tế tại các căn Penthouse, Villa cao cấp sau khi hoàn thiện bàn giao nội thất White-Glove.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {REAL_REVIEWS.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-gold/30 rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between space-y-6 hover:border-gold transition-colors"
            >
              {/* Review Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-serif font-bold text-base text-espresso">
                        {review.author}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">
                        <CheckCircle size={11} /> Đã Bàn Giao
                      </span>
                    </div>
                    <p className="text-[11px] text-espresso/60 mt-0.5 line-clamp-1">
                      {review.location}
                    </p>
                  </div>

                  <div className="flex text-gold shrink-0">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={14} className="fill-gold" />
                    ))}
                  </div>
                </div>

                {/* Real Photos Gallery */}
                <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden aspect-[16/9]">
                  {review.images.map((imgSrc, idx) => (
                    <div key={idx} className="relative w-full h-full bg-sand/30">
                      <Image
                        src={imgSrc}
                        alt={`Ảnh thực tế từ ${review.author}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>

                {/* Review Content */}
                <div className="space-y-2">
                  <h5 className="font-serif font-bold text-sm text-espresso leading-snug">
                    &ldquo;{review.title}&rdquo;
                  </h5>
                  <p className="text-xs text-espresso/70 leading-relaxed font-light">
                    {review.content}
                  </p>
                </div>
              </div>

              {/* Review Footer */}
              <div className="pt-4 border-t border-espresso/10 flex items-center justify-between text-xs">
                <span className="text-[11px] text-espresso/50 font-mono">{review.date}</span>

                <button
                  onClick={() => handleLike(review.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                    hasLiked[review.id]
                      ? "bg-gold/15 border-gold text-gold font-bold"
                      : "border-espresso/15 text-espresso/70 hover:border-gold hover:text-gold"
                  }`}
                >
                  <ThumbsUp size={12} />
                  <span>Hữu ích ({likesState[review.id]})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
