// services/api.ts — GS Luxury Backend API Service Client

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  pagination?: {
    current_page: number;
    last_page: number;
    per_page?: number;
    total: number;
  };
  errors?: Record<string, string[]>;
};

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role: "admin" | "customer" | "staff" | "seller";
  coins?: number;
  referral_code?: string;
  shop_name?: string;
  shop_description?: string;
  shop_rating?: number;
  is_shop_active?: boolean;
  created_at: string;
};

export type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  products_count?: number;
};

export type ApiCollection = {
  id: number;
  name: string;
  slug: string;
  subtitle?: string;
  description?: string;
  banner_image?: string;
  room_type?: string;
  is_featured: boolean;
  products_count?: number;
};

export type ApiProductVariant = {
  id: number;
  product_id?: number;
  name: string;
  sku?: string;
  color_name?: string;
  color_hex?: string;
  material?: string;
  size?: string;
  price?: number;
  stock?: number;
  stock_quantity?: number;
  image_url?: string;
};

export type ApiProductImage = {
  id: number;
  product_id: number;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
};

export type ApiReview = {
  id: number;
  product_id: number;
  customer_name: string;
  rating: number;
  title?: string;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
};

export type ApiProduct = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  category_id?: number;
  collection_id?: number;
  category?: ApiCategory;
  collection?: ApiCollection;
  summary?: string;
  description?: string;
  price: number;
  original_price?: number;
  material?: string;
  dimensions?: string;
  warranty?: string;
  care_instructions?: string;
  stock_quantity: number;
  sold_count: number;
  rating_avg: number;
  rating_count: number;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  is_active: boolean;
  status?: "active" | "inactive" | "draft";
  variants?: ApiProductVariant[];
  images?: ApiProductImage[];
  reviews?: ApiReview[];
};

export type ApiOrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  variant_name?: string;
  product_image?: string;
  price?: number;
  unit_price: number;
  quantity: number;
  total_price?: number;
  subtotal: number;
  product?: ApiProduct;
  variant?: ApiProductVariant;
};

export type ApiOrder = {
  id: number;
  order_number: string;
  user_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_district?: string;
  shipping_fee: number;
  discount_amount: number;
  subtotal: number;
  total_amount: number;
  coins_used?: number;
  coins_discount?: number;
  coins_earned?: number;
  payment_method: "cod" | "bank_transfer" | "vnpay" | "momo";
  payment_status: "pending" | "unpaid" | "paid" | "failed" | "refunded";
  status: "pending" | "confirmed" | "shipping" | "completed" | "cancelled";
  order_status?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  items?: ApiOrderItem[];
  user?: ApiUser;
};

export type ApiLookbookHotspot = {
  id: number;
  lookbook_id: number;
  product_id: number;
  pos_x: number;
  pos_y: number;
  title?: string;
  product?: ApiProduct;
};

export type ApiLookbook = {
  id: number;
  title: string;
  slug: string;
  image_url: string;
  description?: string;
  room_type?: string;
  is_featured: boolean;
  hotspots?: ApiLookbookHotspot[];
};

export type ApiVoucher = {
  id: number;
  code: string;
  name: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount?: number;
  usage_limit: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

export type ApiFlashSaleItem = {
  id: number;
  flash_sale_id: number;
  product_id: number;
  flash_price: number;
  stock_for_sale: number;
  sold_count: number;
  product?: ApiProduct;
};

export type ApiFlashSale = {
  id: number;
  name: string;
  subtitle?: string;
  banner_image?: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  items?: ApiFlashSaleItem[];
};

export type ApiFaq = {
  id: number;
  product_id: number;
  user_id?: number;
  customer_name: string;
  question: string;
  answer?: string;
  answered_by?: string;
  is_approved?: boolean;
  created_at: string;
  product?: ApiProduct;
};

export type ConsultationPayload = {
  name?: string;
  full_name?: string;
  phone: string;
  email?: string;
  address?: string;
  room_type?: string;
  space_type?: string;
  budget_range?: string;
  preferred_date?: string;
  preferred_time?: string;
  message?: string;
  notes?: string;
};

export type CreateOrderPayload = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_district?: string;
  shipping_method?: string;
  shipping_fee?: number;
  notes?: string;
  payment_method: "cod" | "bank_transfer" | "vnpay" | "momo";
  voucher_code?: string;
  discount_amount?: number;
  coins_used?: number;
  coins_discount?: number;
  referral_code?: string;
  idempotency_key?: string;
  items: {
    product_id: number;
    variant_id?: number | null;
    quantity: number;
  }[];
};

