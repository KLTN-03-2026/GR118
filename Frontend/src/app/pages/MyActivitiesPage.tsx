import { motion, AnimatePresence } from "motion/react";
import { Link, Navigate } from "react-router";
import {
  Calendar,
  MapPin,
  Heart,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import { useState } from "react";
import { useActivities } from "../context/ActivitiesContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { PageTitle } from "../components/PageTitle";

export function MyActivitiesPage() {
  const { user } = useAuth();
  const { activities, getUserParticipations, cancelRegistration } = useActivities();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);

  if (!user || user.role === "admin") {
    return <Navigate to="/" replace />;
  }

  const myParticipations = getUserParticipations(user.id);
  const activeParticipations = myParticipations.filter((p) => p.status === "registered");
  const cancelledParticipations = myParticipations.filter((p) => p.status === "cancelled");
  const completedParticipations = myParticipations.filter((p) => p.status === "attended");

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      registered: {
        label: "Đã đăng ký",
        icon: CheckCircle2,
        className: "bg-green-100 text-green-700",
      },
      cancelled: { label: "Đã hủy", icon: XCircle, className: "bg-red-100 text-red-700" },
      attended: {
        label: "Đã tham gia",
        icon: CheckCircle2,
        className: "bg-blue-100 text-blue-700",
      },
      absent: { label: "Vắng mặt", icon: XCircle, className: "bg-gray-100 text-gray-700" },
    };
    return badges[status as keyof typeof badges] || badges.registered;
  };

  const handleCancelClick = (participantId: string) => {
    setSelectedParticipant(participantId);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (selectedParticipant) {
      const success = await cancelRegistration(selectedParticipant);
      if (success) {
        toast.success("Đã hủy đăng ký thành công");
      } else {
        toast.error("Không thể hủy đăng ký");
      }
      setShowCancelModal(false);
      setSelectedParticipant(null);
    }
  };

  const renderParticipationCard = (participation: any, index: number) => {
    const activity = activities.find((a) => a.id === participation.activityId);
    if (!activity) return null;

    const statusBadge = getStatusBadge(participation.status);
    const StatusIcon = statusBadge.icon;

    return (
      <motion.div
        key={participation.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="sm:w-48 h-40 sm:h-auto flex-shrink-0">
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
                <Link
                  to={`/activities/${activity.id}`}
                  className="text-lg font-bold text-gray-900 hover:text-green-600 transition-colors"
                >
                  {activity.title}
                </Link>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{activity.description}</p>
              </div>
              <div className={`ml-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusBadge.className}`}>
                <StatusIcon size={14} />
                {statusBadge.label}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={14} className="text-blue-400" />
                {formatDate(activity.startDate)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-red-400" />
                {activity.location}, {activity.district}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">
                Đăng ký lúc: {new Date(participation.registeredAt).toLocaleString("vi-VN")}
              </div>
              {participation.status === "registered" && activity.status === "upcoming" && (
                <button
                  onClick={() => handleCancelClick(participation.id)}
                  className="ml-auto px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Hủy đăng ký
                </button>
              )}
            </div>

            {participation.note && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Ghi chú:</span> {participation.note}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-8 mb-8"
        >
          <PageTitle
            title={
              <span className="flex items-center gap-3">
                <Heart className="text-green-500" size={32} />
                Hoạt động của tôi
              </span>
            }
            backTo="/activities"
            subtitle="Quản lý các hoạt động bạn đã đăng ký"
          />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="text-3xl font-black text-green-600 mb-1">
              {activeParticipations.length}
            </div>
            <div className="text-sm text-gray-600">Đang tham gia</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="text-3xl font-black text-blue-600 mb-1">
              {completedParticipations.length}
            </div>
            <div className="text-sm text-gray-600">Đã hoàn thành</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="text-3xl font-black text-gray-600 mb-1">
              {myParticipations.length}
            </div>
            <div className="text-sm text-gray-600">Tổng hoạt động</div>
          </div>
        </motion.div>

        {/* Active Participations */}
        {activeParticipations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Đang tham gia</h2>
            <div className="space-y-4">
              {activeParticipations.map((p, i) => renderParticipationCard(p, i))}
            </div>
          </motion.div>
        )}

        {/* Completed Participations */}
        {completedParticipations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Đã hoàn thành</h2>
            <div className="space-y-4">
              {completedParticipations.map((p, i) => renderParticipationCard(p, i))}
            </div>
          </motion.div>
        )}

        {/* Cancelled Participations */}
        {cancelledParticipations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Đã hủy</h2>
            <div className="space-y-4">
              {cancelledParticipations.map((p, i) => renderParticipationCard(p, i))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {myParticipations.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Heart size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">Bạn chưa đăng ký hoạt động nào</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">
              Hãy tham gia các hoạt động tình nguyện để đóng góp cho cộng đồng
            </p>
            <Link
              to="/activities"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-200"
            >
              <Heart size={18} />
              Khám phá hoạt động
            </Link>
          </motion.div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
                    <AlertCircle size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Xác nhận hủy đăng ký</h3>
                    <p className="text-sm text-gray-500">Bạn có chắc chắn muốn hủy?</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5">
                <div className="flex gap-3">
                  <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-900">
                    <p className="font-semibold mb-1">Lưu ý</p>
                    <p>
                      Sau khi hủy, bạn có thể đăng ký lại nếu hoạt động vẫn còn chỗ trống.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Không
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
                >
                  Hủy đăng ký
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
