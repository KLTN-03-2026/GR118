import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Star,
  Search,
  CheckCircle2,
  Eye,
  MessageSquare,
  X,
  Clock,
  Image as ImageIcon,
  Send,
  TrendingUp,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Navigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useIssues } from "../context/IssuesContext";
import { useNotifications } from "../context/NotificationContext";
import { Rating } from "../data/issues";
import { toast } from "sonner";

// Star Rating Display Component
function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export function AdminVerificationsPage() {
  const { can, isLoading } = useAuth();
  const { issues, reviewVerification } = useIssues();
  const { addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<"all" | "high" | "medium" | "low">("all");
  const [filterReviewed, setFilterReviewed] = useState<"all" | "reviewed" | "pending">("all");
  const [selectedVerification, setSelectedVerification] = useState<{
    issueId: string;
    verification: Rating;
    issueTitle: string;
  } | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!can("users_mgnt", "verify")) {
    return <Navigate to="/" replace />;
  }

  // Collect all ratings with issue context
  const allVerifications: Array<{
    issueId: string;
    issueTitle: string;
    verification: Rating;
  }> = [];

  issues.forEach((issue) => {
    if (issue.verifications) {
      issue.verifications.forEach((v) => {
        allVerifications.push({
          issueId: issue.id,
          issueTitle: issue.title,
          verification: v,
        });
      });
    }
  });

  // Filter ratings
  const filteredVerifications = allVerifications.filter((item) => {
    const matchesSearch =
      item.issueTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.verification.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.verification.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating =
      filterRating === "all" ||
      (filterRating === "high" && item.verification.rating >= 4) ||
      (filterRating === "medium" && item.verification.rating === 3) ||
      (filterRating === "low" && item.verification.rating <= 2);

    const matchesReviewed =
      filterReviewed === "all" ||
      (filterReviewed === "reviewed" && item.verification.adminReviewed) ||
      (filterReviewed === "pending" && !item.verification.adminReviewed);

    return matchesSearch && matchesRating && matchesReviewed;
  });

  const stats = {
    total: allVerifications.length,
    averageRating: allVerifications.length > 0
      ? allVerifications.reduce((sum, v) => sum + v.verification.rating, 0) / allVerifications.length
      : 0,
    high: allVerifications.filter((v) => v.verification.rating >= 4).length,
    low: allVerifications.filter((v) => v.verification.rating <= 2).length,
    pending: allVerifications.filter((v) => !v.verification.adminReviewed).length,
  };

  const handleReview = () => {
    if (!selectedVerification || !adminNote.trim()) {
      toast.error("Vui lòng nhập ghi chú xem xét");
      return;
    }

    reviewVerification(
      selectedVerification.issueId,
      selectedVerification.verification.id,
      adminNote.trim()
    );

    toast.success("Đã xem xét và ghi chú!");

    // Add notification for admin confirmation
    addNotification({
      type: "admin_review",
      title: "Đã xem xét đánh giá",
      message: `Đã xem xét đánh giá ${selectedVerification.verification.rating} sao từ ${selectedVerification.verification.userName}`,
      link: `/issues/${selectedVerification.issueId}`,
      issueId: selectedVerification.issueId,
      fromUser: selectedVerification.verification.userName,
    });

    setReviewModalOpen(false);
    setSelectedVerification(null);
    setAdminNote("");
  };

  const ReviewModal = () => {
    if (!selectedVerification) return null;
    const { verification, issueTitle } = selectedVerification;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => {
          setReviewModalOpen(false);
          setSelectedVerification(null);
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100">
                <Star size={24} className="text-yellow-600 fill-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  Xem xét đánh giá
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    Từ: {verification.userName}
                  </p>
                  <StarRating rating={verification.rating} size={14} />
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setReviewModalOpen(false);
                setSelectedVerification(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Issue Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <p className="text-xs text-gray-500 mb-1">Báo cáo liên quan:</p>
            <Link
              to={`/issues/${selectedVerification.issueId}`}
              className="font-semibold text-blue-600 hover:underline flex items-center gap-2"
              target="_blank"
            >
              {issueTitle}
              <Eye size={14} />
            </Link>
          </div>

          {/* User Info */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={
                  verification.userAvatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${verification.userName}`
                }
                alt={verification.userName}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-semibold text-gray-900">{verification.userName}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(verification.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-700">{verification.message}</p>
            </div>
          </div>

          {/* Evidence */}
          {verification.evidence && verification.evidence.length > 0 && (
            <div className="mb-5">
              <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ImageIcon size={16} />
                Hình ảnh minh chứng
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {verification.evidence.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Minh chứng ${i + 1}`}
                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(img, "_blank")}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Admin Note Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ghi chú của Admin <span className="text-red-500">*</span>
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Nhập ghi chú xem xét, phản hồi cho người gửi..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setReviewModalOpen(false);
                setSelectedVerification(null);
              }}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Hủy
            </button>
            <button
              onClick={handleReview}
              disabled={!adminNote.trim()}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Send size={18} />
              Gửi xem xét
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white">
              <Star size={24} />
            </div>
            <div>
              <h1 className="font-black text-gray-900 text-3xl">Xem xét đánh giá</h1>
              <p className="text-gray-500">Quản lý đánh giá từ cộng đồng</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">Tổng số</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center text-white">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{stats.averageRating.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">TB đánh giá</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
                  <Star size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{stats.high}</p>
                  <p className="text-sm text-gray-500">Cao (4-5★)</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{stats.pending}</p>
                  <p className="text-sm text-gray-500">Chờ xem xét</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, báo cáo, nội dung..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Rating Filter */}
              <div className="flex gap-2">
                {[
                  { value: "all", label: "Tất cả" },
                  { value: "high", label: "Cao (4-5★)" },
                  { value: "medium", label: "TB (3★)" },
                  { value: "low", label: "Thấp (1-2★)" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterRating(filter.value as any)}
                    className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      filterRating === filter.value
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Review Status Filter */}
              <div className="flex gap-2">
                {[
                  { value: "all", label: "Tất cả" },
                  { value: "pending", label: "Chờ xét" },
                  { value: "reviewed", label: "Đã xét" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterReviewed(filter.value as any)}
                    className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      filterReviewed === filter.value
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ratings List */}
        <div className="space-y-4">
          {filteredVerifications.map((item, index) => {
            const { verification, issueTitle, issueId } = item;
            return (
              <motion.div
                key={verification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row gap-5">
                  {/* User & Content */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={
                          verification.userAvatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${verification.userName}`
                        }
                        alt={verification.userName}
                        className="w-12 h-12 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {verification.userName}
                          </span>
                          <StarRating rating={verification.rating} size={16} />
                          {verification.adminReviewed && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              Đã xem xét
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          <Clock size={12} className="inline mr-1" />
                          {new Date(verification.createdAt).toLocaleString("vi-VN")}
                        </p>
                        <Link
                          to={`/issues/${issueId}`}
                          className="text-sm text-blue-600 hover:underline mb-2 block"
                        >
                          📄 {issueTitle}
                        </Link>
                        <p className="text-gray-700 text-sm">{verification.message}</p>

                        {/* Evidence Preview */}
                        {verification.evidence && verification.evidence.length > 0 && (
                          <div className="flex gap-2 mt-3 overflow-x-auto relative">
                            {verification.evidence.slice(0, 4).map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={`Evidence ${i + 1}`}
                                className="h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(img, "_blank")}
                              />
                            ))}
                            {verification.evidence.length > 4 && (
                              <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-semibold">
                                +{verification.evidence.length - 4}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Admin Note */}
                        {verification.adminNote && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <p className="text-sm text-blue-900">
                              <span className="font-semibold">Ghi chú Admin:</span>{" "}
                              {verification.adminNote}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2">
                    <Link
                      to={`/issues/${issueId}`}
                      target="_blank"
                      className="flex-1 md:flex-none px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Eye size={16} />
                      Xem báo cáo
                    </Link>
                    {can("users_mgnt", "verify") && !verification.adminReviewed && (
                      <button
                        onClick={() => {
                          setSelectedVerification({ issueId, verification, issueTitle });
                          setReviewModalOpen(true);
                        }}
                        className="flex-1 md:flex-none px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <CheckCircle2 size={16} />
                        Xem xét
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredVerifications.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <Star size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="font-bold text-gray-900 text-xl mb-2">
              Không tìm thấy đánh giá
            </h3>
            <p className="text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModalOpen && <ReviewModal />}
      </AnimatePresence>
    </div>
  );
}