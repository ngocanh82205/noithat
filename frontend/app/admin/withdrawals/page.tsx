"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Handshake,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  CreditCard,
  User,
  AlertTriangle,
  Banknote,
  Filter,
  TrendingUp,
} from "lucide-react";
import { adminWithdrawalService, WithdrawalRecord } from "@/services/api";
import { useToast } from "@/components/ToastProvider";

const STATUS_TABS = [
  { key: "all", label: "Tất Cả", color: "text-beige/70" },
  { key: "pending", label: "Chờ Duyệt", color: "text-amber-400" },
  { key: "approved", label: "Đã Duyệt", color: "text-emerald-400" },
  { key: "rejected", label: "Từ Chối", color: "text-red-400" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending: {
    label: "Chờ duyệt",
    cls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: <Clock size={11} />,
  },
  approved: {
    label: "Đã duyệt",
    cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: <CheckCircle2 size={11} />,
  },
  rejected: {
    label: "Từ chối",
    cls: "bg-red-500/15 text-red-300 border-red-500/30",
    icon: <XCircle size={11} />,
  },
};

// API trả decimal dạng chuỗi ("500000.00") -> ép sang số trước khi định dạng
function fmt(n: number | string) {
  return Number(n || 0).toLocaleString("vi-VN") + " ₫";
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminWithdrawalsPage() {
  const { showToast } = useToast();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<WithdrawalRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Modal state
  const [selected, setSelected] = useState<WithdrawalRecord | null>(null);
  const [modalMode, setModalMode] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await adminWithdrawalService.list({ status, search, page });
        if (res.success && res.data) {
          setRecords(res.data.data || []);
          setTotal(res.data.total || 0);
          setLastPage(res.data.last_page || 1);
        } else {
          showToast({ type: "error", title: "Lỗi", message: res.message || "Không thể tải dữ liệu." });
        }
      } catch {
        showToast({ type: "error", title: "Lỗi", message: "Không thể tải dữ liệu." });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [status, search, page]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openModal = (record: WithdrawalRecord, mode: "approve" | "reject") => {
    setSelected(record);
    setModalMode(mode);
    setAdminNotes("");
  };

  const closeModal = () => {
    setSelected(null);
    setModalMode(null);
    setAdminNotes("");
  };

  const handleConfirm = async () => {
    if (!selected || !modalMode) return;
    if (modalMode === "reject" && !adminNotes.trim()) {
      showToast({ type: "warning", title: "Cần ghi chú", message: "Vui lòng nhập lý do từ chối." });
      return;
    }
    setProcessing(true);
    try {
      let res;
      if (modalMode === "approve") {
        res = await adminWithdrawalService.approve(selected.id, adminNotes);
      } else {
        res = await adminWithdrawalService.reject(selected.id, adminNotes);
      }
      if (res.success) {
        showToast({
          type: "success",
          title: modalMode === "approve" ? "Đã duyệt!" : "Đã từ chối",
          message: modalMode === "approve"
            ? `Yêu cầu rút ${fmt(selected.amount)} của ${selected.user?.name} đã được xử lý.`
            : `Yêu cầu rút tiền của ${selected.user?.name} đã bị từ chối.`,
        });
        closeModal();
        fetchData(true);
      } else {
        // vd. số dư không đủ, yêu cầu đã được xử lý bởi admin khác
        showToast({ type: "error", title: "Không thể xử lý", message: res.message || "Xử lý thất bại, vui lòng thử lại." });
      }
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Xử lý thất bại, vui lòng thử lại." });
    } finally {
      setProcessing(false);
    }
  };

  // Summary stats
  const pendingCount = records.filter((r) => r.status === "pending").length;
  const pendingAmount = records.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.amount || 0), 0);
  const approvedAmount = records.filter((r) => r.status === "approved").reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center">
              <Handshake size={18} className="text-gold" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-champagne tracking-wide">
                Quản Lý Hoa Hồng & Rút Tiền CTV
              </h1>
              <p className="text-xs text-beige/50 mt-0.5">
                Xét duyệt và quản lý các yêu cầu rút hoa hồng từ cộng tác viên GS Luxury
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-beige/70 hover:text-gold rounded-lg text-xs transition-all"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng yêu cầu",
            value: total,
            unit: "yêu cầu",
            icon: <Handshake size={16} />,
            color: "text-gold",
            bg: "bg-gold/10 border-gold/20",
          },
          {
            label: "Chờ xét duyệt",
            value: pendingCount,
            unit: "đang chờ",
            icon: <Clock size={16} />,
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
          },
          {
            label: "Cần giải ngân",
            value: fmt(pendingAmount),
            unit: "",
            icon: <AlertTriangle size={16} />,
            color: "text-orange-400",
            bg: "bg-orange-500/10 border-orange-500/20",
          },
          {
            label: "Đã thanh toán",
            value: fmt(approvedAmount),
            unit: "",
            icon: <TrendingUp size={16} />,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`p-4 rounded-xl border ${card.bg} flex flex-col gap-2`}
          >
            <div className={`${card.color} opacity-80`}>{card.icon}</div>
            <div className={`text-base font-bold font-mono ${card.color}`}>
              {card.value}
              {card.unit && (
                <span className="text-[10px] font-normal text-beige/50 ml-1">{card.unit}</span>
              )}
            </div>
            <div className="text-[11px] text-beige/50">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-lg">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                status === tab.key
                  ? "bg-gold text-charcoal font-semibold shadow"
                  : `${tab.color} hover:bg-white/5`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-beige/40" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên, email CTV..."
              className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-beige placeholder:text-beige/30 focus:outline-none focus:border-gold/40 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 rounded-lg text-xs font-medium transition-all"
          >
            Tìm
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-beige/40">
            <div className="w-8 h-8 border-2 border-gold/50 border-t-gold rounded-full animate-spin" />
            <p className="text-xs">Đang tải dữ liệu...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-beige/40">
            <Banknote size={40} className="opacity-30" />
            <p className="text-sm font-serif">Không có yêu cầu rút tiền nào</p>
            <p className="text-xs">Thay đổi bộ lọc để xem kết quả khác</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-beige/50 font-semibold">#ID</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-beige/50 font-semibold">Cộng Tác Viên</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-beige/50 font-semibold">Số Tiền</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-beige/50 font-semibold">Ngân Hàng</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-beige/50 font-semibold">Trạng Thái</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-beige/50 font-semibold">Ngày Tạo</th>
                  <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider text-beige/50 font-semibold">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.map((rec) => {
                  const badge = STATUS_BADGE[rec.status] || STATUS_BADGE.pending;
                  return (
                    <tr key={rec.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-4 py-3.5 font-mono text-beige/40">
                        #{rec.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                            <User size={12} className="text-gold" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-beige truncate max-w-[120px]">
                              {rec.user?.name || `User #${rec.user_id}`}
                            </p>
                            <p className="text-[10px] text-beige/40 truncate max-w-[120px]">
                              {rec.user?.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-champagne text-sm">
                          {fmt(rec.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-beige/70">
                            <Building2 size={11} className="text-gold/60" />
                            <span className="font-medium">{rec.bank_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-beige/40">
                            <CreditCard size={11} />
                            <span className="font-mono">{rec.account_number}</span>
                          </div>
                          <p className="text-[10px] text-beige/30 pl-4">
                            {rec.account_holder}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border ${badge.cls}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                        {rec.admin_notes && (
                          <p className="text-[10px] text-beige/30 mt-1 italic max-w-[140px] truncate">
                            &ldquo;{rec.admin_notes}&rdquo;
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-beige/50 whitespace-nowrap">
                        {fmtDate(rec.created_at)}
                      </td>
                      <td className="px-4 py-3.5">
                        {rec.status === "pending" ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openModal(rec, "approve")}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition-all"
                            >
                              <CheckCircle2 size={12} /> Duyệt
                            </button>
                            <button
                              onClick={() => openModal(rec, "reject")}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-lg text-[11px] font-semibold transition-all"
                            >
                              <XCircle size={12} /> Từ chối
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            {rec.processed_at && (
                              <p className="text-[10px] text-beige/30">
                                {fmtDate(rec.processed_at)}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between text-xs text-beige/50">
          <span>
            Trang {page} / {lastPage} · Tổng {total} yêu cầu
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-white/10 hover:border-gold/30 hover:text-gold disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="p-1.5 rounded border border-white/10 hover:border-gold/30 hover:text-gold disabled:opacity-30 transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Approve / Reject Modal */}
      {selected && modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/15 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  modalMode === "approve"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {modalMode === "approve" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              </div>
              <div>
                <h3 className="font-serif font-bold text-champagne">
                  {modalMode === "approve" ? "Xác nhận Duyệt Giải Ngân" : "Xác nhận Từ Chối"}
                </h3>
                <p className="text-[11px] text-beige/50">
                  {modalMode === "approve"
                    ? "Hành động này không thể hoàn tác sau khi xác nhận."
                    : "Lý do từ chối sẽ được gửi đến CTV."}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-beige/50">Cộng tác viên</span>
                <span className="text-beige font-semibold">{selected.user?.name || `#${selected.user_id}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-beige/50">Số tiền yêu cầu</span>
                <span className="font-mono font-bold text-champagne text-sm">{fmt(selected.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-beige/50">Ngân hàng</span>
                <span className="text-beige">{selected.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-beige/50">Số tài khoản</span>
                <span className="font-mono text-beige">{selected.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-beige/50">Chủ tài khoản</span>
                <span className="text-beige font-semibold uppercase">{selected.account_holder}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] text-beige/60 uppercase tracking-wider mb-1.5">
                Ghi chú Admin {modalMode === "reject" && <span className="text-red-400">*</span>}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  modalMode === "approve"
                    ? "Ghi chú thanh toán (không bắt buộc)..."
                    : "Lý do từ chối yêu cầu (bắt buộc)..."
                }
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-beige placeholder:text-beige/30 focus:outline-none focus:border-gold/40 resize-none transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={closeModal}
                disabled={processing}
                className="flex-1 py-2.5 border border-white/15 text-beige/60 hover:text-beige hover:bg-white/5 rounded-xl text-xs font-medium transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg disabled:opacity-50 ${
                  modalMode === "approve"
                    ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                    : "bg-red-500 hover:bg-red-400 text-white"
                }`}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : modalMode === "approve" ? (
                  "✓ Xác nhận Duyệt & Giải Ngân"
                ) : (
                  "✕ Xác nhận Từ Chối"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
