"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  Filter,
  Eye,
  Sparkles,
  Upload,
  Loader2,
} from "lucide-react";
import { adminService, catalogService, ApiProduct, ApiCategory } from "@/services/api";
import { formatPrice } from "@/lib/products";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Modal State for Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category_id: 1,
    sku: "",
    price: 0,
    original_price: 0,
    stock_quantity: 10,
    summary: "",
    description: "",
    material: "Gỗ tự nhiên & Da bò Mastrotto Ý",
    dimensions: "2400 x 950 x 820 mm",
    warranty: "24 tháng chính hãng",
    image_url: "/images/sofa-1.jpg",
    is_featured: false,
    is_bestseller: false,
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      adminService.getProducts({
        q: search || undefined,
        category_id: selectedCategory || undefined,
        per_page: 50,
      }),
      catalogService.getCategories(),
    ])
      .then(([prodRes, catRes]) => {
        if (prodRes.success && prodRes.data) {
          setProducts(prodRes.data);
        }
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category_id: categories[0]?.id || 1,
      sku: "GS-" + Math.floor(1000 + Math.random() * 9000),
      price: 45000000,
      original_price: 52000000,
      stock_quantity: 15,
      summary: "Sản phẩm nội thất chế tác thủ công cao cấp dành cho không gian sống sang trọng.",
      description: "Được gia công tỉ mỉ từ vật liệu cao cấp chuẩn châu Âu, mang đến trải nghiệm sống đỉnh cao.",
      material: "Gỗ sồi Nga & Da bò tự nhiên",
      dimensions: "2200 x 900 x 800 mm",
      warranty: "24 tháng chính hãng",
      image_url: "/images/sofa-1.jpg",
      is_featured: true,
      is_bestseller: false,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (product: ApiProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id || product.category?.id || 1,
      sku: product.sku || "",
      price: product.price,
      original_price: product.original_price || 0,
      stock_quantity: product.stock_quantity || 10,
      summary: product.summary || "",
      description: product.description || "",
      material: product.material || "",
      dimensions: product.dimensions || "",
      warranty: product.warranty || "24 tháng",
      image_url: product.images?.[0]?.image_url || (product as any).image || "/images/sofa-1.jpg",
      is_featured: product.is_featured,
      is_bestseller: product.is_bestseller,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Quý khách có chắc chắn muốn xóa sản phẩm này khỏi hệ thống?")) return;

    try {
      await adminService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || "Không thể xóa sản phẩm");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError("");
    try {
      const res = await adminService.uploadImage(file);
      if (res.success && res.data) {
        setFormData((prev) => ({
          ...prev,
          image_url: res.data.url,
        }));
      } else {
        setFormError((res as any).message || "Không thể tải ảnh lên máy chủ.");
      }
    } catch (err: any) {
      setFormError(err.message || "Lỗi khi tải ảnh lên máy chủ.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      setFormError("Vui lòng điền đầy đủ tên và giá sản phẩm.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingProduct) {
        // Update
        const res = await adminService.updateProduct(editingProduct.id, formData);
        if (res.success) {
          setModalOpen(false);
          loadData();
        }
      } else {
        // Create
        const res = await adminService.createProduct(formData);
        if (res.success) {
          setModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      setFormError(err.message || "Lỗi lưu thông tin sản phẩm");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl text-champagne flex items-center gap-2.5">
            <Package className="text-gold" size={26} /> Quản Lý Sản Phẩm ({products.length})
          </h1>
          <p className="text-xs text-beige/60 tracking-wider mt-1">
            Quản trị kho hàng, bảng giá, biến thể và hình ảnh sản phẩm toàn sàn
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-gold text-charcoal font-semibold text-xs tracking-widest2 uppercase hover:bg-champagne transition-colors rounded flex items-center gap-2 self-start sm:self-auto shadow-md"
        >
          <Plus size={16} /> Thêm Sản Phẩm Mới
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-charcoal p-4 rounded-xl border border-white/10">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 bg-black/40 px-3 py-2 border border-white/10 rounded">
          <Search size={16} className="text-beige/40" />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm, SKU, chất liệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-beige outline-none flex-1"
          />
        </form>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-black/40 border border-white/10 text-xs text-beige px-4 py-2 rounded focus:outline-none focus:border-gold"
        >
          <option value="">Tất cả danh mục ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-charcoal border border-white/10 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-16 text-center text-xs text-beige/50">
            Đang tải danh sách sản phẩm...
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-beige/40 border-b border-white/10 bg-black/30">
                  <th className="p-4 w-16">Ảnh</th>
                  <th className="p-4">Tên Sản Phẩm</th>
                  <th className="p-4">Danh Mục</th>
                  <th className="p-4">Giá Bán</th>
                  <th className="p-4">Kho</th>
                  <th className="p-4">Đã Bán</th>
                  <th className="p-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((p) => {
                  const img =
                    p.images?.[0]?.image_url || (p as any).image || "/images/sofa-1.jpg";

                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="relative w-12 h-12 rounded overflow-hidden bg-black/60 border border-white/10">
                          <Image src={img} alt={p.name} fill className="object-cover" />
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-serif text-sm text-champagne font-medium line-clamp-1">
                          {p.name}
                        </p>
                        <span className="text-[10px] font-mono text-beige/40">
                          SKU: {p.sku || `GS-${p.id}`}
                        </span>
                      </td>
                      <td className="p-4 text-beige/70">
                        {p.category?.name || "Nội thất cao cấp"}
                      </td>
                      <td className="p-4 font-serif text-sm text-gold font-semibold">
                        {formatPrice(p.price)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.stock_quantity > 5
                              ? "bg-green-900/40 text-green-400"
                              : "bg-red-900/40 text-red-400"
                          }`}
                        >
                          {p.stock_quantity} cái
                        </span>
                      </td>
                      <td className="p-4 text-beige/60 font-medium">{p.sold_count || 0}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 bg-white/5 hover:bg-gold hover:text-charcoal transition-colors rounded text-beige/70"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 bg-white/5 hover:bg-red-600 transition-colors rounded text-beige/70 hover:text-white"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-beige/40">
            Không tìm thấy sản phẩm nào. Hãy bấm &quot;Thêm Sản Phẩm Mới&quot; để tạo ngay!
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-espresso border border-gold/30 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 text-beige shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="font-serif text-xl text-champagne flex items-center gap-2">
                <Sparkles size={18} className="text-gold" />
                {editingProduct ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
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

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] uppercase tracking-wider text-beige/70 mb-1">
                    Tên Sản Phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 px-3 py-2.5 text-xs text-beige focus:outline-none focus:border-gold rounded"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-beige/70 mb-1">
                    Danh Mục Không Gian *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: parseInt(e.target.value) })
                    }
                    className="w-full bg-black/40 border border-white/15 px-3 py-2.5 text-xs text-beige focus:outline-none focus:border-gold rounded"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-beige/70 mb-1">
                    Mã SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 px-3 py-2.5 text-xs text-beige focus:outline-none focus:border-gold rounded"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-beige/70 mb-1">
                    Giá Bán (VNĐ) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-black/40 border border-white/15 px-3 py-2.5 text-xs text-beige focus:outline-none focus:border-gold rounded"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-beige/70 mb-1">
                    Giá Gốc Niêm Yết (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.original_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        original_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-black/40 border border-white/15 px-3 py-2.5 text-xs text-beige focus:outline-none focus:border-gold rounded"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-beige/70 mb-1">
                    Số Lượng Tồn Kho
                  </label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-black/40 border border-white/15 px-3 py-2.5 text-xs text-beige focus:outline-none focus:border-gold rounded"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider text-beige/70">
                    Hình Ảnh Sản Phẩm Chính *
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Thumbnail Preview */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/20 bg-black/40 shrink-0">
                      {formData.image_url ? (
                        <Image
                          src={formData.image_url}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-beige/30 text-[10px]">
                          Chưa có ảnh
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      {/* Upload Button */}
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-espresso hover:bg-gold/20 border border-gold/40 text-gold text-xs font-medium rounded transition-colors">
                          {uploadingImage ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Đang tải lên máy chủ...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={14} />
                              <span>Tải ảnh từ máy tính (Upload)</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg,image/svg+xml"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                        <span className="text-[11px] text-beige/50">
                          hoặc dán đường dẫn URL trực tiếp bên dưới:
                        </span>
                      </div>

                      {/* Manual URL input fallback */}
                      <input
                        type="text"
                        placeholder="https://... hoặc /images/sofa-1.jpg"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="w-full bg-black/40 border border-white/15 px-3 py-2 text-xs text-beige focus:outline-none focus:border-gold rounded font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] uppercase tracking-wider text-beige/70 mb-1">
                    Chất Liệu &amp; Kích Thước
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Chất liệu (Gỗ óc chó, Da Ý...)"
                      value={formData.material}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                      className="bg-black/40 border border-white/15 px-3 py-2.5 text-xs text-beige focus:outline-none focus:border-gold rounded"
                    />
                    <input
                      type="text"
                      placeholder="Kích thước (2400 x 900 x 800 mm)"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      className="bg-black/40 border border-white/15 px-3 py-2.5 text-xs text-beige focus:outline-none focus:border-gold rounded"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] uppercase tracking-wider text-beige/70 mb-1">
                    Mô Tả Sản Phẩm
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 px-3 py-2.5 text-xs text-beige focus:outline-none focus:border-gold rounded"
                  />
                </div>
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
                  {saving ? "Đang Lưu..." : "Lưu Sản Phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
