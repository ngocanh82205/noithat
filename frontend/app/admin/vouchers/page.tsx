"use client";

import { useEffect, useState } from "react";
import {
  Ticket,
  Plus,
  Trash2,
  X,
  Sparkles,
  Calendar,
  CheckCircle2,
  Percent,
  Pause,
  Play,
} from "lucide-react";
import { adminService, ApiVoucher } from "@/services/api";
import { formatPrice } from "@/lib/products";

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<ApiVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    discount_type: "percent" as "percent" | "fixed",
    discount_value: 10,
    min_order_amount: 10000000,
    max_discount: 5000000,
    usage_limit: 50,
  });

  const loadVouchers = () => {
    setLoading(true);
    adminService
      .getVouchers()
      .then((res) => {
        if (res.success && res.data) {
          setVouchers(res.data);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      code: "VIP" + Math.floor(100 + Math.random() * 900),
      name: "Ưu đãi khách hàng VIP GS Luxury",
      discount_type: "percent",
      discount_value: 10,
      min_order_amount: 10000000,
      max_discount: 5000000,
      usage_limit: 50,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.discount_value) {
      setFormError("Vui lòng điền đầy đủ các trường thông tin bắt buộc (*).");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const res = await adminService.createVoucher(formData);
      if (res.success) {
        setModalOpen(false);
        loadVouchers();
      }
    } catch (err: any) {
      setFormError(err.message || "Lỗi khi tạo mã giảm giá");
    } finally {
      setSaving(false);
    }
  };

  const [togglingId, setTogglingId] = useState<number | null>(null);

  const handleToggleActive = async (voucher: ApiVoucher) => {
    setTogglingId(voucher.id);
    try {
      const res = await adminService.updateVoucher(voucher.id, { is_active: !voucher.is_active });
      if (res.success && res.data) {
        setVouchers((prev) => prev.map((v) => (v.id === voucher.id ? res.data : v)));
      } else {
        alert(res.message || "Không thể cập nhật trạng thái voucher");
      }
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật trạng thái voucher");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) return;

    try {
      await adminService.deleteVoucher(id);
      setVouchers((prev) => prev.filter((v) => v.id !== id));
    } catch (err: any) {
      alert(err.message || "Không thể xóa mã");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl text-champagne flex items-center gap-2.5">
            <Ticket className="text-gold" size={26} /> Quản Lý Mã Giảm Giá ({vouchers.length})
          </h1>
          <p className="text-xs text-beige/60 tracking-wider mt-1">
            Thiết lập chương trình chiết khấu, voucher tri ân và khuyến mãi toàn sàn
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-gold text-charcoal font-semibold text-xs tracking-widest2 uppercase hover:bg-champagne transition-colors rounded flex items-center gap-2 self-start sm:self-auto shadow-md"
        >
          <Plus size={16} /> Tạo Voucher Mới
        </button>
      </div>

      {/* Vouchers Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-beige/50">
          Đang tải danh sách voucher...
        </div>
      ) : vouchers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vouchers.map((v) => (
            <div
              key={v.id}
              className="bg-charcoal border border-gold/30 p-5 rounded-xl space-y-4 relative overflow-hidden flex flex-col justify-between hover:border-gold transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-champagne bg-black/40 px-3 py-1 rounded border border-white/10 tracking-wider">
                    {v.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      v.is_active
                        ? "bg-green-900/40 text-green-400"
                        : "bg-red-900/40 text-red-400"
                    }`}
                  >
                    {v.is_active ? "Đang Chạy" : "Tạm Dừng"}
                  </span>
                </div>

                <h3 className="font-serif text-base text-beige mt-3 font-medium">
                  {v.name}
                </h3>

                <div className="mt-3 space-y-1 text-xs text-beige/70">
                  <p className="flex justify-between">
                    <span>Mức giảm:</span>
                    <strong className="text-gold font-serif">
                      {v.discount_type === "percent"
                        ? `Giảm ${v.discount_value}%`
                        : `Giảm ${formatPrice(v.discount_value)}`}
                    </strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Đơn tối thiểu:</span>
                    <span>{formatPrice(v.min_order_amount)}</span>
                  </p>
                  {v.max_discount && (
                    <p className="flex justify-between">
                      <span>Giảm tối đa:</span>
                      <span>{formatPrice(v.max_discount)}</span>
                    </p>
                  )}
                  <p className="flex justify-between">
                    <span>Lượt sử dụng:</span>
                    <span>
                      {v.used_count} / {v.usage_limit} lượt
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-[10px] text-beige/40">
                  Hạn: {new Date(v.end_date).toLocaleDateString("vi-VN")}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(v)}
                    disabled={togglingId === v.id}
                    className="p-1.5 text-beige/40 hover:text-gold transition-colors rounded disabled:opacity-40"
                    title={v.is_active ? "Tạm dừng voucher" : "Kích hoạt lại voucher"}
                  >
                    {v.is_active ? <Pause size={15} /> : <Play size={15} />}
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="p-1.5 text-beige/40 hover:text-red-400 transition-colors rounded"
                    title="Xóa voucher"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-beige/40 bg-charcoal rounded-xl border border-white/10">
          Chưa có mã giảm giá nào. Hãy bấm &quot;Tạo Voucher Mới&quot; để thiết lập ngay!
        </div>
      )}

      {/* Create Voucher Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-espresso border border-gold/30 rounded-xl w-full max-w-lg p-6 md:p-8 text-beige shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="font-serif text-xl text-champagne flex items-center gap-2">
                <Sparkles size={18} className="text-gold" />
                Tạo Mã Giảm Giá Mới
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-beige/50 hover:text-beige"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-900/40 border border-red-500/50 text-red-200 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateVoucher} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider text-beige/70 mb-1">
                  Mã Voucher (Code) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: GSLUXURY10"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="w-full bg-black/40 border border-white/15 px-3 py-2.5 text-beige font-mono uppercase focus:outline-none focus:border-gold rounded"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-beige/70 mb-1">
                  Tên Chương Trình Khuyến Mãi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ưu Đãi Mùa Hè Cho Căn Hộ Cao Cấp"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 px-3 py-2.5 text-beige focus:outline-none focus:border-gold rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider text-beige/70 mb-1">
                    Loại Chiết Khấu *
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as "percent" | "fixed",
                      })
                    }
                    className="w-full bg-black/40 border border-white/15 px-3 py-2.5 text-beige focus:outline-none focus:border-gold rounded"
                  >
                    <option value="percent">Giảm theo %</option>
                    <option value="fixed">Giảm số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-beige/70 mb-1">
                    Giá Trị Giảm *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-black/40 border border-white/15 px-3 py-2.5 text-beige focus:outline-none focus:border-gold rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider text-beige/70 mb-1">
                    Đơn Tối Thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_order_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-black/40 border border-white/15 px-3 py-2.5 text-beige focus:outline-none focus:border-gold rounded"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-beige/70 mb-1">
                    Giảm Tối Đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_discount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-black/40 border border-white/15 px-3 py-2.5 text-beige focus:outline-none focus:border-gold rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-beige/70 mb-1">
                  Giới Hạn Số Lượt Sử Dụng
                </label>
                <input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usage_limit: parseInt(e.target.value) || 50,
                    })
                  }
                  className="w-full bg-black/40 border border-white/15 px-3 py-2.5 text-beige focus:outline-none focus:border-gold rounded"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 border border-white/20 text-xs uppercase tracking-wider hover:bg-white/5 rounded"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gold text-charcoal font-semibold text-xs uppercase tracking-wider hover:bg-champagne transition-colors rounded disabled:opacity-50"
                >
                  {saving ? "Đang Tạo..." : "Tạo Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
