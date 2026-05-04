import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Search,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useActivities } from "../context/ActivitiesContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { PageTitle } from "../components/PageTitle";
import { Skeleton, SkeletonCircle, SkeletonText } from "../components/ui/skeleton";
import { Card } from "../components/ui/card";
import { Activity, Participant } from "../data/activities";
import { LocationPicker } from "../components/LocationPicker";

export function ModeratorActivitiesPage() {
  const { user, can, isLoading } = useAuth();
  const { activities, addActivity, updateActivity, deleteActivity, getActivityParticipants } =
    useActivities();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 pt-20 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-3">
              <Skeleton width="300px" height="32px" />
              <Skeleton width="450px" height="16px" />
            </div>
            <Skeleton width="180px" height="44px" borderRadius="12px" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-0 border-0 shadow-sm bg-white overflow-hidden">
                <Skeleton width="100%" height="160px" />
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <Skeleton width="60%" height="20px" />
                    <Skeleton width="60px" height="20px" borderRadius="10px" />
                  </div>
                  <SkeletonText lines={2} />
                  <div className="flex justify-between border-t border-gray-50 pt-4">
                    <Skeleton width="80px" height="12px" />
                    <Skeleton width="80px" height="12px" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Dynamic permission guard
  if (!user || !can("activities_mgnt", "read")) {
    return (
      <div className="min-h-screen pt-28 flex flex-col items-center justify-center text-gray-400">
        <AlertCircle size={48} className="mb-4" />
        <p className="text-lg font-medium">Bạn không có quyền quản lý hoạt động tình nguyện</p>
        <Link to="/" className="mt-4 text-green-500 hover:underline">
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  const myActivities = activities.filter((a) => a.creatorId === user.id);

  const filtered = useMemo(() => {
    let list = [...myActivities];
    if (search) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.location.toLowerCase().includes(search.toLowerCase())
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [myActivities, search]);

  const handleToggleRegistration = (activity: Activity) => {
    updateActivity(activity.id, { registrationOpen: !activity.registrationOpen });
    toast.success(
      activity.registrationOpen ? "Đã đóng đăng ký" : "Đã mở đăng ký"
    );
  };

  const handleToggleStatus = (activity: Activity) => {
    const newStatus = activity.status === "hidden" ? "upcoming" : "hidden";
    updateActivity(activity.id, { status: newStatus });
    toast.success(newStatus === "hidden" ? "Đã ẩn hoạt động" : "Đã hiển thị hoạt động");
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa hoạt động này?")) {
      deleteActivity(id);
      toast.success("Đã xóa hoạt động");
    }
  };

  const handleViewParticipants = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowParticipantsModal(true);
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-8 mb-8"
        >
          <PageTitle
            title="Quản lý hoạt động tình nguyện"
            backTo=""
            subtitle={
              <div>
                <p>Tạo và quản lý các hoạt động của bạn</p>
                <p className="text-sm text-gray-400 mt-1">
                  <span className="font-semibold text-green-600">{filtered.length}</span> hoạt động
                </p>
              </div>
            }
            action={
              can("activities_mgnt", "create") && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-green-200 hover:scale-105 transition-transform duration-200"
                >
                  <Plus size={18} />
                  Tạo hoạt động mới
                </button>
              )
            }
          />
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm hoạt động..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all bg-white"
            />
          </div>
        </motion.div>

        {/* Activities List */}
        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((activity, i) => {
              const participants = getActivityParticipants(activity.id);
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-64 h-40 md:h-auto flex-shrink-0">
                      <img
                        src={activity.imageUrl}
                        alt={activity.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {activity.title}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {activity.description}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {activity.status === "hidden" && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                              Đã ẩn
                            </span>
                          )}
                          {activity.registrationOpen ? (
                            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                              Mở ĐK
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                              Đóng ĐK
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} className="text-blue-400" />
                          {new Date(activity.startDate).toLocaleDateString("vi-VN")}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin size={14} className="text-red-400 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {activity.location}, {activity.ward}, {activity.district}, {activity.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users size={14} className="text-green-400" />
                          {activity.currentParticipants}/{activity.maxParticipants}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleViewParticipants(activity)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Users size={14} />
                          Xem ĐK ({participants.length})
                        </button>
                        {can("activities_mgnt", "update") && (
                          <button
                            onClick={() => {
                              setSelectedActivity(activity);
                              setShowEditModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Edit2 size={14} />
                            Sửa
                          </button>
                        )}
                        {can("activities_mgnt", "update") && (
                          <button
                            onClick={() => handleToggleRegistration(activity)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg text-sm font-medium transition-colors"
                          >
                            {activity.registrationOpen ? (
                              <>
                                <Lock size={14} />
                                Đóng ĐK
                              </>
                            ) : (
                              <>
                                <Unlock size={14} />
                                Mở ĐK
                              </>
                            )}
                          </button>
                        )}
                        {can("activities_mgnt", "update") && (
                          <button
                            onClick={() => handleToggleStatus(activity)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                          >
                            {activity.status === "hidden" ? (
                              <>
                                <Eye size={14} />
                                Hiện
                              </>
                            ) : (
                              <>
                                <EyeOff size={14} />
                                Ẩn
                              </>
                            )}
                          </button>
                        )}
                        {can("activities_mgnt", "delete") && (
                          <button
                            onClick={() => handleDelete(activity.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Trash2 size={14} />
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">Chưa có hoạt động nào</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Tạo hoạt động tình nguyện đầu tiên của bạn</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-200"
            >
              <Plus size={18} />
              Tạo hoạt động mới
            </button>
          </motion.div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <CreateEditActivityModal
        show={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedActivity(null);
        }}
        activity={selectedActivity}
        user={user}
        onSubmit={(data) => {
          if (selectedActivity) {
            updateActivity(selectedActivity.id, data);
            console.log("✅ [ACTIVITY UPDATED]", data);
            toast.success("Cập nhật hoạt động thành công");
          } else {
            addActivity(data);
            console.log("✅ [ACTIVITY CREATED]", data);
            toast.success("Tạo hoạt động thành công");
          }
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedActivity(null);
        }}
      />

      {/* Participants Modal */}
      <ParticipantsModal
        show={showParticipantsModal}
        onClose={() => {
          setShowParticipantsModal(false);
          setSelectedActivity(null);
        }}
        activity={selectedActivity}
      />
    </div>
  );
}

// Create/Edit Activity Modal Component
function CreateEditActivityModal({
  show,
  onClose,
  activity,
  user,
  onSubmit,
}: {
  show: boolean;
  onClose: () => void;
  activity: Activity | null;
  user: any;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    location: "",
    district: "",
    ward: "",
    city: "TP. Hồ Chí Minh",
    lat: 10.7769,
    lng: 106.7009,
    startDate: "",
    endDate: "",
    maxParticipants: 50,
    imageUrl: "",
    tags: "",
    // Location codes for selects
    provinceCode: 0,
    districtCode: 0,
    wardCode: 0,
  });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load provinces on mount
  useEffect(() => {
    if (show) {
      fetch("https://provinces.open-api.vn/api/p/")
        .then((res) => res.json())
        .then((data) => setProvinces(data))
        .catch((err) => console.error("Failed to load provinces:", err));
    }
  }, [show]);

  // Load activity data when editing
  useEffect(() => {
    if (show && activity) {
      setFormData({
        title: activity.title,
        description: activity.description,
        content: activity.content.replace(/<[^>]*>/g, ""),
        location: activity.location,
        district: activity.district,
        ward: activity.ward || "",
        city: activity.city,
        lat: activity.lat,
        lng: activity.lng,
        startDate: activity.startDate.slice(0, 16),
        endDate: activity.endDate.slice(0, 16),
        maxParticipants: activity.maxParticipants,
        imageUrl: activity.imageUrl,
        tags: activity.tags?.join(", ") || "",
        provinceCode: 0,
        districtCode: 0,
        wardCode: 0,
      });
    } else if (show && !activity) {
      // Reset for new
      setFormData({
        title: "",
        description: "",
        content: "",
        location: "",
        district: "",
        ward: "",
        city: "TP. Hồ Chí Minh",
        lat: 10.7769,
        lng: 106.7009,
        startDate: "",
        endDate: "",
        maxParticipants: 50,
        imageUrl: "",
        tags: "",
        provinceCode: 79, // Default to HCM
        districtCode: 0,
        wardCode: 0,
      });
    }
  }, [show, activity]);

  // Fetch districts when provinceCode changes
  useEffect(() => {
    if (formData.provinceCode) {
      fetch(`https://provinces.open-api.vn/api/p/${formData.provinceCode}?depth=2`)
        .then((res) => res.json())
        .then((data) => setDistricts(data.districts || []))
        .catch((err) => console.error("Failed to load districts:", err));
    } else {
      setDistricts([]);
    }
    setWards([]);
  }, [formData.provinceCode]);

  // Fetch wards when districtCode changes
  useEffect(() => {
    if (formData.districtCode) {
      fetch(`https://provinces.open-api.vn/api/d/${formData.districtCode}?depth=2`)
        .then((res) => res.json())
        .then((data) => setWards(data.wards || []))
        .catch((err) => console.error("Failed to load wards:", err));
    } else {
      setWards([]);
    }
  }, [formData.districtCode]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = parseInt(e.target.value);
    const name = provinces.find((p) => p.code === code)?.name || "";
    setFormData({ ...formData, provinceCode: code, city: name, district: "", districtCode: 0, ward: "", wardCode: 0 });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = parseInt(e.target.value);
    const name = districts.find((d) => d.code === code)?.name || "";
    setFormData({ ...formData, districtCode: code, district: name, ward: "", wardCode: 0 });
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = parseInt(e.target.value);
    const name = wards.find((w) => w.code === code)?.name || "";
    setFormData({ ...formData, wardCode: code, ward: name });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tên hoạt động");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Vui lòng nhập mô tả");
      return;
    }
    if (!formData.location.trim()) {
      toast.error("Vui lòng nhập địa điểm");
      return;
    }
    if (!formData.startDate) {
      toast.error("Vui lòng chọn thời gian bắt đầu");
      return;
    }
    if (!formData.endDate) {
      toast.error("Vui lòng chọn thời gian kết thúc");
      return;
    }

    setIsGeocoding(true);
    const toastId = toast.loading("Đang xác định tọa độ bản đồ...");

    let finalLat = formData.lat;
    let finalLng = formData.lng;

    try {
      const fullAddress = `${formData.location.trim()}, ${formData.ward}, ${formData.district}, ${formData.city}, Việt Nam`;
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          fullAddress
        )}&limit=1`,
        {
          headers: {
            "User-Agent": "IssueReportingSystem/1.0",
          },
        }
      );
      const geoData = await geoResponse.json();

      if (geoData && geoData.length > 0) {
        finalLat = parseFloat(geoData[0].lat);
        finalLng = parseFloat(geoData[0].lon);
        console.log("📍 Geocoding success:", { finalLat, finalLng });
      } else {
        console.warn("Geocoding failed for address, using default coordinates");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsGeocoding(false);
      toast.dismiss(toastId);
    }

    const data: any = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      content: `<p>${formData.content.trim()}</p>`,
      location: formData.location.trim(),
      district: formData.district,
      ward: formData.ward,
      city: formData.city,
      lat: finalLat,
      lng: finalLng,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      maxParticipants: formData.maxParticipants,
      imageUrl:
        formData.imageUrl ||
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t),
    };

    if (!activity) {
      data.creatorId = user.id;
      data.creatorName = user.name;
      data.registrationOpen = true;
      data.status = "upcoming";
    }

    console.log("%c🚀 [SUBMITTING ACTIVITY]", "color: #10b981; font-weight: bold; font-size: 12px;");
    console.log("Activity Data:", data);

    onSubmit(data);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {activity ? "Chỉnh sửa hoạt động" : "Tạo hoạt động mới"}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên hoạt động <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Dọn dẹp công viên Tao Đàn"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô tả ngắn <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả ngắn gọn về hoạt động"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nội dung chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Mô tả chi tiết về mục đích, nội dung, yêu cầu tham gia..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Địa chỉ cụ thể (Số nhà, tên đường) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="VD: 123 Lê Lợi"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tỉnh / Thành phố <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.provinceCode}
                    onChange={handleCityChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                  >
                    <option value="0">Chọn Tỉnh / Thành phố</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quận / Huyện <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.districtCode}
                    onChange={handleDistrictChange}
                    disabled={!formData.provinceCode}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="0">Chọn Quận / Huyện</option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phường / Xã <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.wardCode}
                    onChange={handleWardChange}
                    disabled={!formData.districtCode}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="0">Chọn Phường / Xã</option>
                    {wards.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số lượng tối đa
                  </label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })
                    }
                    min="1"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vị trí trên bản đồ
                  </label>
                  <LocationPicker
                    lat={formData.lat}
                    lng={formData.lng}
                    onChange={(lat, lng, addressData) => {
                      setFormData(prev => ({ ...prev, lat, lng }));
                      
                      if (addressData) {
                        const addr = addressData.address;
                        const city = addr.city || addr.state || addr.province || "";
                        const district = addr.suburb || addr.district || addr.town || addr.city_district || "";
                        const ward = addr.suburb || addr.ward || addr.village || addr.subdistrict || "";
                        const road = addr.road || addr.amenity || addr.building || "";
                        const houseNumber = addr.house_number || "";
                        
                        const locationStr = [houseNumber, road].filter(Boolean).join(" ");
                        
                        // Try to match city
                        if (city) {
                          const matchedCity = provinces.find(p => 
                            p.name.toLowerCase().includes(city.toLowerCase()) || 
                            city.toLowerCase().includes(p.name.toLowerCase())
                          );
                          if (matchedCity) {
                            setFormData(prev => ({
                              ...prev,
                              provinceCode: matchedCity.code,
                              city: matchedCity.name
                            }));
                          }
                        }

                        setFormData(prev => ({
                          ...prev,
                          location: locationStr || prev.location
                        }));
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Thời gian bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Thời gian kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hình ảnh hoạt động
                </label>
                
                {formData.imageUrl && (
                  <div className="mb-4 relative rounded-xl overflow-hidden aspect-video group">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="url"
                      value={formData.imageUrl.startsWith('data:') ? 'Ảnh đã tải lên' : formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      readOnly={formData.imageUrl.startsWith('data:')}
                      placeholder="Nhập URL hình ảnh..."
                      className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 text-sm"
                    />
                    <ImageIcon size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    <Upload size={18} />
                    <span>Tải lên</span>
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-400 italic">
                  * Khuyến khích tải lên ảnh thực tế để thu hút người tham gia.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tags (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="VD: Môi trường, Cộng đồng, Trồng cây"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={isGeocoding}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {isGeocoding ? "Đang định vị..." : (activity ? "Cập nhật" : "Tạo mới")}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Participants Modal Component
function ParticipantsModal({
  show,
  onClose,
  activity,
}: {
  show: boolean;
  onClose: () => void;
  activity: Activity | null;
}) {
  const { getActivityParticipants, updateParticipantStatus } = useActivities();

  if (!show || !activity) return null;

  const participants = getActivityParticipants(activity.id);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="font-bold text-gray-900 text-xl">Danh sách người đăng ký</h3>
              <p className="text-sm text-gray-500 mt-1">{activity.title}</p>
              <p className="text-sm text-gray-400 mt-1">
                <span className="font-semibold text-green-600">{participants.length}</span> người đã đăng ký
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={24} />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-6">
            {participants.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Chưa có người đăng ký</p>
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="p-4 rounded-xl border border-gray-200 hover:border-green-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <img
                          src={
                            p.userAvatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.userName}`
                          }
                          alt={p.userName}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{p.userName}</div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Phone size={12} />
                              {p.userPhone}
                            </span>
                            {p.userEmail && (
                              <span className="flex items-center gap-1">
                                <Mail size={12} />
                                {p.userEmail}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Đăng ký: {new Date(p.registeredAt).toLocaleString("vi-VN")}
                          </div>
                          {p.note && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                              <span className="font-medium">Ghi chú:</span> {p.note}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status selector */}
                      <select
                        value={p.status}
                        onChange={(e) => updateParticipantStatus(p.id, e.target.value as any)}
                        className="ml-4 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-300"
                      >
                        <option value="registered">Đã đăng ký</option>
                        <option value="attended">Đã tham gia</option>
                        <option value="absent">Vắng mặt</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Summary */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-black text-green-600">
                  {participants.filter((p) => p.status === "registered").length}
                </div>
                <div className="text-xs text-gray-600">Đã đăng ký</div>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-600">
                  {participants.filter((p) => p.status === "attended").length}
                </div>
                <div className="text-xs text-gray-600">Đã tham gia</div>
              </div>
              <div>
                <div className="text-2xl font-black text-gray-600">
                  {participants.filter((p) => p.status === "absent").length}
                </div>
                <div className="text-xs text-gray-600">Vắng mặt</div>
              </div>
              <div>
                <div className="text-2xl font-black text-red-600">
                  {participants.filter((p) => p.status === "cancelled").length}
                </div>
                <div className="text-xs text-gray-600">Đã hủy</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
