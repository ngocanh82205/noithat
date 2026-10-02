"use client";

import { useEffect, useState } from "react";
import {
  HelpCircle,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  Send,
  Sparkles,
} from "lucide-react";
import { adminService, ApiFaq } from "@/services/api";

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<ApiFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unanswered">("all");

  // Reply Modal
  const [selectedFaq, setSelectedFaq] = useState<ApiFaq | null>(null);
  const [replyText, setReplyText] = useState("");
  const [answeredBy, setAnsweredBy] = useState("Kiến trúc sư GS Luxury");
  const [submitting, setSubmitting] = useState(false);

  const loadFaqs = () => {
    setLoading(true);
    adminService
      .getFaqs(filter === "unanswered" ? "unanswered" : undefined)
      .then((res) => {
        if (res.success && res.data) {
          setFaqs(res.data);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadFaqs();
  }, [filter]);

  const handleOpenReply = (faq: ApiFaq) => {
    setSelectedFaq(faq);
    setReplyText(faq.answer || "");
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaq || !replyText.trim()) return;

    setSubmitting(true);
    try {
      const res = await adminService.answerFaq(selectedFaq.id, {
        answer: replyText.trim(),
        answered_by: answeredBy,
      });

      if (res.success) {
        setSelectedFaq(null);
        loadFaqs();
      } else {
        alert(res.message || "Không thể gửi câu trả lời");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi khi gửi câu trả lời");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;

    try {
      const res = await adminService.deleteFaq(id);
      if (!res.success) {
        alert(res.message || "Không thể xóa câu hỏi");
        return;
      }
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      alert(err.message || "Không thể xóa câu hỏi");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl text-champagne flex items-center gap-2.5">
            <HelpCircle className="text-gold" size={26} /> Hỏi Đáp &amp; CSKH ({faqs.length})
          </h1>
          <p className="text-xs text-beige/60 tracking-wider mt-1">
            Duyệt và phản hồi thắc mắc của khách hàng về sản phẩm và thiết kế
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-gold text-charcoal"
                : "bg-charcoal text-beige/70 border border-white/10"
            }`}
          >
            Tất Cả
          </button>
          <button
            onClick={() => setFilter("unanswered")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              filter === "unanswered"
                ? "bg-gold text-charcoal"
                : "bg-charcoal text-beige/70 border border-white/10"
            }`}
          >
            Chưa Trả Lời
          </button>
        </div>
      </div>

      {/* FAQs List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-beige/50">
          Đang tải danh sách câu hỏi...
        </div>
      ) : faqs.length > 0 ? (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-charcoal border border-white/10 p-5 rounded-xl space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-champagne font-serif">
                      {faq.customer_name}
                    </span>
                    <span className="text-[10px] text-beige/40">
                      • {new Date(faq.created_at).toLocaleDateString("vi-VN")}
                    </span>
                    {faq.product && (
                      <span className="text-[10px] text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                        {faq.product.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-beige mt-2 font-medium">
                    Hỏi: {faq.question}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenReply(faq)}
                    className="px-3 py-1.5 bg-gold/20 hover:bg-gold text-gold hover:text-charcoal transition-colors rounded text-xs font-medium"
                  >
                    {faq.answer ? "Sửa Trả Lời" : "Trả Lời Ngay"}
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="p-1.5 text-beige/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {faq.answer ? (
                <div className="bg-black/30 p-3 rounded-lg border-l-2 border-gold text-xs text-beige/80 space-y-1">
                  <p className="font-semibold text-gold text-[11px]">
                    {faq.answered_by || "Kiến trúc sư GS Luxury"}:
                  </p>
                  <p>{faq.answer}</p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-yellow-400/80">
                  <Clock size={12} />
                  <span>Đang chờ giải đáp</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-beige/40 bg-charcoal rounded-xl border border-white/10">
          Hiện tại không có câu hỏi nào trong mục này.
        </div>
      )}

      {/* Reply Modal */}
      {selectedFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-espresso border border-gold/30 rounded-xl w-full max-w-lg p-6 text-beige shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="font-serif text-lg text-champagne flex items-center gap-2">
                <Sparkles size={16} className="text-gold" /> Trả Lời Câu Hỏi Của Khách Hàng
              </h2>
              <button
                onClick={() => setSelectedFaq(null)}
                className="p-1 text-beige/50 hover:text-beige"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-black/40 rounded border border-white/10 text-xs">
              <span className="text-[10px] text-beige/50 uppercase block">
                Câu hỏi của {selectedFaq.customer_name}:
              </span>
              <p className="mt-1 font-serif text-champagne">{selectedFaq.question}</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider text-beige/70 mb-1">
                  Người Trả Lời
                </label>
                <input
                  type="text"
                  value={answeredBy}
                  onChange={(e) => setAnsweredBy(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 px-3 py-2 text-beige rounded focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-beige/70 mb-1">
                  Nội Dung Phản Hồi *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Dạ chào anh/chị, mẫu sofa này có thể tùy biến kích thước theo bản vẽ của căn hộ..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 px-3 py-2 text-beige rounded focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedFaq(null)}
                  className="px-4 py-2 border border-white/20 text-xs uppercase hover:bg-white/5 rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="px-5 py-2 bg-gold text-charcoal font-semibold text-xs uppercase tracking-wider hover:bg-champagne transition-colors rounded disabled:opacity-50"
                >
                  {submitting ? "Đang Gửi..." : "Đăng Câu Trả Lời"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