export type MomoCreatePaymentResponse = {
  payUrl: string;
  deeplink?: string;
  orderId: string;
  requestId: string;
};

export type MomoReturnResponse = {
  success: boolean;
  message: string;
  data: {
    orderId: string | null;
    requestId: string | null;
    amount: number | null;
    resultCode: string | null;
    message: string | null;
    transId: string | null;
    signature_valid: boolean;
  };
};

export type VnpayCreatePaymentResponse = {
  payment_url: string;
  vnp_TxnRef: string;
};

export type VnpayReturnResponse = {
  order_number: string;
  status: string;
  response_code?: string;
};

export type AdminOrderStatusItem = {
  key: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
};

export type AdminPaymentMethodItem = {
  key: string;
  label: string;
  count: number;
  revenue: number;
  percentage: number;
  color: string;
};

export type AdminCategoryDistributionItem = {
  id: number;
  label: string;
  count: number;
  percentage: number;
  color: string;
};

export type AdminDashboardStats = {
  total_revenue: number;
  today_revenue: number;
  this_month_revenue: number;
  last_month_revenue: number;
  growth_rate: number;
  total_orders: number;
  today_orders: number;
  pending_orders: number;
  completed_orders: number;
  completion_rate: number;
  average_order_value: number;
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_customers: number;
  new_customers_this_month: number;
  unanswered_faqs: number;
  order_status_distribution: AdminOrderStatusItem[];
  payment_distribution: AdminPaymentMethodItem[];
  category_distribution: AdminCategoryDistributionItem[];
  revenue_chart: { date: string; label: string; revenue: number; order_count?: number }[];
  recent_orders: ApiOrder[];
  top_products: ApiProduct[];
};

export type AdminCustomer = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  orders_count: number;
  total_spent: number;
  membership_tier: string;
  created_at: string;
};

// Helper fetch wrapper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T> | { success: false; status: number; message: string; errors?: Record<string, string[]> }> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  // Add Sanctum Bearer Token from localStorage if running on client
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("gs_auth_token");
    if (token) {
      (headers as any)["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Return structured error instead of throwing
    return {
      success: false,
      status: response.status,
      message: data.message || "Đã xảy ra lỗi khi kết nối máy chủ.",
      errors: data.errors,
      data: data.data,
    } as any;
  }

  return data as ApiResponse<T>;
}

