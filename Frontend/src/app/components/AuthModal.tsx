import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Mail, Lock, User, Phone, MapPin, Eye, EyeOff,
  Loader2, CheckCircle2, Shield, Sparkles, ArrowRight, ArrowLeft, KeyRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

const CITIES = ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Biên Hòa", "Huế", "Nha Trang"];

export function AuthModal({ open, onClose, defaultTab = "login" }: AuthModalProps) {
  const { login, register, sendResetCode, verifyResetCode, resetPassword } = useAuth();
  const [tab, setTab] = useState<"login" | "register" | "forgot-password">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [success, setSuccess] = useState(false);

  // Login form
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Register form
  const [regData, setRegData] = useState({
    name: "", email: "", password: "", confirmPassword: "", phone: "", city: "",
  });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  // Forgot password form
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotData, setForgotData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [forgotErrors, setForgotErrors] = useState<Record<string, string>>({});
  const [generatedCode, setGeneratedCode] = useState("");

  const resetAll = () => {
    setLoginData({ email: "", password: "" });
    setRegData({ name: "", email: "", password: "", confirmPassword: "", phone: "", city: "" });
    setForgotData({ email: "", code: "", newPassword: "", confirmNewPassword: "" });
    setLoginErrors({});
    setRegErrors({});
    setForgotErrors({});
    setSuccess(false);
    setShowPass(false);
    setShowConfirmPass(false);
    setForgotStep(1);
    setGeneratedCode("");
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetAll, 300);
  };

  const switchTab = (t: "login" | "register" | "forgot-password") => {
    setTab(t);
    resetAll();
  };

  const validateLogin = () => {
    const errs: Record<string, string> = {};
    if (!loginData.email) errs.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(loginData.email)) errs.email = "Email không hợp lệ";
    if (!loginData.password) errs.password = "Vui lòng nhập mật khẩu";
    setLoginErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateRegister = () => {
    const errs: Record<string, string> = {};
    if (!regData.name.trim()) errs.name = "Vui lòng nhập họ tên";
    if (!regData.email) errs.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(regData.email)) errs.email = "Email không hợp lệ";
    if (!regData.password) errs.password = "Vui lòng nhập mật khẩu";
    else if (regData.password.length < 6) errs.password = "Mật khẩu tối thiểu 6 ký tự";
    if (regData.password !== regData.confirmPassword) errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    setLoading(true);
    const res = await login(loginData.email, loginData.password);
    setLoading(false);
    if (res.success) {
      setSuccess(true);
      toast.success("Đăng nhập thành công! Chào mừng bạn trở lại 👋");
      setTimeout(handleClose, 1200);
    } else {
      setLoginErrors({ general: res.error || "Đăng nhập thất bại" });
    }
  };

  const handleRegister = async () => {
    if (!validateRegister()) return;
    setLoading(true);
    const res = await register({
      name: regData.name,
      email: regData.email,
      password: regData.password,
      phone: regData.phone,
      city: regData.city,
    });
    setLoading(false);
    if (res.success) {
      setSuccess(true);
      toast.success("Đăng ký thành công! Chào mừng bạn đến với BáoCáoVN 🎉");
      setTimeout(handleClose, 1400);
    } else {
      setRegErrors({ general: res.error || "Đăng ký thất bại" });
    }
  };

  const handleForgotStep1 = async () => {
    const errs: Record<string, string> = {};
    if (!forgotData.email) errs.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(forgotData.email)) errs.email = "Email không hợp lệ";
    setForgotErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const res = await sendResetCode(forgotData.email);
    setLoading(false);
    if (res.success) {
      setGeneratedCode(res.code || "");
      setForgotStep(2);
      toast.success(`Mã xác thực đã được gửi đến ${forgotData.email}. Mã của bạn là: ${res.code}`);
    } else {
      setForgotErrors({ general: res.error || "Gửi mã thất bại" });
    }
  };

  const handleForgotStep2 = async () => {
    const errs: Record<string, string> = {};
    if (!forgotData.code) errs.code = "Vui lòng nhập mã xác thực";
    else if (forgotData.code.length !== 6) errs.code = "Mã xác thực phải có 6 chữ số";
    setForgotErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const res = await verifyResetCode(forgotData.email, forgotData.code);
    setLoading(false);
    if (res.success) {
      setForgotStep(3);
      toast.success("Mã xác thực đúng! Vui lòng nhập mật khẩu mới");
    } else {
      setForgotErrors({ general: res.error || "Xác thực thất bại" });
    }
  };

  const handleForgotStep3 = async () => {
    const errs: Record<string, string> = {};
    if (!forgotData.newPassword) errs.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (forgotData.newPassword.length < 6) errs.newPassword = "Mật khẩu tối thiểu 6 ký tự";
    if (forgotData.newPassword !== forgotData.confirmNewPassword) errs.confirmNewPassword = "Mật khẩu xác nhận không khớp";
    setForgotErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const res = await resetPassword(forgotData.email, forgotData.code, forgotData.newPassword);
    setLoading(false);
    if (res.success) {
      setSuccess(true);
      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại");
      setTimeout(() => {
        switchTab("login");
        handleClose();
      }, 1500);
    } else {
      setForgotErrors({ general: res.error || "Đổi mật khẩu thất bại" });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Decorative top */}
            <div className="h-2 w-full bg-gradient-to-r from-red-500 via-orange-400 to-red-600" />

            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
            >
              <X size={16} className="text-gray-500" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Logo */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg">
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <span className="font-black text-[#1a1a2e] text-lg">Báo Cáo</span>
                  <span className="font-black text-red-600 text-lg">VN</span>
                </div>
              </div>

              {/* Success State */}
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-10 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4"
                    >
                      <CheckCircle2 size={40} className="text-green-500" />
                    </motion.div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">
                      {tab === "login" ? "Đăng nhập thành công!" : tab === "register" ? "Đăng ký thành công!" : "Đổi mật khẩu thành công!"}
                    </h3>
                    <p className="text-gray-500 text-sm">Đang chuyển hướng...</p>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6">
                      {(["login", "register"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => switchTab(t)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {t === "login" ? "Đăng nhập" : "Đăng ký"}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {tab === "login" ? (
                        <motion.div
                          key="login"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4"
                        >
                          <div>
                            <h2 className="text-2xl font-black text-gray-900">Chào mừng trở lại!</h2>
                            <p className="text-gray-500 text-sm mt-1">Đăng nhập để báo cáo và theo dõi vấn đề</p>
                          </div>

                          {loginErrors.general && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm"
                            >
                              <X size={14} />
                              {loginErrors.general}
                            </motion.div>
                          )}

                          <InputField
                            icon={Mail}
                            type="email"
                            placeholder="Email của bạn"
                            value={loginData.email}
                            onChange={(v) => setLoginData((d) => ({ ...d, email: v }))}
                            error={loginErrors.email}
                          />
                          <InputField
                            icon={Lock}
                            type={showPass ? "text" : "password"}
                            placeholder="Mật khẩu"
                            value={loginData.password}
                            onChange={(v) => setLoginData((d) => ({ ...d, password: v }))}
                            error={loginErrors.password}
                            rightIcon={
                              <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600">
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            }
                          />

                          <div className="text-right">
                            <button className="text-sm text-red-600 hover:underline" onClick={() => switchTab("forgot-password")}>Quên mật khẩu?</button>
                          </div>

                          <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:scale-100"
                          >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                          </button>

                          <div className="relative flex items-center gap-3 py-2">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400">hoặc đăng nhập với</span>
                            <div className="flex-1 h-px bg-gray-200" />
                          </div>

                          <button
                            onClick={() => toast.info("Đăng nhập với Google sẽ sớm ra mắt!")}
                            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                          >
                            🔵 Google
                          </button>

                          <p className="text-center text-sm text-gray-500">
                            Chưa có tài khoản?{" "}
                            <button onClick={() => switchTab("register")} className="text-red-600 font-semibold hover:underline">
                              Đăng ký ngay
                            </button>
                          </p>
                        </motion.div>
                      ) : tab === "register" ? (
                        <motion.div
                          key="register"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-3"
                        >
                          <div>
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                              Tạo tài khoản
                              <Sparkles size={20} className="text-yellow-400" />
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">Tham gia cộng đồng xây dựng Việt Nam tốt đẹp hơn</p>
                          </div>

                          {regErrors.general && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm"
                            >
                              <X size={14} />
                              {regErrors.general}
                            </motion.div>
                          )}

                          <InputField
                            icon={User}
                            placeholder="Họ và tên"
                            value={regData.name}
                            onChange={(v) => setRegData((d) => ({ ...d, name: v }))}
                            error={regErrors.name}
                          />
                          <InputField
                            icon={Mail}
                            type="email"
                            placeholder="Email"
                            value={regData.email}
                            onChange={(v) => setRegData((d) => ({ ...d, email: v }))}
                            error={regErrors.email}
                          />
                          <InputField
                            icon={Lock}
                            type={showPass ? "text" : "password"}
                            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                            value={regData.password}
                            onChange={(v) => setRegData((d) => ({ ...d, password: v }))}
                            error={regErrors.password}
                            rightIcon={
                              <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600">
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            }
                          />
                          <InputField
                            icon={Lock}
                            type={showConfirmPass ? "text" : "password"}
                            placeholder="Xác nhận mật khẩu"
                            value={regData.confirmPassword}
                            onChange={(v) => setRegData((d) => ({ ...d, confirmPassword: v }))}
                            error={regErrors.confirmPassword}
                            rightIcon={
                              <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="text-gray-400 hover:text-gray-600">
                                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            }
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <InputField
                              icon={Phone}
                              placeholder="Số điện thoại"
                              value={regData.phone}
                              onChange={(v) => setRegData((d) => ({ ...d, phone: v }))}
                            />
                            <div className="relative">
                              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                              <select
                                value={regData.city}
                                onChange={(e) => setRegData((d) => ({ ...d, city: e.target.value }))}
                                className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all text-sm bg-white text-gray-600"
                              >
                                <option value="">Tỉnh/Thành</option>
                                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>

                          {/* Password strength */}
                          {regData.password && (
                            <PasswordStrength password={regData.password} />
                          )}

                          <button
                            onClick={handleRegister}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:scale-100"
                          >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                          </button>

                          <p className="text-center text-sm text-gray-500">
                            Đã có tài khoản?{" "}
                            <button onClick={() => switchTab("login")} className="text-red-600 font-semibold hover:underline">
                              Đăng nhập
                            </button>
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="forgot-password"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4"
                        >
                          {/* Back button */}
                          <button
                            onClick={() => switchTab("login")}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
                          >
                            <ArrowLeft size={14} />
                            Quay lại đăng nhập
                          </button>

                          <div>
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                              <KeyRound size={24} className="text-red-600" />
                              Khôi phục mật khẩu
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">
                              {forgotStep === 1 && "Nhập email để nhận mã xác thực"}
                              {forgotStep === 2 && "Nhập mã xác thực đã gửi đến email"}
                              {forgotStep === 3 && "Nhập mật khẩu mới của bạn"}
                            </p>
                          </div>

                          {/* Progress indicator */}
                          <div className="flex items-center gap-2">
                            {[1, 2, 3].map((step) => (
                              <div key={step} className="flex items-center flex-1">
                                <div
                                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                                    step <= forgotStep ? "bg-red-500" : "bg-gray-200"
                                  }`}
                                />
                              </div>
                            ))}
                          </div>

                          {forgotErrors.general && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm"
                            >
                              <X size={14} />
                              {forgotErrors.general}
                            </motion.div>
                          )}

                          <AnimatePresence mode="wait">
                            {forgotStep === 1 && (
                              <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-4"
                              >
                                <InputField
                                  icon={Mail}
                                  type="email"
                                  placeholder="Email đã đăng ký"
                                  value={forgotData.email}
                                  onChange={(v) => setForgotData((d) => ({ ...d, email: v }))}
                                  error={forgotErrors.email}
                                />

                                <button
                                  onClick={handleForgotStep1}
                                  disabled={loading}
                                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:scale-100"
                                >
                                  {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                                  {loading ? "Đang gửi..." : "Gửi mã xác thực"}
                                </button>
                              </motion.div>
                            )}

                            {forgotStep === 2 && (
                              <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-4"
                              >
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                  <p className="text-sm text-blue-900">
                                    📧 Mã xác thực đã được gửi đến <span className="font-semibold">{forgotData.email}</span>
                                  </p>
                                  {generatedCode && (
                                    <p className="text-xs text-blue-700 mt-2 font-mono bg-white px-2 py-1 rounded">
                                      Mã xác thực: {generatedCode}
                                    </p>
                                  )}
                                </div>

                                <InputField
                                  icon={KeyRound}
                                  type="text"
                                  placeholder="Nhập mã 6 chữ số"
                                  value={forgotData.code}
                                  onChange={(v) => setForgotData((d) => ({ ...d, code: v }))}
                                  error={forgotErrors.code}
                                />

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setForgotStep(1)}
                                    className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                  >
                                    Quay lại
                                  </button>
                                  <button
                                    onClick={handleForgotStep2}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:scale-100"
                                  >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                                    {loading ? "Đang xác thực..." : "Xác thực"}
                                  </button>
                                </div>
                              </motion.div>
                            )}

                            {forgotStep === 3 && (
                              <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-4"
                              >
                                <InputField
                                  icon={Lock}
                                  type={showPass ? "text" : "password"}
                                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                                  value={forgotData.newPassword}
                                  onChange={(v) => setForgotData((d) => ({ ...d, newPassword: v }))}
                                  error={forgotErrors.newPassword}
                                  rightIcon={
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600">
                                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                  }
                                />
                                <InputField
                                  icon={Lock}
                                  type={showConfirmPass ? "text" : "password"}
                                  placeholder="Xác nhận mật khẩu mới"
                                  value={forgotData.confirmNewPassword}
                                  onChange={(v) => setForgotData((d) => ({ ...d, confirmNewPassword: v }))}
                                  error={forgotErrors.confirmNewPassword}
                                  rightIcon={
                                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="text-gray-400 hover:text-gray-600">
                                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                  }
                                />

                                {forgotData.newPassword && (
                                  <PasswordStrength password={forgotData.newPassword} />
                                )}

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setForgotStep(2)}
                                    className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                  >
                                    Quay lại
                                  </button>
                                  <button
                                    onClick={handleForgotStep3}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:scale-100"
                                  >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                    {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function InputField({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  rightIcon,
}: {
  icon: any;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  rightIcon?: React.ReactNode;
}) {
  return (
    <div>
      <div className={`relative flex items-center border rounded-xl transition-all duration-200 ${error ? "border-red-300 bg-red-50" : "border-gray-200 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100"}`}>
        <Icon size={16} className={`absolute left-3.5 ${error ? "text-red-400" : "text-gray-400"} flex-shrink-0`} />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-10 py-3 bg-transparent rounded-xl focus:outline-none text-sm text-gray-800 placeholder-gray-400"
        />
        {rightIcon && <div className="absolute right-3.5">{rightIcon}</div>}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-1 ml-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "Ít nhất 6 ký tự", ok: password.length >= 6 },
    { label: "Chữ hoa", ok: /[A-Z]/.test(password) },
    { label: "Số", ok: /[0-9]/.test(password) },
    { label: "Ký tự đặc biệt", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const strength = checks.filter((c) => c.ok).length;
  const colors = ["#ef4444", "#f97316", "#eab308", "#10b981"];
  const labels = ["Yếu", "Trung bình", "Khá", "Mạnh"];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="space-y-2"
    >
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-all duration-300"
            style={{ backgroundColor: i < strength ? colors[strength - 1] : "#e5e7eb" }}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className="text-xs" style={{ color: colors[strength - 1] }}>
          Độ bảo mật: {labels[strength - 1]}
        </p>
      )}
    </motion.div>
  );
}