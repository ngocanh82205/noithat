"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Crown,
  Award,
  Shield,
  Phone,
  Mail,
  ShoppingBag,
} from "lucide-react";
import { adminService, AdminCustomer } from "@/services/api";
import { formatPrice } from "@/lib/products";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadCustomers = () => {
    setLoading(true);
    adminService
      .getCustomers({ q: search || undefined })
      .then((res) => {
        if (res.success && res.data) {
          setCustomers(res.data);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl text-champagne flex items-center gap-2.5">
            <Users className="text-gold" size={26} /> Quản Lý Khách Hàng ({customers.length})
          </h1>
          <p className="text-xs text-beige/60 tracking-wider mt-1">
            Danh sách khách hàng, tổng chi tiêu tích lũy và phân hạng thành viên VIP
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 bg-charcoal px-4 py-3 border border-white/10 rounded-xl">
        <Search size={16} className="text-beige/40" />
        <input
          type="text"
          placeholder="Tìm theo tên khách hàng, email, số điện thoại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-xs text-beige outline-none flex-1"
        />
      </form>

      {/* Customers Table */}
      <div className="bg-charcoal border border-white/10 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-16 text-center text-xs text-beige/50">
            Đang tải danh sách khách hàng...
          </div>
        ) : customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-beige/40 border-b border-white/10 bg-black/30">
                  <th className="p-4">Khách Hàng</th>
                  <th className="p-4">Liên Hệ</th>
                  <th className="p-4">Hạng Thành Viên</th>
                  <th className="p-4">Số Đơn Mua</th>
                  <th className="p-4">Tổng Chi Tiêu</th>
                  <th className="p-4 text-right">Ngày Tham Gia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.map((c) => {
                  const isDiamond = c.membership_tier.includes("Diamond");
                  const isGold = c.membership_tier.includes("Gold");
                  const isSilver = c.membership_tier.includes("Silver");

                  return (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-espresso border border-gold/40 text-gold flex items-center justify-center font-serif text-sm font-bold">
                            {c.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-serif text-sm text-champagne font-medium">
                              {c.name}
                            </p>
                            <span className="text-[10px] text-beige/40">
                              ID: #{c.id} • {c.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 space-y-0.5">
                        <p className="text-beige/80 flex items-center gap-1.5">
                          <Mail size={12} className="text-gold" /> {c.email}
                        </p>
                        {c.phone && (
                          <p className="text-beige/60 flex items-center gap-1.5">
                            <Phone size={12} className="text-gold" /> {c.phone}
                          </p>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            isDiamond
                              ? "bg-cyan-900/40 text-cyan-300 border border-cyan-500/40"
                              : isGold
                              ? "bg-yellow-900/40 text-yellow-300 border border-yellow-500/40"
                              : isSilver
                              ? "bg-slate-700/40 text-slate-200 border border-slate-400/40"
                              : "bg-amber-900/30 text-amber-200 border border-amber-600/30"
                          }`}
                        >
                          {isDiamond ? <Crown size={12} /> : isGold ? <Award size={12} /> : <Shield size={12} />}
                          {c.membership_tier}
                        </span>
                      </td>

                      <td className="p-4 font-semibold text-champagne">
                        {c.orders_count} đơn hàng
                      </td>

                      <td className="p-4 font-serif text-sm text-gold font-bold">
                        {formatPrice(c.total_spent)}
                      </td>

                      <td className="p-4 text-right text-beige/50">
                        {new Date(c.created_at).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-beige/40">
            Không tìm thấy khách hàng nào.
          </div>
        )}
      </div>
    </div>
  );
}
