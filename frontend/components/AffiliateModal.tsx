"use client";

import { useState, useEffect } from "react";
import { useStore } from "./StoreContext";
import { affiliateService, AffiliateStats, WithdrawalRecord } from "@/services/api";

// Mini bar chart component
function MiniBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full ${d.color} rounded-t-sm transition-all duration-700`}
            style={{ height: `${(d.value / max) * 52}px`, minHeight: d.value > 0 ? "4px" : "0" }}
          />
          <span className="text-[8px] text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const cfg = {
    approved: { label: "✓ Khả dụng", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    paid: { label: "✓ Đã thanh toán", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    pending: { label: "⏳ Chờ duyệt", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    rejected: { label: "✕ Từ chối", cls: "bg-red-50 text-red-700 border-red-200" },
  }[status] || { label: status, cls: "bg-gray-50 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

const BANKS = [
  "Vietcombank", "MBBank (Quân Đội)", "Techcombank", "BIDV",
  "VietinBank", "ACB", "VPBank", "TPBank", "Agribank",
];

export default function AffiliateModal() {
  const { isAffiliateOpen, closeAffiliate, user, isAuthenticated, openAuth } = useStore();
  const [activeTab, setActiveTab] = useState<"overview" | "commissions" | "withdraw" | "history">("overview");
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [withdrawHistory, setWithdrawHistory] = useState<WithdrawalRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Withdraw form state
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [bankName, setBankName] = useState<string>("Vietcombank");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountHolder, setAccountHolder] = useState<string>("");
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  useEffect(() => {
    if (isAffiliateOpen && isAuthenticated) {
      setIsLoading(true);
      affiliateService.getStats()
        .then((res) => { if (res.success) setStats(res.data); })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isAffiliateOpen, isAuthenticated]);

  useEffect(() => {
    if (activeTab === "history" && isAuthenticated) {
      setHistoryLoading(true);
      affiliateService.getWithdrawalHistory()
        .then((res) => {
          if (res.success && res.data) setWithdrawHistory(res.data.data || []);
        })
        .catch(console.error)
        .finally(() => setHistoryLoading(false));
    }
  }, [activeTab, isAuthenticated]);

  if (!isAffiliateOpen) return null;

  const handleCopyLink = () => {
    if (stats?.referral_link) {
      navigator.clipboard.writeText(stats.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 200000) {
      setWithdrawMsg({ type: "error", text: "Số tiền rút tối thiểu là 200.000 VNĐ." });
      return;
    }
    if (amount > (stats?.available_balance || 0)) {
      setWithdrawMsg({ type: "error", text: `Số dư khả dụng chỉ còn ${(stats?.available_balance || 0).toLocaleString("vi-VN")} đ.` });
      return;
    }
    setWithdrawSubmitting(true);
    setWithdrawMsg(null);
    try {
      const res = await affiliateService.requestWithdrawal({ amount, bank_name: bankName, account_number: accountNumber, account_holder: accountHolder });
      if (res.success) {
        setWithdrawMsg({ type: "success", text: res.message || "Yêu cầu rút tiền đã được gửi thành công!" });
        setWithdrawAmount("");
        setAccountNumber("");
        setAccountHolder("");
        // Refresh stats
        affiliateService.getStats().then((r) => { if (r.success) setStats(r.data); });
      } else {
        setWithdrawMsg({ type: "error", text: res.message || "Có lỗi xảy ra." });
      }
    } catch {
      setWithdrawMsg({ type: "error", text: "Kết nối thất bại, vui lòng thử lại." });
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  // Build chart data from commissions (last 6)
  const chartData = (stats?.commissions || []).slice(0, 6).reverse().map((c, i) => ({
    label: `#${i + 1}`,
    value: c.commission_amount,
    color: c.status === "paid" ? "bg-blue-400" : c.status === "approved" ? "bg-emerald-400" : "bg-amber-400",
  }));

  const availablePct = stats
    ? Math.round((stats.available_balance / Math.max(stats.available_balance + stats.total_earned, 1)) * 100)
    : 0;

  const TABS = [
    { key: "overview", label: "📊 Tổng Quan" },
    { key: "commissions", label: "💰 Lịch Sử Hoa Hồng" },
    { key: "withdraw", label: "🏦 Rút Tiền" },
    { key: "history", label: "📋 Yêu Cầu Rút" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeAffiliate}>
      <div
        className="bg-white text-wood-dark w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gold/30"
        style={{ animation: "scaleUp 0.2s ease" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/60 to-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center text-lg">💎</div>
            <div>
              <h2 className="text-lg font-serif font-bold text-wood-dark leading-tight">
                Chương Trình Đối Tác & CTV GS Luxury
              </h2>
              <p className="text-[11px] text-gray-500">Chia sẻ phong cách sống · Nhận 5% hoa hồng mỗi đơn hàng</p>
            </div>
          </div>
          <button onClick={closeAffiliate} className="p-2 text-gray-400 hover:text-wood-dark hover:bg-gray-100 rounded-full transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!isAuthenticated ? (
            <div className="text-center py-14 px-6 space-y-4">
              <div className="w-16 h-16 bg-gold/10 text-4xl rounded-full flex items-center justify-center mx-auto">🔒</div>
              <h3 className="text-lg font-serif font-bold text-wood-dark">Tham gia mạng lưới CTV GS Luxury</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">Đăng nhập để nhận Mã giới thiệu cá nhân và bắt đầu tích lũy hoa hồng ngay hôm nay.</p>
              <button
                onClick={() => { closeAffiliate(); openAuth("login"); }}
                className="px-6 py-2.5 bg-gold hover:bg-amber-600 text-white rounded-xl font-semibold shadow-md transition-all"
              >
                Đăng nhập ngay
              </button>
            </div>
          ) : isLoading ? (
            <div className="py-16 flex justify-center">
              <div className="w-10 h-10 border-3 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Tab Bar */}
              <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                      activeTab === tab.key
                        ? "border-gold text-gold bg-white"
                        : "border-transparent text-gray-500 hover:text-wood-dark hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-5">
                {/* ===== OVERVIEW TAB ===== */}
                {activeTab === "overview" && (
                  <>
                    {/* 4 Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Hoa hồng khả dụng", value: (stats?.available_balance || 0).toLocaleString("vi-VN") + " đ", accent: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
                        { label: "Đã thanh toán", value: (stats?.total_earned || 0).toLocaleString("vi-VN") + " đ", accent: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                        { label: "Đơn hàng giới thiệu", value: (stats?.total_orders_referred || 0) + " đơn", accent: "text-wood-dark", bg: "bg-sand/20 border-sand/40" },
                        { label: "Lượt nhấp link", value: (stats?.clicks_count || 0) + " lượt", accent: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
                      ].map((c) => (
                        <div key={c.label} className={`p-3 rounded-xl border ${c.bg}`}>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">{c.label}</div>
                          <div className={`text-sm font-bold mt-1.5 ${c.accent}`}>{c.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Progress Bar */}
                    <div className="p-4 bg-gradient-to-r from-sand/20 to-amber-50/30 rounded-xl border border-sand/30">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Tỉ lệ hoa hồng khả dụng</span>
                        <span className="font-bold text-wood-dark">{availablePct}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold to-amber-400 rounded-full transition-all duration-1000"
                          style={{ width: `${availablePct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                        <span>Khả dụng: {(stats?.available_balance || 0).toLocaleString("vi-VN")} đ</span>
                        <span>Đã nhận: {(stats?.total_earned || 0).toLocaleString("vi-VN")} đ</span>
                      </div>
                    </div>

                    {/* Mini chart */}
                    {chartData.length > 0 && (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Hoa hồng gần nhất</p>
                        <MiniBarChart data={chartData} />
                        <div className="flex gap-3 mt-2 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" />Khả dụng</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400 inline-block" />Đã thanh toán</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />Đang chờ</span>
                        </div>
                      </div>
                    )}

                    {/* Referral Link */}
                    <div className="p-4 bg-gradient-to-br from-sand/20 to-white rounded-xl border border-gold/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-wood-dark uppercase tracking-wider">Link giới thiệu của bạn:</label>
                        <span className="text-[11px] bg-gold/15 text-wood-dark px-2.5 py-0.5 rounded-full font-semibold">💎 Hoa hồng 5%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={stats?.referral_link || `http://localhost:3000?ref=${user?.referral_code || "GS-VIP"}`}
                          className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-600 outline-none select-all"
                        />
                        <button
                          onClick={handleCopyLink}
                          className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all whitespace-nowrap ${
                            copied ? "bg-emerald-500 text-white" : "bg-gold hover:bg-amber-600 text-white"
                          }`}
                        >
                          {copied ? "✓ Đã sao chép" : "Sao chép"}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 italic">
                        💡 Đăng link lên mạng xã hội, gửi cho bạn bè. Mỗi đơn mua thành công = bạn nhận ngay 5%!
                      </p>
                    </div>

                    {/* Quick action */}
                    <button
                      onClick={() => setActiveTab("withdraw")}
                      className="w-full py-2.5 bg-wood-dark hover:bg-black text-white text-sm font-semibold rounded-xl transition-colors shadow"
                    >
                      🏦 Rút hoa hồng về ngân hàng →
                    </button>
                  </>
                )}

                {/* ===== COMMISSIONS TAB ===== */}
                {activeTab === "commissions" && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">10 hoa hồng gần nhất từ đơn hàng được giới thiệu.</p>
                    {(stats?.commissions || []).length === 0 ? (
                      <div className="py-10 text-center text-gray-400">
                        <div className="text-3xl mb-2">📭</div>
                        <p className="text-sm">Chưa có hoa hồng nào</p>
                        <p className="text-xs mt-1">Chia sẻ link giới thiệu để bắt đầu!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stats!.commissions.map((c, i) => (
                          <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gold/30 transition-all">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-mono text-gray-400 w-5">#{i + 1}</span>
                              <div>
                                <p className="text-xs font-semibold text-wood-dark">
                                  Đơn hàng: {c.order_amount.toLocaleString("vi-VN")} đ
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {new Date(c.created_at).toLocaleDateString("vi-VN")}
                                </p>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="text-sm font-bold text-emerald-600">+{c.commission_amount.toLocaleString("vi-VN")} đ</p>
                              <StatusBadge status={c.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ===== WITHDRAW TAB ===== */}
                {activeTab === "withdraw" && (
                  <div className="space-y-4">
                    {/* Balance reminder */}
                    <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="text-xs text-emerald-700">
                        <p className="font-bold">Số dư khả dụng</p>
                        <p className="text-[10px] text-emerald-600">Hoa hồng đã được duyệt, sẵn sàng rút</p>
                      </div>
                      <span className="text-lg font-bold text-emerald-600 font-mono">
                        {(stats?.available_balance || 0).toLocaleString("vi-VN")} đ
                      </span>
                    </div>

                    {withdrawMsg && (
                      <div className={`p-3 text-xs rounded-xl border ${
                        withdrawMsg.type === "success"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {withdrawMsg.text}
                      </div>
                    )}

                    <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                      <h4 className="text-sm font-bold text-wood-dark border-b pb-2">Thông tin tài khoản nhận tiền</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-gray-600 font-medium block mb-1">
                            Số tiền rút (VNĐ) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="200000"
                            max={stats?.available_balance || 0}
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="Tối thiểu 200.000"
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold transition-colors"
                            required
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Tối thiểu: 200.000 đ</p>
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-600 font-medium block mb-1">
                            Ngân hàng <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold transition-colors"
                          >
                            {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-600 font-medium block mb-1">
                            Số tài khoản <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ví dụ: 0123456789"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold transition-colors"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-600 font-medium block mb-1">
                            Tên chủ tài khoản (IN HOA) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="NGUYEN VAN A"
                            value={accountHolder}
                            onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold transition-colors uppercase"
                            required
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 italic">
                        ⚠️ Vui lòng kiểm tra kỹ thông tin tài khoản. GS Luxury không chịu trách nhiệm với các lỗi do nhập sai thông tin ngân hàng.
                      </p>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => { setWithdrawMsg(null); setActiveTab("overview"); }}
                          className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-medium transition-all"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={withdrawSubmitting}
                          className="flex-1 py-2.5 bg-gold hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                        >
                          {withdrawSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                              Đang gửi...
                            </span>
                          ) : "Xác nhận Yêu Cầu Rút Tiền"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ===== HISTORY TAB ===== */}
                {activeTab === "history" && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">Lịch sử các yêu cầu rút hoa hồng của bạn.</p>
                    {historyLoading ? (
                      <div className="py-10 flex justify-center">
                        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : withdrawHistory.length === 0 ? (
                      <div className="py-10 text-center text-gray-400">
                        <div className="text-3xl mb-2">📋</div>
                        <p className="text-sm">Chưa có yêu cầu rút tiền nào</p>
                        <button
                          onClick={() => setActiveTab("withdraw")}
                          className="mt-3 text-xs text-gold hover:underline"
                        >
                          Tạo yêu cầu rút tiền đầu tiên →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {withdrawHistory.map((w) => (
                          <div key={w.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-gray-400">#{w.id}</span>
                                <StatusBadge status={w.status} />
                              </div>
                              <span className="text-sm font-bold text-wood-dark font-mono">
                                {w.amount.toLocaleString("vi-VN")} đ
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 text-[11px] text-gray-500">
                              <span>🏦 {w.bank_name}</span>
                              <span>💳 {w.account_number}</span>
                              <span className="col-span-2 mt-0.5">👤 {w.account_holder}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400">
                              <span>Gửi: {new Date(w.created_at).toLocaleDateString("vi-VN")}</span>
                              {w.processed_at && (
                                <span>Xử lý: {new Date(w.processed_at).toLocaleDateString("vi-VN")}</span>
                              )}
                            </div>
                            {w.admin_notes && (
                              <p className="text-[11px] italic text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
                                📝 &ldquo;{w.admin_notes}&rdquo;
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
