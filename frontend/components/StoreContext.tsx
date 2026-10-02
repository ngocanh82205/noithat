"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  authService,
  voucherService,
  ApiUser,
  ApiProduct,
  ApiProductVariant,
  ApiVoucher,
} from "@/services/api";

export type CartItemType = {
  product: {
    id: number | string;
    name: string;
    price: number;
    image: string;
    category?: string;
  };
  variant?: {
    id: number;
    name: string;
    price?: number;
    color_name?: string;
    color_hex?: string;
    image_url?: string;
  } | null;
  quantity: number;
};

type StoreContextValue = {
  // Cart
  cart: CartItemType[];
  wishlist: string[];
  isCartOpen: boolean;
  addToCart: (product: any, variant?: any, quantity?: number) => void;
  removeFromCart: (productId: number | string, variantId?: number | null) => void;
  updateQuantity: (productId: number | string, quantity: number, variantId?: number | null) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string | number) => void;
  openCart: () => void;
  closeCart: () => void;
  cartCount: number;
  cartSubtotal: number;

  // Comparison
  comparisonList: any[];
  addToCompare: (product: any) => void;
  removeFromCompare: (productId: number | string) => void;
  clearCompare: () => void;
  isCompareOpen: boolean;
  openCompare: () => void;
  closeCompare: () => void;

  // Vouchers & Discounts
  appliedVoucher: ApiVoucher | null;
  discountAmount: number;
  applyVoucherCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removeVoucher: () => void;

  // Gamification & Coins
  userCoins: number;
  addCoins: (amount: number) => void;
  useCoins: boolean;
  setUseCoins: (use: boolean) => void;
  coinsDiscount: number;
  isWheelOpen: boolean;
  openWheel: () => void;
  closeWheel: () => void;

  // Visual Search & Affiliate
  isVisualSearchOpen: boolean;
  openVisualSearch: () => void;
  closeVisualSearch: () => void;
  isAffiliateOpen: boolean;
  openAffiliate: () => void;
  closeAffiliate: () => void;
  referralCode: string | null;

  // Auth
  user: ApiUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthOpen: boolean;
  authMode: "login" | "register";
  isAuthLoading: boolean;
  openAuth: (mode?: "login" | "register") => void;
  closeAuth: () => void;
  loginUser: (data: { email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  registerUser: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    address?: string;
  }) => Promise<{ success: boolean; message?: string; errors?: Record<string, string[]> }>;
  logoutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);

  // Comparison
  const [comparisonList, setComparisonList] = useState<any[]>([]);
  const [isCompareOpen, setCompareOpen] = useState(false);

  // Vouchers
  const [appliedVoucher, setAppliedVoucher] = useState<ApiVoucher | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Coins & Wheel
  const [userCoins, setUserCoins] = useState<number>(100);
  const [useCoins, setUseCoins] = useState<boolean>(false);
  const [isWheelOpen, setWheelOpen] = useState(false);

  // Visual Search & Affiliate
  const [isVisualSearchOpen, setVisualSearchOpen] = useState(false);
  const [isAffiliateOpen, setAffiliateOpen] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Auth states
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Load initial localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCart = localStorage.getItem("gs_cart");
        if (savedCart) setCart(JSON.parse(savedCart));

        const savedWishlist = localStorage.getItem("gs_wishlist");
        if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

        const savedCoins = localStorage.getItem("gs_coins");
        if (savedCoins) setUserCoins(parseInt(savedCoins) || 100);

        // Check URL for referral parameter (?ref=GS-XXXX)
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get("ref");
        if (refParam) {
          localStorage.setItem("gs_referral_code", refParam);
          setReferralCode(refParam);
        } else {
          const savedRef = localStorage.getItem("gs_referral_code");
          if (savedRef) setReferralCode(savedRef);
        }

        const savedToken = localStorage.getItem("gs_auth_token");
        const savedUser = localStorage.getItem("gs_auth_user");
        if (savedToken) {
          setToken(savedToken);
          if (savedUser) setUser(JSON.parse(savedUser));

          authService
            .getMe()
            .then((res) => {
              if (res.success && res.data?.user) {
                setUser(res.data.user);
                localStorage.setItem("gs_auth_user", JSON.stringify(res.data.user));
              } else {
                localStorage.removeItem("gs_auth_token");
                localStorage.removeItem("gs_auth_user");
                setToken(null);
                setUser(null);
              }
            })
            .catch(() => {
              localStorage.removeItem("gs_auth_token");
              localStorage.removeItem("gs_auth_user");
              setToken(null);
              setUser(null);
            });
        }
      } catch (e) {
        console.error("Failed to load store storage:", e);
      } finally {
        setIsAuthLoading(false);
      }
    }
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gs_cart", JSON.stringify(cart));
    }
  }, [cart]);

  // Sync wishlist to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gs_wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist]);

  // Khi đã đăng nhập, số dư xu lấy từ server (nguồn duy nhất mà checkout sử dụng)
  useEffect(() => {
    if (user && typeof user.coins === "number") {
      setUserCoins(user.coins);
    }
  }, [user]);

  // Sync coins
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gs_coins", userCoins.toString());
    }
  }, [userCoins]);

  // Cart operations
  const addToCart = useCallback((product: any, variant?: any, quantity: number = 1) => {
    const prodId = product.id;
    const variantId = variant?.id || null;
    const price = variant?.price || product.price;
    const image = variant?.image_url || product.images?.[0]?.image_url || product.image || "/images/sofa-1.jpg";

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (line) =>
          String(line.product.id) === String(prodId) &&
          (line.variant?.id || null) === variantId
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [
        ...prev,
        {
          product: {
            id: prodId,
            name: product.name,
            price: price,
            image: image,
            category: product.category?.name || product.category || "",
          },
          variant: variant
            ? {
                id: variant.id,
                name: variant.name,
                price: variant.price,
                color_name: variant.color_name,
                color_hex: variant.color_hex,
                image_url: variant.image_url,
              }
            : null,
          quantity: quantity,
        },
      ];
    });

    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((productId: number | string, variantId?: number | null) => {
    setCart((prev) =>
      prev.filter(
        (line) =>
          !(
            String(line.product.id) === String(productId) &&
            (line.variant?.id || null) === (variantId || null)
          )
      )
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: number | string, quantity: number, variantId?: number | null) => {
      if (quantity <= 0) {
        removeFromCart(productId, variantId);
        return;
      }

      setCart((prev) =>
        prev.map((line) => {
          if (
            String(line.product.id) === String(productId) &&
            (line.variant?.id || null) === (variantId || null)
          ) {
            return { ...line, quantity };
          }
          return line;
        })
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedVoucher(null);
    setDiscountAmount(0);
  }, []);

  const toggleWishlist = useCallback((productId: string | number) => {
    const idStr = String(productId);
    setWishlist((prev) =>
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    );
  }, []);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  // Comparison operations
  const addToCompare = useCallback((product: any) => {
    setComparisonList((prev) => {
      if (prev.some((p) => String(p.id) === String(product.id))) {
        return prev;
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), product];
      }
      return [...prev, product];
    });
    setCompareOpen(true);
  }, []);

  const removeFromCompare = useCallback((productId: number | string) => {
    setComparisonList((prev) => prev.filter((p) => String(p.id) !== String(productId)));
  }, []);

  const clearCompare = useCallback(() => {
    setComparisonList([]);
  }, []);

  const openCompare = useCallback(() => setCompareOpen(true), []);
  const closeCompare = useCallback(() => setCompareOpen(false), []);

  // Voucher operations
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity * line.product.price, 0),
    [cart]
  );

  const applyVoucherCode = useCallback(
    async (code: string) => {
      try {
        const res = await voucherService.applyVoucher(code, cartSubtotal);
        if (res.success && res.data) {
          setAppliedVoucher(res.data.voucher);
          setDiscountAmount(res.data.discount_amount);
          return { success: true, message: res.message || "Áp dụng mã thành công!" };
        }
        return { success: false, message: res.message || "Mã giảm giá không hợp lệ" };
      } catch (err: any) {
        return { success: false, message: err.message || "Không thể áp dụng mã giảm giá" };
      }
    },
    [cartSubtotal]
  );

  const removeVoucher = useCallback(() => {
    setAppliedVoucher(null);
    setDiscountAmount(0);
  }, []);

  // Gamification
  const addCoins = useCallback((amount: number) => {
    setUserCoins((prev) => Math.max(0, prev + amount));
  }, []);

  const openWheel = useCallback(() => setWheelOpen(true), []);
  const closeWheel = useCallback(() => setWheelOpen(false), []);

  // Auth Operations
  const openAuth = useCallback((mode: "login" | "register" = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const loginUser = useCallback(async (data: { email: string; password: string }) => {
    try {
      const res = await authService.login(data);
      if (res.success && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem("gs_auth_token", res.data.token);
        localStorage.setItem("gs_auth_user", JSON.stringify(res.data.user));
        setAuthOpen(false);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || "Đăng nhập không thành công" };
    } catch (err: any) {
      return { success: false, message: err.message || "Email hoặc mật khẩu không chính xác." };
    }
  }, []);

  const registerUser = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      phone?: string;
      address?: string;
    }) => {
      try {
        const res = await authService.register(data);
        if (res.success && res.data.token) {
          setToken(res.data.token);
          setUser(res.data.user);
          localStorage.setItem("gs_auth_token", res.data.token);
          localStorage.setItem("gs_auth_user", JSON.stringify(res.data.user));
          setAuthOpen(false);
          return { success: true, message: res.message };
        }
        return { success: false, message: res.message || "Đăng ký không thành công" };
      } catch (err: any) {
        return {
          success: false,
          message: err.message || "Đăng ký không thành công.",
          errors: err.errors,
        };
      }
    },
    []
  );

  const logoutUser = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem("gs_auth_token");
      localStorage.removeItem("gs_auth_user");
      setToken(null);
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authService.getMe();
      if (res.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem("gs_auth_user", JSON.stringify(res.data.user));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart]
  );

  const coinsDiscount = useMemo(() => {
    if (!useCoins || userCoins <= 0) return 0;
    // 1 coin = 1,000 VND, cap at 20% of subtotal or total coins
    // Làm tròn theo số xu nguyên để khớp với cách server tính (OrderController)
    const maxCoins = Math.floor((cartSubtotal * 0.2) / 1000);
    return Math.min(userCoins, maxCoins) * 1000;
  }, [useCoins, userCoins, cartSubtotal]);

  const value: StoreContextValue = {
    cart,
    wishlist,
    isCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleWishlist,
    openCart,
    closeCart,
    cartCount,
    cartSubtotal,

    comparisonList,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isCompareOpen,
    openCompare,
    closeCompare,

    appliedVoucher,
    discountAmount,
    applyVoucherCode,
    removeVoucher,

    userCoins,
    addCoins,
    useCoins,
    setUseCoins,
    coinsDiscount,
    isWheelOpen,
    openWheel: () => setWheelOpen(true),
    closeWheel: () => setWheelOpen(false),

    isVisualSearchOpen,
    openVisualSearch: () => setVisualSearchOpen(true),
    closeVisualSearch: () => setVisualSearchOpen(false),
    isAffiliateOpen,
    openAffiliate: () => setAffiliateOpen(true),
    closeAffiliate: () => setAffiliateOpen(false),
    referralCode,

    user,
    token,
    isAuthenticated: !!token && !!user,
    isAuthOpen,
    isAuthLoading,
    authMode,
    openAuth,
    closeAuth,
    loginUser,
    registerUser,
    logoutUser,
    refreshProfile,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore phải được dùng bên trong StoreProvider");
  }
  return ctx;
}