// 1. Authentication Service
export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    address?: string;
  }): Promise<ApiResponse<{ user: ApiUser; token: string }>> {
    const result = await request<{ user: ApiUser; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<{ user: ApiUser; token: string }>;
  },

  async login(data: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ user: ApiUser; token: string }>> {
    const result = await request<{ user: ApiUser; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<{ user: ApiUser; token: string }>;
  },

  async getMe(): Promise<ApiResponse<{ user: ApiUser }>> {
    const result = await request<{ user: ApiUser }>("/auth/me", { cache: "no-store" });
    return result as ApiResponse<{ user: ApiUser }>;
  },

  async updateProfile(data: Partial<ApiUser>): Promise<ApiResponse<{ user: ApiUser }>> {
    const result = await request<{ user: ApiUser }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<{ user: ApiUser }>;
  },

  async logout(): Promise<ApiResponse<null>> {
    const result = await request<null>("/auth/logout", {
      method: "POST",
    });
    return result as ApiResponse<null>;
  },
};

// 2. Catalog Service
export const catalogService = {
  async getCategories(): Promise<ApiResponse<ApiCategory[]>> {
    const result = await request<ApiCategory[]>("/categories", { cache: "no-store" });
    return result as ApiResponse<ApiCategory[]>;
  },

  async getCategoryDetail(slug: string): Promise<ApiResponse<{ category: ApiCategory; products: ApiProduct[] }>> {
    const result = await request<{ category: ApiCategory; products: ApiProduct[] }>(`/categories/${slug}`, { cache: "no-store" });
    return result as ApiResponse<{ category: ApiCategory; products: ApiProduct[] }>;
  },

  async getCollections(): Promise<ApiResponse<ApiCollection[]>> {
    const result = await request<ApiCollection[]>("/collections", { cache: "no-store" });
    return result as ApiResponse<ApiCollection[]>;
  },

  async getCollectionDetail(slug: string): Promise<ApiResponse<{ collection: ApiCollection; products: ApiProduct[] }>> {
    const result = await request<{ collection: ApiCollection; products: ApiProduct[] }>(`/collections/${slug}`, { cache: "no-store" });
    return result as ApiResponse<{ collection: ApiCollection; products: ApiProduct[] }>;
  },
};

// 3. Product Service
export const productService = {
  async getAll(params?: {
    category_id?: number | string;
    collection_id?: number | string;
    q?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: "price_asc" | "price_desc" | "newest" | "bestseller";
    per_page?: number;
    page?: number;
  }): Promise<ApiResponse<ApiProduct[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          query.append(key, String(val));
        }
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : "";
    const result = await request<ApiProduct[]>(`/products${qs}`, { cache: "no-store" });
    return result as ApiResponse<ApiProduct[]>;
  },

  async getDetail(slugOrId: string | number): Promise<ApiResponse<{ product: ApiProduct; related_products: ApiProduct[] }>> {
    const result = await request<{ product: ApiProduct; related_products: ApiProduct[] }>(`/products/${slugOrId}`, { cache: "no-store" });
    return result as ApiResponse<{ product: ApiProduct; related_products: ApiProduct[] }>;
  },

  async addReview(productId: number, data: { customer_name: string; rating: number; title?: string; comment: string }): Promise<ApiResponse<ApiReview> & { coins_awarded?: number }> {
    const result = await request<ApiReview>(`/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<ApiReview> & { coins_awarded?: number };
  },
};

// 4. Lookbook & Hotspots Service
export const lookbookService = {
  async getAll(): Promise<ApiResponse<ApiLookbook[]>> {
    const result = await request<ApiLookbook[]>("/lookbooks", { cache: "no-store" });
    return result as ApiResponse<ApiLookbook[]>;
  },

  async getDetail(slug: string): Promise<ApiResponse<ApiLookbook>> {
    const result = await request<ApiLookbook>(`/lookbooks/${slug}`, { cache: "no-store" });
    return result as ApiResponse<ApiLookbook>;
  },
};

// 5. Order Service
export const orderService = {
  async createOrder(payload: CreateOrderPayload): Promise<ApiResponse<{ order: ApiOrder }>> {
    const result = await request<{ order: ApiOrder }>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return result as ApiResponse<{ order: ApiOrder }>;
  },

  async createMomoPayment(orderId: number): Promise<ApiResponse<MomoCreatePaymentResponse>> {
    const result = await request<MomoCreatePaymentResponse>("/momo/create-payment", {
      method: "POST",
      body: JSON.stringify({ order_id: orderId }),
    });
    return result as ApiResponse<MomoCreatePaymentResponse>;
  },

  async verifyMomoReturn(params: URLSearchParams): Promise<ApiResponse<MomoReturnResponse>> {
    const queryString = params.toString();
    const result = await request<MomoReturnResponse>(`/momo/return?${queryString}`, {
      method: "GET",
    });
    return result as ApiResponse<MomoReturnResponse>;
  },

  async createVnpayPayment(orderId: number, bankCode?: string): Promise<ApiResponse<VnpayCreatePaymentResponse>> {
    const result = await request<VnpayCreatePaymentResponse>("/vnpay/create-payment", {
      method: "POST",
      body: JSON.stringify({ order_id: orderId, bank_code: bankCode }),
    });
    return result as ApiResponse<VnpayCreatePaymentResponse>;
  },

  async verifyVnpayReturn(params: URLSearchParams): Promise<ApiResponse<VnpayReturnResponse>> {
    const queryString = params.toString();
    const result = await request<VnpayReturnResponse>(`/vnpay/return?${queryString}`, {
      method: "GET",
    });
    return result as ApiResponse<VnpayReturnResponse>;
  },

  async trackOrder(orderNumber: string): Promise<ApiResponse<ApiOrder>> {
    const result = await request<ApiOrder>(`/orders/track/${orderNumber}`, { cache: "no-store" });
    return result as ApiResponse<ApiOrder>;
  },

  async getUserOrders(): Promise<ApiResponse<ApiOrder[]>> {
    const result = await request<ApiOrder[]>("/orders/my-orders", { cache: "no-store" });
    return result as ApiResponse<ApiOrder[]>;
  },

  async cancelOrder(orderNumber: string, reason?: string): Promise<ApiResponse<ApiOrder>> {
    const result = await request<ApiOrder>(`/orders/${encodeURIComponent(orderNumber)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    return result as ApiResponse<ApiOrder>;
  },
};

// 5b. Lucky Wheel (server quyết định giải thưởng, 1 lượt/ngày)
export type LuckyWheelSpinResult = {
  segment_index: number;
  coins_won: number;
  coins: number;
};

export const rewardService = {
  async getSpinStatus(): Promise<ApiResponse<{ can_spin: boolean; coins: number }>> {
    const result = await request<{ can_spin: boolean; coins: number }>("/rewards/spin", { cache: "no-store" });
    return result as ApiResponse<{ can_spin: boolean; coins: number }>;
  },

  async spin(): Promise<ApiResponse<LuckyWheelSpinResult>> {
    const result = await request<LuckyWheelSpinResult>("/rewards/spin", { method: "POST" });
    return result as ApiResponse<LuckyWheelSpinResult>;
  },
};

// 6. Consultation Appointment
export const consultationService = {
  async submit(payload: ConsultationPayload): Promise<ApiResponse<any>> {
    const result = await request<any>("/consultations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return result as ApiResponse<any>;
  },
};

// 7. Vouchers & Coupons
export const voucherService = {
  async getVouchers(): Promise<ApiResponse<ApiVoucher[]>> {
    const result = await request<ApiVoucher[]>("/vouchers", { cache: "no-store" });
    return result as ApiResponse<ApiVoucher[]>;
  },

  async applyVoucher(code: string, subtotal: number): Promise<ApiResponse<{ voucher: ApiVoucher; discount_amount: number; final_total: number }>> {
    const result = await request<{ voucher: ApiVoucher; discount_amount: number; final_total: number }>("/vouchers/apply", {
      method: "POST",
      body: JSON.stringify({ code, subtotal }),
    });
    return result as ApiResponse<{ voucher: ApiVoucher; discount_amount: number; final_total: number }>;
  },
};

// 8. Flash Sales
export const flashSaleService = {
  async getActiveFlashSale(): Promise<ApiResponse<ApiFlashSale>> {
    const result = await request<ApiFlashSale>("/flash-sales/active", { cache: "no-store" });
    return result as ApiResponse<ApiFlashSale>;
  },
};

// 9. Product FAQs / Q&A
export const faqService = {
  async getProductFaqs(productId: number | string): Promise<ApiResponse<ApiFaq[]>> {
    const result = await request<ApiFaq[]>(`/products/${productId}/faqs`, { cache: "no-store" });
    return result as ApiResponse<ApiFaq[]>;
  },

  async askQuestion(productId: number | string, data: { customer_name: string; question: string }): Promise<ApiResponse<ApiFaq>> {
    const result = await request<ApiFaq>(`/products/${productId}/faqs`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<ApiFaq>;
  },
};

// 10. AI Shopping Concierge
export const aiService = {
  async chat(message: string): Promise<ApiResponse<{ reply: string; products: ApiProduct[]; action?: string }>> {
    const result = await request<{ reply: string; products: ApiProduct[]; action?: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    return result as ApiResponse<{ reply: string; products: ApiProduct[]; action?: string }>;
  },
};

// 11. Admin & Multi-Vendor Management Service
export const adminService = {
  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<AdminDashboardStats>> {
    const result = await request<AdminDashboardStats>("/admin/dashboard/stats", { cache: "no-store" });
    return result as ApiResponse<AdminDashboardStats>;
  },

  // Products
  async getProducts(params?: { q?: string; category_id?: number | string; page?: number; per_page?: number }): Promise<ApiResponse<ApiProduct[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          query.append(key, String(val));
        }
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : "";
    const result = await request<ApiProduct[]>(`/admin/products${qs}`, { cache: "no-store" });
    return result as ApiResponse<ApiProduct[]>;
  },

  async createProduct(data: any): Promise<ApiResponse<ApiProduct>> {
    const result = await request<ApiProduct>("/admin/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<ApiProduct>;
  },

  async updateProduct(id: number | string, data: any): Promise<ApiResponse<ApiProduct>> {
    const result = await request<ApiProduct>(`/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<ApiProduct>;
  },

  async deleteProduct(id: number | string): Promise<ApiResponse<null>> {
    const result = await request<null>(`/admin/products/${id}`, {
      method: "DELETE",
    });
    return result as ApiResponse<null>;
  },

  async uploadImage(file: File): Promise<ApiResponse<{ url: string; path: string }>> {
    const formData = new FormData();
    formData.append("image", file);
    const token = typeof window !== "undefined" ? localStorage.getItem("gs_auth_token") : null;
    const res = await fetch(`${API_BASE_URL}/admin/upload-image`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        Accept: "application/json",
      },
      body: formData,
    });
    const data = await res.json();
    return data as ApiResponse<{ url: string; path: string }>;
  },

  // Orders
  async getOrders(params?: { status?: string; payment_status?: string; q?: string; page?: number }): Promise<ApiResponse<ApiOrder[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          query.append(key, String(val));
        }
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : "";
    const result = await request<ApiOrder[]>(`/admin/orders${qs}`, { cache: "no-store" });
    return result as ApiResponse<ApiOrder[]>;
  },

  async getOrderDetail(id: number | string): Promise<ApiResponse<ApiOrder>> {
    const result = await request<ApiOrder>(`/admin/orders/${id}`, { cache: "no-store" });
    return result as ApiResponse<ApiOrder>;
  },

  async updateOrderStatus(id: number | string, data: { status: string; payment_status?: string; notes?: string }): Promise<ApiResponse<ApiOrder>> {
    const result = await request<ApiOrder>(`/admin/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<ApiOrder>;
  },

  // Vouchers
  async getVouchers(): Promise<ApiResponse<ApiVoucher[]>> {
    const result = await request<ApiVoucher[]>("/admin/vouchers", { cache: "no-store" });
    return result as ApiResponse<ApiVoucher[]>;
  },

  async createVoucher(data: any): Promise<ApiResponse<ApiVoucher>> {
    const result = await request<ApiVoucher>("/admin/vouchers", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<ApiVoucher>;
  },

  async updateVoucher(id: number | string, data: Partial<ApiVoucher>): Promise<ApiResponse<ApiVoucher>> {
    const result = await request<ApiVoucher>(`/admin/vouchers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<ApiVoucher>;
  },

  async deleteVoucher(id: number | string): Promise<ApiResponse<null>> {
    const result = await request<null>(`/admin/vouchers/${id}`, {
      method: "DELETE",
    });
    return result as ApiResponse<null>;
  },

  // Faqs
  async getFaqs(params?: string | { q?: string; page?: number; status?: "all" | "unanswered" }): Promise<ApiResponse<ApiFaq[]>> {
    const query = new URLSearchParams();
    if (params) {
      if (typeof params === "string") {
        query.append("status", params);
      } else {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== "") {
            query.append(key, String(val));
          }
        });
      }
    }
    const qs = query.toString() ? `?${query.toString()}` : "";
    const result = await request<ApiFaq[]>(`/admin/faqs${qs}`, { cache: "no-store" });
    return result as ApiResponse<ApiFaq[]>;
  },

  async answerFaq(id: number | string, data: { answer: string; answered_by?: string }): Promise<ApiResponse<ApiFaq>> {
    const result = await request<ApiFaq>(`/admin/faqs/${id}/answer`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<ApiFaq>;
  },

  async deleteFaq(id: number | string): Promise<ApiResponse<null>> {
    const result = await request<null>(`/admin/faqs/${id}`, {
      method: "DELETE",
    });
    return result as ApiResponse<null>;
  },

  // Customers
  async getCustomers(params?: { q?: string; page?: number }): Promise<ApiResponse<AdminCustomer[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          query.append(key, String(val));
        }
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : "";
    const result = await request<AdminCustomer[]>(`/admin/customers${qs}`, { cache: "no-store" });
    return result as ApiResponse<AdminCustomer[]>;
  },

  // Withdrawals
  async getWithdrawals(): Promise<ApiResponse<any>> {
    const result = await request<any>("/admin/withdrawals", { cache: "no-store" });
    return result as ApiResponse<any>;
  },

  async getWithdrawalDetail(id: number | string): Promise<ApiResponse<any>> {
    const result = await request<any>(`/admin/withdrawals/${id}`, { cache: "no-store" });
    return result as ApiResponse<any>;
  },

  async approveWithdrawal(id: number | string): Promise<ApiResponse<any>> {
    const result = await request<any>(`/admin/withdrawals/${id}/approve`, {
      method: "PUT",
    });
    return result as ApiResponse<any>;
  },

  async rejectWithdrawal(id: number | string): Promise<ApiResponse<any>> {
    const result = await request<any>(`/admin/withdrawals/${id}/reject`, {
      method: "PUT",
    });
    return result as ApiResponse<any>;
  },
};

// ==========================================
// 12. LOGISTICS & SHIPPING SERVICE
// ==========================================
export type ShippingMethod = {
  id: string;
  name: string;
  description: string;
  fee: number;
  estimated_delivery: string;
  badge?: string | null;
  ghn_data?: {
    main_fee: number;
    insurance_fee: number;
    estimated_delivery_time: string | null;
  } | null;
};

export type ShippingCalculationResult = {
  city: string;
  district?: string;
  ward?: string;
  is_freeship_eligible: boolean;
  source?: string;
  methods: ShippingMethod[];
};

// GHN Types
export type GhnProvince = {
  id: number;
  name: string;
  code: string;
  name_extension?: string[];
};

export type GhnDistrict = {
  id: number;
  name: string;
  code: string;
  province_id: number;
};

export type GhnWard = {
  id: string;
  name: string;
  code: string;
  district_id: number;
};

export type GhnFeeRequest = {
  to_district_id: number;
  to_ward_code: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  insurance_value?: number;
  service_type_id?: number; // 2=Standard, 5=Express
  cod?: boolean;
};

export type GhnFeeResponse = {
  total_fee: number;
  main_fee: number;
  insurance_fee: number;
  cod_fee: number;
  vat: number;
  estimated_delivery_time: string | null;
  service_type_id: number;
};

export type GhnBothServicesResponse = {
  standard: GhnFeeResponse | null;
  express: GhnFeeResponse | null;
};

export const shippingService = {
  async calculate(city: string, subtotal: number): Promise<ApiResponse<ShippingCalculationResult>> {
    const result = await request<ShippingCalculationResult>("/shipping/calculate", {
      method: "POST",
      body: JSON.stringify({ city, subtotal }),
    });
    return result as ApiResponse<ShippingCalculationResult>;
  },

  // GHN Master Data APIs
  async getProvinces(): Promise<ApiResponse<GhnProvince[]>> {
    const result = await request<GhnProvince[]>("/shipping/provinces", {
      method: "GET",
      cache: "no-store",
    });
    return result as ApiResponse<GhnProvince[]>;
  },

  async getDistricts(provinceId: number): Promise<ApiResponse<GhnDistrict[]>> {
    const result = await request<GhnDistrict[]>(`/shipping/districts?province_id=${provinceId}`, {
      method: "GET",
      cache: "no-store",
    });
    return result as ApiResponse<GhnDistrict[]>;
  },

  async getWards(districtId: number): Promise<ApiResponse<GhnWard[]>> {
    const result = await request<GhnWard[]>(`/shipping/wards?district_id=${districtId}`, {
      method: "GET",
      cache: "no-store",
    });
    return result as ApiResponse<GhnWard[]>;
  },

  // GHN Fee Calculation
  async calculateFee(data: GhnFeeRequest): Promise<ApiResponse<GhnFeeResponse>> {
    const result = await request<GhnFeeResponse>("/shipping/fee", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<GhnFeeResponse>;
  },

  async calculateBothServices(data: Omit<GhnFeeRequest, "service_type_id">): Promise<ApiResponse<GhnBothServicesResponse>> {
    const result = await request<GhnBothServicesResponse>("/shipping/fee/both", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<GhnBothServicesResponse>;
  },
};

// ==========================================
// 13. VISUAL SEARCH & AI SPATIAL ROOM STAGING
// ==========================================
export type VisualSearchProductMatch = {
  id: number;
  name: string;
  slug: string;
  price: number;
  original_price?: number | null;
  category_name: string;
  image: string;
  material: string;
  similarity_score: number;
  dimensions?: string;
  match_reason: string;
  default_scale?: number;
};

export type SpatialStagingResult = {
  detected_room_type: string;
  estimated_area: string;
  recommended_type: string;
  lighting_analysis: string;
  color_palette: string[];
  matches_count: number;
  products: VisualSearchProductMatch[];
};

export type VisualSearchResult = SpatialStagingResult;

export type AiColorPaletteItem = {
  name: string;
  hex: string;
};

export type AiComboItem = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: string;
  material: string;
  dimensions: string;
  image: string;
  role: string;
  reason: string;
};

export type AiRoomAnalysisResult = {
  preset_id: string;
  detected_room_type: string;
  detected_style: string;
  estimated_area: string;
  lighting_analysis: string;
  architect_advice: string;
  color_palette: AiColorPaletteItem[];
  confidence_score: number;
  combo_package: {
    name: string;
    discount_percent: number;
    original_total: number;
    combo_price: number;
    savings: number;
    items: AiComboItem[];
  };
};

export const spatialRoomService = {
  async search(params: {
    prompt?: string;
    style?: string;
    category?: string;
    room_type?: string;
  }): Promise<ApiResponse<SpatialStagingResult>> {
    const result = await request<SpatialStagingResult>("/visual-search", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return result as ApiResponse<SpatialStagingResult>;
  },
};

export const aiRoomStylistService = {
  async analyze(params: {
    preset_id?: string;
    prompt?: string;
    image_base64?: string;
  }): Promise<ApiResponse<AiRoomAnalysisResult>> {
    const result = await request<AiRoomAnalysisResult>("/visual-search/analyze-room", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return result as ApiResponse<AiRoomAnalysisResult>;
  },
};

export const visualSearchService = {
  async search(style: string = "nordic", tag: string = ""): Promise<ApiResponse<SpatialStagingResult>> {
    return spatialRoomService.search({ prompt: tag, style });
  },
};

// ==========================================
// 14. AFFILIATE & CTV SERVICE
// ==========================================
export type AffiliateStats = {
  referral_code: string;
  referral_link: string;
  commission_rate: number;
  total_earned: number;
  available_balance: number;
  pending_balance: number;
  total_orders_referred: number;
  clicks_count: number;
  commissions: {
    id: number;
    order_amount: number;
    commission_amount: number;
    status: string;
    created_at: string;
  }[];
};

export type WithdrawalRecord = {
  id: number;
  user_id: number;
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  status: "pending" | "approved" | "rejected";
  admin_notes?: string;
  processed_at?: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
};

export const affiliateService = {
  async getStats(): Promise<ApiResponse<AffiliateStats>> {
    const result = await request<AffiliateStats>("/affiliate/stats", { cache: "no-store" });
    return result as ApiResponse<AffiliateStats>;
  },

  async requestWithdrawal(data: {
    amount: number;
    bank_name: string;
    account_number: string;
    account_holder: string;
  }): Promise<ApiResponse<null>> {
    const result = await request<null>("/affiliate/withdraw", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<null>;
  },

  async getWithdrawalHistory(): Promise<ApiResponse<{ data: WithdrawalRecord[]; total: number; last_page: number; current_page: number }>> {
    const result = await request<{ data: WithdrawalRecord[]; total: number; last_page: number; current_page: number }>("/affiliate/withdrawals", { cache: "no-store" });
    return result as ApiResponse<{ data: WithdrawalRecord[]; total: number; last_page: number; current_page: number }>;
  },
};

// ==========================================
// 15b. ADMIN WITHDRAWAL SERVICE
// ==========================================
export const adminWithdrawalService = {
  async list(params?: { status?: string; search?: string; page?: number }): Promise<ApiResponse<{ data: WithdrawalRecord[]; total: number; last_page: number; current_page: number }>> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "all") query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    const result = await request<{ data: WithdrawalRecord[]; total: number; last_page: number; current_page: number }>(`/admin/withdrawals?${query.toString()}`, { cache: "no-store" });
    return result as ApiResponse<{ data: WithdrawalRecord[]; total: number; last_page: number; current_page: number }>;
  },

  async approve(id: number, adminNotes?: string): Promise<ApiResponse<WithdrawalRecord>> {
    const result = await request<WithdrawalRecord>(`/admin/withdrawals/${id}/approve`, {
      method: "PUT",
      body: JSON.stringify({ admin_notes: adminNotes }),
    });
    return result as ApiResponse<WithdrawalRecord>;
  },

  async reject(id: number, adminNotes: string): Promise<ApiResponse<WithdrawalRecord>> {
    const result = await request<WithdrawalRecord>(`/admin/withdrawals/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ admin_notes: adminNotes }),
    });
    return result as ApiResponse<WithdrawalRecord>;
  },
};

// ==========================================
// 15. VENDOR & SHOP SERVICE
// ==========================================
export type VendorShopStats = {
  shop_name: string;
  shop_rating: number;
  response_rate: string;
  total_products: number;
  total_orders: number;
  monthly_revenue: number;
  fulfillment_rate: string;
  recent_payouts: {
    id: number;
    date: string;
    amount: number;
    status: string;
    bank: string;
  }[];
};

export const vendorService = {
  async registerShop(data: {
    shop_name: string;
    shop_description: string;
    phone: string;
    address: string;
  }): Promise<ApiResponse<{ user: ApiUser }>> {
    const result = await request<{ user: ApiUser }>("/vendor/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result as ApiResponse<{ user: ApiUser }>;
  },

  async getStats(): Promise<ApiResponse<VendorShopStats>> {
    const result = await request<VendorShopStats>("/vendor/stats", { cache: "no-store" });
    return result as ApiResponse<VendorShopStats>;
  },
};

