"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Mail, User, Phone, MapPin, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useStore } from "./StoreContext";

export default function AuthModal() {
  const { isAuthOpen, closeAuth, authMode, openAuth, loginUser, registerUser } = useStore();

  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Login form data
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Register form data
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    password_confirmation: "",
  });

  if (!isAuthOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    const res = await loginUser(loginData);
    setLoading(false);

    if (res.success) {
      setSuccessMessage("Đăng nhập thành công!");
      setTimeout(() => {
        closeAuth();
        setSuccessMessage("");
      }, 800);
    } else {
      setErrorMessage(res.message || "Email hoặc mật khẩu không chính xác.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setValidationErrors({});

    if (registerData.password !== registerData.password_confirmation) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    const res = await registerUser(registerData);
    setLoading(false);

    if (res.success) {
      setSuccessMessage("Đăng ký tài khoản thành công!");
      setTimeout(() => {
        closeAuth();
        setSuccessMessage("");
      }, 1000);
    } else {
      setErrorMessage(res.message || "Đăng ký không thành công.");
      if (res.errors) {
        setValidationErrors(res.errors);
      }
    }
  };

  const fillTestCustomer = () => {
    setLoginData({
      email: "customer@gmail.com",
      password: "Customer@123456",
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuth}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-beige border border-espresso/15 shadow-2xl p-6 sm:p-8 overflow-hidden z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={closeAuth}
            className="absolute top-5 right-5 p-2 text-espresso/60 hover:text-espresso transition-colors"
            aria-label="Đóng"
          >
            <X size={20} strokeWidth={1.5} />
          </button>

          {/* Header & Tabs */}
          <div className="text-center mb-6">
            <span className="font-serif text-2xl tracking-widest2 text-espresso block mb-2">
              GS LUXURY
            </span>
            <p className="text-xs text-espresso/60 tracking-wider">
              {authMode === "login"
                ? "Đăng nhập để xem hành trình đơn hàng và ưu đãi VIP"
                : "Tạo tài khoản thành viên để tận hưởng đặc quyền thượng lưu"}
            </p>
          </div>

          <div className="flex border-b border-espresso/15 mb-6">
            <button
              onClick={() => {
                openAuth("login");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2.5 text-xs tracking-widest2 uppercase transition-all duration-300 ${
                authMode === "login"
                  ? "border-b-2 border-espresso text-espresso font-medium"
                  : "text-espresso/50 hover:text-espresso"
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => {
                openAuth("register");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2.5 text-xs tracking-widest2 uppercase transition-all duration-300 ${
                authMode === "register"
                  ? "border-b-2 border-espresso text-espresso font-medium"
                  : "text-espresso/50 hover:text-espresso"
              }`}
            >
              Đăng Ký
            </button>
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs tracking-wide flex items-start gap-2"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs tracking-wide flex items-start gap-2"
            >
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* 1. LOGIN FORM */}
          {authMode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso/40" />
                  <input
                    type="email"
                    required
                    placeholder="customer@gmail.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="w-full bg-white/70 border border-espresso/15 pl-10 pr-4 py-2.5 text-xs tracking-wide focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] uppercase tracking-widest2 text-espresso/70">
                    Mật Khẩu
                  </label>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso/40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full bg-white/70 border border-espresso/15 pl-10 pr-10 py-2.5 text-xs tracking-wide focus:outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={fillTestCustomer}
                  className="text-[11px] text-gold hover:underline font-light"
                >
                  ⚡ Điền nhanh tài khoản mẫu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    alert("Để đặt lại mật khẩu, vui lòng liên hệ email: Dangnamson24@gmail.com hoặc gọi hotline: 1800 6868");
                  }}
                  className="text-[11px] text-espresso/50 hover:text-espresso underline font-light"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors duration-300 disabled:opacity-50 font-medium"
              >
                {loading ? "Đang xử lý..." : "Đăng Nhập"}
              </button>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {authMode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-1">
                  Họ và Tên *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso/40" />
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn An"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="w-full bg-white/70 border border-espresso/15 pl-10 pr-4 py-2.5 text-xs tracking-wide focus:outline-none focus:border-gold"
                  />
                </div>
                {validationErrors.name && (
                  <p className="text-[10px] text-red-600 mt-1">{validationErrors.name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso/40" />
                  <input
                    type="email"
                    required
                    placeholder="an.nguyen@example.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full bg-white/70 border border-espresso/15 pl-10 pr-4 py-2.5 text-xs tracking-wide focus:outline-none focus:border-gold"
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-[10px] text-red-600 mt-1">{validationErrors.email[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-1">
                    Số Điện Thoại
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40" />
                    <input
                      type="tel"
                      placeholder="0901234567"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      className="w-full bg-white/70 border border-espresso/15 pl-8 pr-2 py-2.5 text-xs tracking-wide focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-1">
                    Địa Chỉ
                  </label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40" />
                    <input
                      type="text"
                      placeholder="Số nhà, đường, thành phố"
                      value={registerData.address}
                      onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                      className="w-full bg-white/70 border border-espresso/15 pl-8 pr-2 py-2.5 text-xs tracking-wide focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-1">
                  Mật Khẩu * (Tối thiểu 6 ký tự)
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso/40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full bg-white/70 border border-espresso/15 pl-10 pr-10 py-2.5 text-xs tracking-wide focus:outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest2 text-espresso/70 mb-1">
                  Xác Nhận Mật Khẩu *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso/40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={registerData.password_confirmation}
                    onChange={(e) => setRegisterData({ ...registerData, password_confirmation: e.target.value })}
                    className="w-full bg-white/70 border border-espresso/15 pl-10 pr-4 py-2.5 text-xs tracking-wide focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-espresso text-beige text-xs tracking-widest2 uppercase hover:bg-gold transition-colors duration-300 disabled:opacity-50 font-medium"
              >
                {loading ? "Đang tạo tài khoản..." : "Đăng Ký Thành Viên"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
