"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ShoppingBag,
  RotateCcw,
  Minimize2,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import { aiService, ApiProduct } from "@/services/api";
import { formatPrice } from "@/lib/products";
import { useStore } from "./StoreContext";

type Message = {
  id: string;
  sender: "ai" | "user";
  text: string;
  products?: ApiProduct[];
  timestamp: string;
};

const QUICK_PROMPTS = [
  "Tìm sofa da bò Ý dưới 50 triệu",
  "Tư vấn bàn ăn gỗ sồi 6 ghế",
  "Chính sách bảo hành & bảo dưỡng",
  "Dịch vụ giao hàng White-Glove",
  "Tra cứu đơn hàng GSL-2026",
];

export default function AiShoppingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Kính chào Quý khách! Em là Trợ lý AI của GS Luxury. Em có thể hỗ trợ Quý khách tìm kiếm nội thất theo phong cách, diện tích phòng, khoảng giá hoặc tra cứu trạng thái đơn hàng.",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const { addToCart } = useStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input.trim();
    if (!messageText || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await aiService.chat(messageText);
      if (res.success && res.data) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: res.data.reply,
          products: res.data.products || [],
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "Dạ, em đang kết nối lại với hệ thống dữ liệu. Quý khách vui lòng thử lại hoặc gọi Hotline 1900 8888 để gặp KTS tư vấn ngay ạ!",
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Concierge AI Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-3 px-4 py-3.5 bg-charcoal text-champagne border border-gold/40 shadow-2xl rounded-full group overflow-hidden focus-ring"
          aria-label="Mở Trợ lý AI GS Luxury"
        >
          {/* Glowing pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-gold/20 animate-pulse pointer-events-none" />

          <div className="w-8 h-8 rounded-full bg-gold text-charcoal flex items-center justify-center shrink-0">
            <Sparkles size={16} className="animate-spin-slow" />
          </div>

          <div className="text-left hidden sm:block pr-1">
            <span className="block text-[10px] tracking-widest2 uppercase text-gold font-medium">
              AI Concierge 24/7
            </span>
            <span className="block font-serif text-xs text-beige">
              Tư Vấn Không Gian
            </span>
          </div>
        </motion.button>
      </div>

      {/* Chat Window Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[600px] max-h-[85vh] bg-beige border border-espresso/20 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-charcoal text-beige p-4 flex items-center justify-between border-b border-gold/30">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gold text-charcoal flex items-center justify-center font-bold">
                    <Sparkles size={18} />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-charcoal" />
                </div>
                <div>
                  <h3 className="font-serif text-sm text-champagne tracking-wide">
                    GS Luxury AI Concierge
                  </h3>
                  <p className="text-[10px] text-beige/60 tracking-wider">
                    Trợ lý thiết kế &amp; tìm kiếm sản phẩm thông minh
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-beige/60 hover:text-champagne transition-colors"
                aria-label="Đóng chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-beige/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] ${
                      msg.sender === "user"
                        ? "bg-espresso text-beige"
                        : "bg-gold text-charcoal font-bold"
                    }`}
                  >
                    {msg.sender === "user" ? <User size={13} /> : <Bot size={13} />}
                  </div>

                  <div
                    className={`max-w-[82%] p-3.5 text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-espresso text-beige rounded-2xl rounded-tr-sm"
                        : "bg-white/80 border border-espresso/10 text-espresso rounded-2xl rounded-tl-sm shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Embedded Product Cards in AI Reply */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-espresso/10 pt-3">
                        <span className="text-[10px] uppercase tracking-widest2 text-gold font-medium block">
                          Sản phẩm gợi ý:
                        </span>
                        {msg.products.map((p) => {
                          const imgUrl =
                            p.images?.[0]?.image_url || (p as any).image || "/images/sofa-1.jpg";

                          return (
                            <div
                              key={p.id}
                              className="flex items-center gap-3 p-2 bg-beige/60 border border-espresso/10 rounded-lg hover:border-gold transition-colors"
                            >
                              <div className="relative w-12 h-12 rounded overflow-hidden shrink-0 bg-white">
                                <Image src={imgUrl} alt={p.name} fill className="object-cover" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-serif text-xs text-espresso truncate">
                                  {p.name}
                                </h4>
                                <p className="text-[11px] text-gold font-medium">
                                  {formatPrice(p.price)}
                                </p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Link
                                  href={`/products/${p.slug || p.id}`}
                                  className="p-1.5 text-espresso/60 hover:text-gold"
                                  title="Xem chi tiết"
                                >
                                  <ExternalLink size={14} />
                                </Link>
                                <button
                                  onClick={() => addToCart(p)}
                                  className="p-1.5 bg-espresso text-beige hover:bg-gold transition-colors rounded text-[10px]"
                                  title="Thêm vào giỏ"
                                >
                                  <ShoppingBag size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <span className="block text-[9px] text-espresso/40 text-right mt-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-espresso/60 italic p-2 bg-white/50 rounded-xl max-w-[160px]">
                  <Sparkles size={14} className="animate-spin text-gold" />
                  <span>AI đang phân tích...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-3 py-2 bg-white/40 border-t border-espresso/10 overflow-x-auto no-scrollbar flex gap-2">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 bg-white border border-espresso/15 text-[10px] text-espresso/80 hover:border-gold hover:text-gold transition-colors shrink-0 rounded-full"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-espresso/10 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Hỏi AI về chất liệu, kích thước, khoảng giá..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-beige/40 border border-espresso/15 px-3 py-2 text-xs text-espresso focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 bg-espresso text-beige hover:bg-gold transition-colors disabled:opacity-40"
                aria-label="Gửi tin nhắn"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
