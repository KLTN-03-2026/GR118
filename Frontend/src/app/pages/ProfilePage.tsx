import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  User, Mail, Phone, MapPin, Edit3, Save, LogOut, FileText,
  CheckCircle2, Star, Shield, Camera, Lock, Eye, EyeOff,
  KeyRound, ArrowRight, X, RefreshCw, CheckCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { useIssues } from "../context/IssuesContext";
import { AuthModal } from "../components/AuthModal";

// ─── Change Password Modal ────────────────────────────────────────────────────
type CPStep = "verify" | "otp" | "newpass" | "done";

function ChangePasswordModal({ open, onClose, email }: { open: boolean; onClose: () => void; email: string }) {
  const { sendChangePasswordOTP, changePassword } = useAuth();
  const [step, setStep] = useState<CPStep>("verify");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setStep("verify");
    setCurrentPassword("");
    setOtp("");
    setDevOtp(null);
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Step 1: Verify current password & send OTP
  const handleSendOTP = async () => {
    if (!currentPassword) { setError("Vui lòng nhập mật khẩu hiện tại"); return; }
    setError("");
    setLoading(true);
    const res = await sendChangePasswordOTP(email, currentPassword);
    setLoading(false);
    if (!res.success) { setError(res.error || "Có lỗi xảy ra"); return; }
    setDevOtp(res.code || null); // show OTP in demo (no real email)
    setStep("otp");
    toast.success("Mã OTP đã được gửi đến email của bạn!");
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { setError("Mã OTP gồm 6 chữ số"); return; }
    setError("");
    setStep("newpass");
  };

  // Step 3: Set new password
  const handleChangePassword = async () => {
    if (!newPassword) { setError("Vui lòng nhập mật khẩu mới"); return; }
    if (newPassword.length < 6) { setError("Mật khẩu mới phải có ít nhất 6 ký tự"); return; }
    if (newPassword !== confirmPassword) { setError("Xác nhận mật khẩu không khớp"); return; }
    setError("");
    setLoading(true);
    const res = await changePassword(email, otp, newPassword);
    setLoading(false);
    if (!res.success) { setError(res.error || "Có lỗi xảy ra"); return; }
    setStep("done");
  };

  const stepLabels = ["Xác minh", "Mã OTP", "Mật khẩu mới"];
  const stepIndex = step === "verify" ? 0 : step === "otp" ? 1 : step === "newpass" ? 2 : 3;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <div>
                <h2 className="font-black text-lg">Đổi mật khẩu</h2>
                <p className="text-red-100 text-xs">Bảo mật tài khoản của bạn</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Step indicator */}
          {step !== "done" && (
            <div className="flex items-center gap-2">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-1.5 flex-1 ${i > 0 ? "border-t-2 pt-0" : ""}`}>
                    {i > 0 && <div className={`flex-1 h-0.5 rounded-full ${i <= stepIndex ? "bg-white" : "bg-white/30"}`} />}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i < stepIndex ? "bg-white text-red-600" :
                      i === stepIndex ? "bg-white text-red-600 ring-2 ring-white/50" :
                      "bg-white/30 text-white/70"
                    }`}>
                      {i < stepIndex ? <CheckCircle size={14} /> : i + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* Step 1: Verify current password */}
            {step === "verify" && (
              <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-gray-500 text-sm mb-5">
                  Nhập mật khẩu hiện tại để xác minh danh tính. Sau đó chúng tôi sẽ gửi mã OTP đến email <span className="font-semibold text-gray-700">{email}</span>.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mật khẩu hiện tại</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                        placeholder="Nhập mật khẩu hiện tại"
                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                      <X size={14} className="flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:scale-100"
                  >
                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    {loading ? "Đang gửi OTP..." : "Gửi mã OTP"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Enter OTP */}
            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-gray-500 text-sm mb-5">
                  Mã OTP 6 chữ số đã được gửi đến email <span className="font-semibold text-gray-700">{email}</span>. Vui lòng kiểm tra hộp thư.
                </p>

                {/* Demo OTP hint */}
                {devOtp && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                    <KeyRound size={14} className="text-amber-600 flex-shrink-0" />
                    <p className="text-amber-700 text-xs">
                      <span className="font-semibold">Demo:</span> Mã OTP của bạn là <span className="font-black text-amber-800 tracking-widest">{devOtp}</span>
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mã OTP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                      placeholder="000000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                      <X size={14} className="flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleVerifyOTP}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all"
                  >
                    <ArrowRight size={16} />
                    Xác nhận OTP
                  </button>

                  <button
                    onClick={() => { setStep("verify"); setOtp(""); setError(""); }}
                    className="w-full py-2.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                  >
                    ← Quay lại
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: New password */}
            {step === "newpass" && (
              <motion.div key="newpass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-gray-500 text-sm mb-5">
                  Đặt mật khẩu mới cho tài khoản của bạn. Mật khẩu phải có ít nhất 6 ký tự.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mật khẩu mới</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ít nhất 6 ký tự"
                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent"
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {newPassword && (
                      <div className="mt-1.5 flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`flex-1 h-1 rounded-full transition-all ${
                            newPassword.length >= i * 3
                              ? newPassword.length >= 10 ? "bg-green-500" : newPassword.length >= 6 ? "bg-yellow-400" : "bg-red-400"
                              : "bg-gray-200"
                          }`} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Xác nhận mật khẩu mới</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                        placeholder="Nhập lại mật khẩu mới"
                        className={`w-full pl-10 pr-10 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent ${
                          confirmPassword && confirmPassword !== newPassword ? "border-red-300 bg-red-50" : "border-gray-200"
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword === newPassword && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={12} /> Mật khẩu khớp</p>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                      <X size={14} className="flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:scale-100"
                  >
                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Done */}
            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={40} className="text-green-500" />
                </div>
                <h3 className="font-black text-xl text-gray-900 mb-2">Đổi mật khẩu thành công!</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Mật khẩu tài khoản <span className="font-semibold">{email}</span> đã được cập nhật. Vui lòng sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.
                </p>
                <button
                  onClick={handleClose}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-200 hover:scale-[1.02] transition-all"
                >
                  Hoàn tất
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user, logout, updateProfile, uploadAvatar } = useAuth();
  const { issues } = useIssues();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [showAuth, setShowAuth] = useState(!user);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    city: user?.city || "",
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng và kích thước
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    setUploading(true);
    const res = await uploadAvatar(file);
    setUploading(false);

    if (res.success) {
      toast.success("Cập nhật ảnh đại diện thành công!");
    } else {
      toast.error(res.error || "Không thể tải ảnh lên");
    }
  };

  if (!user) {
    return (
      <>
        <div className="min-h-screen pt-20 flex flex-col items-center justify-center gap-4 text-center px-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <User size={36} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-700">Bạn chưa đăng nhập</h2>
          <p className="text-gray-500 text-sm">Đăng nhập để xem và quản lý hồ sơ của bạn</p>
          <button
            onClick={() => setShowAuth(true)}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg"
          >
            Đăng nhập ngay
          </button>
        </div>
        <AuthModal open={showAuth} onClose={() => { setShowAuth(false); navigate("/"); }} defaultTab="login" />
      </>
    );
  }

  const handleSave = () => {
    updateProfile(form);
    setEditing(false);
    toast.success("Đã cập nhật hồ sơ thành công!");
  };

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất thành công");
    navigate("/");
  };

  const userIssues = issues.slice(0, 2);

  const stats = [
    { label: "Báo cáo", value: user.reportsCount, icon: FileText, color: "#ef4444" },
    { label: "Đã giải quyết", value: user.resolvedCount, icon: CheckCircle2, color: "#10b981" },
    { label: "Điểm đóng góp", value: (user.reportsCount + user.resolvedCount) * 10, icon: Star, color: "#f59e0b" },
    { label: "Cấp độ", value: "Thành viên", icon: Shield, color: "#8b5cf6" },
  ];

  const joinDate = new Date(user.joinedAt).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const roleLabel = user.roleName || (user.role === "admin" ? "Quản trị viên" : user.role === "moderator" ? "Cán bộ" : "Công dân");
  const roleColor = user.role === "admin" ? "#ef4444" : user.role === "moderator" ? "#3b82f6" : "#10b981";

  return (
    <>
      <div className="min-h-screen pt-20 pb-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
          {/* Profile Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6"
          >
            {/* Cover */}
            <div className="h-28 bg-gradient-to-r from-red-500 via-orange-400 to-red-600 relative">
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
              />
            </div>

            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-4">
                {/* Avatar */}
                <div className="relative w-fit">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-red-100 ring-4 ring-white shadow-lg relative group">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className={`w-full h-full object-cover transition-opacity ${uploading ? "opacity-30" : "opacity-100"}`} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-red-600 text-3xl font-black">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <RefreshCw size={24} className="text-red-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <Camera size={13} />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {editing ? (
                    <>
                      <button
                        onClick={() => setEditing(false)}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors shadow-lg shadow-green-200"
                      >
                        <Save size={15} />
                        Lưu thay đổi
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        <Edit3 size={15} />
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => setShowChangePassword(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        <KeyRound size={15} />
                        Đổi mật khẩu
                      </button>
                      {/* <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        <LogOut size={15} />
                        Đăng xuất
                      </button> */}
                    </>
                  )}
                </div>
              </div>

              {/* Name & info */}
              {editing ? (
                <div className="space-y-3 max-w-md">
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="text-xl font-black w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                    placeholder="Họ và tên"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 text-sm"
                      placeholder="Số điện thoại"
                    />
                    <input
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 text-sm"
                      placeholder="Tỉnh / Thành phố"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-black text-gray-900">{user.name}</h1>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: roleColor }}
                    >
                      {roleLabel}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Mail size={14} className="text-red-400" /> {user.email}
                    </span>
                    {user.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone size={14} className="text-red-400" /> {user.phone}
                      </span>
                    )}
                    {user.city && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-red-400" /> {user.city}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Tham gia từ {joinDate}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Security Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6"
          >
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Shield size={18} className="text-blue-500" />
              Bảo mật tài khoản
            </h3>
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Lock size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Mật khẩu</p>
                  <p className="text-xs text-gray-500">••••••••••</p>
                </div>
              </div>
              <button
                onClick={() => setShowChangePassword(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <KeyRound size={12} />
                Đổi mật khẩu
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"
              >
                <div
                  className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: stat.color + "18" }}
                >
                  <stat.icon size={18} style={{ color: stat.color }} />
                </div>
                <div className="text-xl font-black text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Recent Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-red-500" />
              Báo cáo gần đây của tôi
            </h3>

            {userIssues.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <FileText size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Bạn chưa có báo cáo nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userIssues.map((issue) => (
                  <div key={issue.id} className="flex gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <img
                      src={issue.imageUrl}
                      alt={issue.title}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{issue.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                        <MapPin size={11} /> {issue.district}, {issue.city}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: { pending: "#f59e0b", processing: "#3b82f6", resolved: "#10b981", rejected: "#ef4444" }[issue.status] }}>
                          {{ pending: "Chờ xử lý", processing: "Đang xử lý", resolved: "Đã giải quyết", rejected: "Từ chối" }[issue.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePassword && (
          <ChangePasswordModal
            open={showChangePassword}
            onClose={() => setShowChangePassword(false)}
            email={user.email}
          />
        )}
      </AnimatePresence>
    </>
  );
}
