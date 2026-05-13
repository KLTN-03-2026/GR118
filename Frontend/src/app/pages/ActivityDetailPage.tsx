import { useParams, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  Clock,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
  Send,
} from "lucide-react";
import { useState } from "react";
import { useActivities } from "../context/ActivitiesContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { PageTitle } from "../components/PageTitle";
import { IssueMap } from "../components/IssueMap";

export function ActivityDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { activities, getActivityParticipants, registerForActivity, getUserParticipations } =
    useActivities();
  const activity = activities.find((a) => a.id === id);
  const participants = activity ? getActivityParticipants(activity.id) : [];
  const userParticipations = user ? getUserParticipations(user.id) : [];
  const isRegistered = userParticipations.some(
    (p) => p.activityId === id && p.status === "registered"
  );

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    city: user?.city || "",
    note: "",
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    city?: string;
  }>({});

  if (!activity) {
    return (
      <div className="min-h-screen pt-28 flex flex-col items-center justify-center text-gray-400">
        <AlertCircle size={48} className="mb-4" />
        <p className="text-lg font-medium">Không tìm thấy hoạt động này</p>
        <Link to="/activities" className="mt-4 text-green-500 hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const isFull = activity.currentParticipants >= activity.maxParticipants;
  const canRegister =
    activity.registrationOpen && !isFull && activity.status === "upcoming" && !isRegistered;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: { label: "Sắp diễn ra", className: "bg-blue-500" },
      ongoing: { label: "Đang diễn ra", className: "bg-green-500" },
      completed: { label: "Đã kết thúc", className: "bg-gray-500" },
    };
    return badges[status as keyof typeof badges] || badges.upcoming;
  };

  const statusBadge = getStatusBadge(activity.status);

  const handleRegister = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đăng ký tham gia");
      return;
    }
    setShowRegisterModal(true);
  };

  const handleSubmitRegistration = () => {
    if (!user) return;

    const errors: {
      name?: string;
      phone?: string;
      email?: string;
      city?: string;
    } = {};

    if (!formData.name.trim()) {
      errors.name = "Vui lòng nhập họ tên";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Vui lòng nhập số điện thoại";
    }

    if (!formData.email.trim()) {
      errors.email = "Vui lòng nhập email";
    }

    if (!formData.city.trim()) {
      errors.city = "Vui lòng nhập tỉnh/thành";
    }

    // Validate phone number for VN format: 0xxxxxxxxx or +84xxxxxxxxx
    const normalizedPhone = formData.phone.trim().replace(/[\s.-]/g, "");
    const isLocalPhone = /^0\d{9}$/.test(normalizedPhone);
    const isIntlPhone = /^\+84\d{9}$/.test(normalizedPhone);
    if (formData.phone.trim() && !isLocalPhone && !isIntlPhone) {
      errors.phone = "Số điện thoại phải đủ 10 số (hoặc +84 và 9 số)";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email.trim() && !emailRegex.test(formData.email.trim())) {
      errors.email = "Email không hợp lệ";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }

    setFormErrors({});

    registerForActivity(activity.id, {
      activityId: activity.id,
      userId: user.id,
      userName: formData.name.trim(),
      userPhone: formData.phone.trim(),
      userEmail: formData.email.trim(),
      userCity: formData.city.trim(),
      userAvatar: user.avatar,
      note: formData.note.trim(),
    });

    toast.success("Đăng ký tham gia thành công!");
    setShowRegisterModal(false);
    setFormData({
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || "",
      city: user?.city || "",
      note: "",
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6">
        <PageTitle title={activity.title} backTo="/activities" className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100"
            >
              <div className="relative h-72">
                <img src={activity.imageUrl} alt={activity.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="flex gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-white text-sm font-semibold ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                    {activity.tags && activity.tags.slice(0, 2).map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-medium border border-white/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} className="text-blue-500" />
                    <div>
                      <div className="font-semibold">Thời gian bắt đầu</div>
                      <div className="text-gray-500">{formatDate(activity.startDate)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} className="text-orange-500" />
                    <div>
                      <div className="font-semibold">Thời gian kết thúc</div>
                      <div className="text-gray-500">{formatDate(activity.endDate)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-red-500" />
                    <div>
                      <div className="font-semibold">Địa điểm</div>
                      <div className="text-gray-500">{activity.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={16} className="text-green-500" />
                    <div>
                      <div className="font-semibold">Số lượng</div>
                      <div className="text-gray-500">
                        {activity.currentParticipants}/{activity.maxParticipants} người
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Đã đăng ký</span>
                    <span className="font-semibold text-gray-900">
                      {Math.round((activity.currentParticipants / activity.maxParticipants) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(activity.currentParticipants / activity.maxParticipants) * 100}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`h-full rounded-full ${
                        isFull ? "bg-red-500" : "bg-gradient-to-r from-green-400 to-emerald-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Register Button */}
                {isRegistered ? (
                  <div className="flex items-center gap-2 px-6 py-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-xl font-semibold">
                    <CheckCircle2 size={20} />
                    Bạn đã đăng ký tham gia
                  </div>
                ) : canRegister ? (
                  <button
                    onClick={handleRegister}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-200"
                  >
                    <Heart size={20} />
                    Đăng ký tham gia
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-semibold text-center justify-center">
                    <AlertCircle size={20} />
                    {isFull ? "Đã đủ người đăng ký" : "Đóng đăng ký"}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Description & Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Mô tả chi tiết</h2>
              <div className="prose prose-sm max-w-none text-gray-700">
                <p className="mb-4">{activity.description}</p>
                <div dangerouslySetInnerHTML={{ __html: activity.content }} />
              </div> 
            </motion.div>

            {/* Organizer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h3 className="font-bold text-gray-900 mb-3">Người tổ chức</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                  {activity.creatorName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{activity.creatorName}</div>
                  <div className="text-sm text-gray-500">
                    Tạo: {new Date(activity.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Map */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-red-500" />
                Vị trí tổ chức
              </h3>
              <IssueMap
                lat={activity.lat}
                lng={activity.lng}
                title={activity.title}
                location={`${activity.location}, ${activity.district}, ${activity.city}`}
              />
            </motion.div>

            {/* Participants Count */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <Users size={20} className="text-green-600" />
                <h3 className="font-bold text-gray-900">Người tham gia</h3>
              </div>
              <div className="text-4xl font-black text-green-600 mb-1">
                {activity.currentParticipants}
              </div>
              <div className="text-sm text-gray-600">
                / {activity.maxParticipants} người đăng ký
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowRegisterModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100">
                    <Heart size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Đăng ký tham gia</h3>
                    <p className="text-sm text-gray-500">Điền thông tin của bạn</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                    }}
                    placeholder="Nguyễn Văn A"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      formErrors.name
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-green-500 focus:ring-green-100"
                    }`}
                  />
                  {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
                    }}
                    placeholder="0901234567"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      formErrors.phone
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-green-500 focus:ring-green-100"
                    }`}
                  />
                  {formErrors.phone && <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                    }}
                    placeholder="example@email.com"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      formErrors.email
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-green-500 focus:ring-green-100"
                    }`}
                  />
                  {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tỉnh/Thành <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => {
                      setFormData({ ...formData, city: e.target.value });
                      if (formErrors.city) setFormErrors({ ...formErrors, city: undefined });
                    }}
                    placeholder="Ví dụ: TP. Ho Chi Minh"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      formErrors.city
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-green-500 focus:ring-green-100"
                    }`}
                  />
                  {formErrors.city && <p className="mt-1 text-sm text-red-500">{formErrors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ghi chú (Tùy chọn)
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Thông tin thêm (kinh nghiệm, kỹ năng đặc biệt...)"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 my-5">
                <div className="flex gap-3">
                  <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Lưu ý</p>
                    <p>
                      Thông tin của bạn sẽ được gửi đến ban tổ chức. Vui lòng kiểm tra kỹ trước khi đăng ký.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitRegistration}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                >
                  <Send size={18} />
                  Đăng ký
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}