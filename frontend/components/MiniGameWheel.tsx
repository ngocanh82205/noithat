"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X, Sparkles, Trophy, Coins, Clock, AlertCircle } from "lucide-react";
import { useStore } from "./StoreContext";
import { rewardService } from "@/services/api";

// 8 ô — thứ tự & giải thưởng phải khớp LuckyWheelController::SEGMENTS ở backend.
// Server quyết định ô trúng; frontend chỉ quay tới đúng ô đó.
const WHEEL_SEGMENTS = [
  { id: 0, label: "MAY MẮN", coins: 0, color: "#2C2C2C" },
  { id: 1, label: "+10 XU", coins: 10, color: "#D4AF37" },
  { id: 2, label: "+20 XU", coins: 20, color: "#3E2723" },
  { id: 3, label: "MAY MẮN", coins: 0, color: "#1A1A1A" },
  { id: 4, label: "+50 XU", coins: 50, color: "#2E7D32" },
  { id: 5, label: "+10 XU", coins: 10, color: "#242424" },
  { id: 6, label: "+100 XU", coins: 100, color: "#4A2E18" },
  { id: 7, label: "+200 XU", coins: 200, color: "#181818" },
];

const SPIN_DURATION_MS = 4200;

export default function MiniGameWheel() {
  const { isWheelOpen, closeWheel, isAuthenticated, openAuth, refreshProfile } = useStore();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<(typeof WHEEL_SEGMENTS)[number] | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Lượt quay trong ngày do server quản lý (theo tài khoản)
  useEffect(() => {
    if (!isWheelOpen) return;
    setErrorMsg("");
    if (!isAuthenticated) {
      setHasSpunToday(false);
      return;
    }
    rewardService
      .getSpinStatus()
      .then((res) => {
        if (res.success && res.data) setHasSpunToday(!res.data.can_spin);
      })
      .catch(() => {});
  }, [isWheelOpen, isAuthenticated]);

  const handleSpin = async () => {
    if (spinning || hasSpunToday) return;

    if (!isAuthenticated) {
      closeWheel();
      openAuth("login");
      return;
    }

    setSpinning(true);
    setWonPrize(null);
    setErrorMsg("");

    let res;
    try {
      res = await rewardService.spin();
    } catch {
      res = null;
    }

    if (!res || !res.success || !res.data) {
      setSpinning(false);
      if (res && (res as any).status === 429) setHasSpunToday(true);
      setErrorMsg(res?.message || "Không thể quay thưởng lúc này. Vui lòng thử lại sau.");
      return;
    }

    const selectedSegmentIndex = res.data.segment_index;
    const numSegments = WHEEL_SEGMENTS.length; // 8
    const segmentAngle = 360 / numSegments; // 45 deg

    // Rotation calculation: 6 full rounds (2160 deg) + target angle
    const extraRounds = 6 * 360;
    // Align with top pin: 360 - (index * 45 + 22.5)
    const targetOffset = 360 - (selectedSegmentIndex * segmentAngle + segmentAngle / 2);
    const newTotalRotation = rotation + extraRounds + targetOffset - (rotation % 360);

    setRotation(newTotalRotation);

    setTimeout(() => {
      setSpinning(false);
      setWonPrize(WHEEL_SEGMENTS[selectedSegmentIndex] ?? WHEEL_SEGMENTS[0]);
      setHasSpunToday(true);
      // Đồng bộ số dư xu từ server
      refreshProfile();
    }, SPIN_DURATION_MS);
  };

  if (!isWheelOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeWheel}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-md bg-beige border border-gold/40 shadow-2xl p-6 sm:p-8 text-center z-10 rounded-3xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={closeWheel}
            className="absolute top-4 right-4 p-2 text-espresso/60 hover:text-espresso rounded-full hover:bg-black/5 transition-colors"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>

          {/* Title & Rules */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="text-gold" size={24} />
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Vòng Quay May Mắn GS
            </h2>
          </div>
          <p className="text-xs text-espresso/70 tracking-wider">
            Mỗi khách hàng được nhận <strong>1 lượt quay / ngày</strong>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-800 font-medium mt-1">
            <Clock size={13} />
            <span>Trúng tới 200 GS Coins (1 Xu = 1.000₫)</span>
          </div>

          {/* Wheel Graphic */}
          <div className="relative w-64 h-64 mx-auto my-6 flex items-center justify-center">
            {/* Top Pointer Pin */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-red-600 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />

            {/* Spinning Circle with 8 Slices */}
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 4.2, ease: [0.15, 0.9, 0.2, 1] }}
              className="w-full h-full rounded-full border-4 border-gold shadow-2xl relative overflow-hidden flex items-center justify-center"
              style={{
                background:
                  "conic-gradient(#2C2C2C 0deg 45deg, #D4AF37 45deg 90deg, #3E2723 90deg 135deg, #1A1A1A 135deg 180deg, #2E7D32 180deg 225deg, #242424 225deg 270deg, #4A2E18 270deg 315deg, #181818 315deg 360deg)",
              }}
            >
              {/* Segment Labels Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {WHEEL_SEGMENTS.map((seg, i) => {
                  const angle = i * 45 + 22.5;
                  return (
                    <div
                      key={seg.id}
                      className="absolute top-1/2 left-1/2 w-28 h-6 -translate-y-1/2 origin-left text-[10px] font-serif font-bold tracking-wider text-beige text-right pr-3"
                      style={{
                        transform: `rotate(${angle}deg)`,
                        color: seg.coins > 0 ? "#FFE57F" : "#D4D4D4",
                      }}
                    >
                      {seg.label}
                    </div>
                  );
                })}
              </div>

              {/* Center Hub */}
              <div className="w-14 h-14 rounded-full bg-beige border-2 border-gold flex items-center justify-center shadow-2xl z-10">
                <Gift className="text-gold" size={20} />
              </div>
            </motion.div>
          </div>

          {/* Result Notification */}
          {wonPrize && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl my-4 text-xs space-y-1 border ${
                wonPrize.coins > 0
                  ? "bg-green-50 border-green-300 text-green-900"
                  : "bg-espresso/5 border-espresso/15 text-espresso"
              }`}
            >
              {wonPrize.coins > 0 ? (
                <>
                  <div className="flex items-center justify-center gap-1.5 font-serif text-base text-gold font-bold">
                    <Sparkles size={18} /> Chúc Mừng Quý Khách!
                  </div>
                  <p className="font-semibold text-sm flex items-center justify-center gap-1.5 text-green-800">
                    <Coins size={15} /> Bạn đã trúng {wonPrize.coins} GS Coins!
                  </p>
                  <p className="text-[11px] text-green-700">
                    Xu đã được cộng vào ví, dùng để giảm trực tiếp khi thanh toán.
                  </p>
                </>
              ) : (
                <>
                  <div className="font-serif text-sm font-bold text-espresso">
                    🍀 Chúc bạn may mắn lần sau!
                  </div>
                  <p className="text-[11px] text-espresso/70">
                    Cảm ơn quý khách đã tham gia. Hãy quay lại vào ngày mai sau 00:00 để thử lại vận may nhé.
                  </p>
                </>
              )}
            </motion.div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl my-3 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Daily Limit Warning if already spun */}
          {hasSpunToday && !wonPrize && !errorMsg && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl my-3 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>Hôm nay bạn đã sử dụng hết lượt quay. Lượt quay mới sẽ mở lại vào ngày mai!</span>
            </div>
          )}

          {/* Spin Button */}
          <button
            onClick={handleSpin}
            disabled={spinning || hasSpunToday}
            className="w-full py-4 bg-espresso text-champagne text-xs font-serif tracking-widest2 uppercase hover:bg-gold hover:text-charcoal transition-all duration-300 font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {!isAuthenticated
              ? "Đăng Nhập Để Quay Thưởng"
              : spinning
              ? "Đang Quay Thưởng..."
              : hasSpunToday
              ? "Hôm Nay Đã Quay (Hẹn Gặp Lại Ngày Mai)"
              : "Quay Thưởng (1 Lượt Hôm Nay)"}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
