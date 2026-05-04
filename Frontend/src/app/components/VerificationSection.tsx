import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Star,
  Image as ImageIcon,
  X,
  Send,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useIssues } from "../context/IssuesContext";
import { useNotifications } from "../context/NotificationContext";
import { Rating } from "../data/issues";

interface VerificationSectionProps {
  issueId: string;
  issueTitle: string;
  reporterId: string;
  verifications?: Rating[];
}

// Star Rating Component
function StarRating({ rating, size = 20, interactive = false, onRate }: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`transition-all ${
            interactive ? 'cursor-pointer' : ''
          } ${
            star <= (interactive ? (hoverRating || rating) : rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200'
          }`}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && onRate?.(star)}
        />
      ))}
    </div>
  );
}

export function VerificationSection({ issueId, issueTitle, reporterId, verifications = [] }: VerificationSectionProps) {
  const { user } = useAuth();
  const { addVerification } = useIssues();
  const { addNotification } = useNotifications();
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [message, setMessage] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const [showAllVerifications, setShowAllVerifications] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate average rating and distribution
  const averageRating = verifications.length > 0
    ? verifications.reduce((sum, v) => sum + v.rating, 0) / verifications.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    stars: star,
    count: verifications.filter((v) => v.rating === star).length,
    percentage: verifications.length > 0
      ? (verifications.filter((v) => v.rating === star).length / verifications.length) * 100
      : 0,
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + evidenceFiles.length > 5) {
      toast.error("Tối đa 5 hình ảnh minh chứng");
      return;
    }

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Chỉ chấp nhận file hình ảnh");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setEvidencePreviews((prev) => [...prev, preview]);
      };
      reader.readAsDataURL(file);
    });

    setEvidenceFiles((prev) => [...prev, ...files]);
  };

  const removeEvidence = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
    setEvidencePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đánh giá");
      return;
    }

    if (!message.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    const newRating: Rating = {
      id: `rating_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      rating: selectedRating,
      message: message.trim(),
      evidence: evidencePreviews.length > 0 ? evidencePreviews : undefined,
      createdAt: new Date().toISOString(),
      adminReviewed: false,
    };

    const success = await addVerification(issueId, newRating);

    if (success) {
      toast.success("Đã gửi đánh giá thành công!");

      // Reset form
      setMessage("");
      setEvidenceFiles([]);
      setEvidencePreviews([]);
      setSelectedRating(5);
      setShowModal(false);

      // Add notification to reporter
      if (user.id !== reporterId) {
        addNotification({
          type: "verification",
          title: "Đánh giá mới",
          message: `${user.name} đã đánh giá ${selectedRating} sao báo cáo: "${issueTitle}"`,
          link: `/issues/${issueId}`,
          issueId: issueId,
          fromUser: user.name,
        });
      }
    } else {
      toast.error("Không thể gửi đánh giá. Vui lòng thử lại.");
    }
  };

  const displayedVerifications = showAllVerifications
    ? verifications
    : verifications.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Star size={20} className="text-yellow-500 fill-yellow-500" />
            Đánh giá
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Đánh giá chất lượng và độ chính xác của báo cáo
          </p>
        </div>
      </div>

      {/* Rating Overview */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 mb-5 border border-yellow-100">
        <div className="flex items-center gap-6">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-5xl font-black text-gray-900 mb-1">
              {averageRating > 0 ? averageRating.toFixed(1) : "—"}
            </div>
            <StarRating rating={Math.round(averageRating)} size={20} />
            <div className="text-xs text-gray-600 mt-1">
              {verifications.length} đánh giá
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-1">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 w-3">{stars}</span>
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-gray-500 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => {
            if (!user) {
              toast.error("Vui lòng đăng nhập để đánh giá");
              return;
            }
            setShowModal(true);
          }}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg shadow-yellow-500/30"
        >
          <Star size={18} />
          Viết đánh giá
        </button>
        
        {verifications.length > 0 && (
          <button
            onClick={() => setShowDetailModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-yellow-500 text-yellow-600 rounded-xl font-semibold hover:bg-yellow-50 transition-all"
          >
            <Eye size={18} />
            Xem chi tiết
          </button>
        )}
      </div>

      {/* Ratings List - Preview (first 3) */}
      {verifications.length > 0 && (
        <div className="space-y-3">
          <div className="h-px bg-gray-200" />
          <h4 className="font-semibold text-gray-900 text-sm mt-4 mb-3">
            Đánh giá gần đây
          </h4>

          {displayedVerifications.map((v, index) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl border bg-gray-50 border-gray-200"
            >
              <div className="flex items-start gap-3">
                <img
                  src={v.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.userName}`}
                  alt={v.userName}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 text-sm">
                      {v.userName}
                    </span>
                    <StarRating rating={v.rating} size={16} />
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{v.message}</p>

                  {/* Evidence Images */}
                  {v.evidence && v.evidence.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto relative">
                      {v.evidence.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Minh chứng ${i + 1}`}
                          className="h-20 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(img, "_blank")}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(v.createdAt).toLocaleString("vi-VN")}
                    </span>
                    {v.adminReviewed && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Star size={12} />
                        Admin đã xem xét
                      </span>
                    )}
                  </div>

                  {v.adminNote && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-xs text-blue-900">
                        <span className="font-semibold">Ghi chú từ Admin:</span> {v.adminNote}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Show More/Less Button */}
          {verifications.length > 3 && (
            <button
              onClick={() => setShowAllVerifications(!showAllVerifications)}
              className="w-full py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-1"
            >
              {showAllVerifications ? (
                <>
                  Thu gọn
                  <ChevronUp size={16} />
                </>
              ) : (
                <>
                  Xem thêm {verifications.length - 3} phản hồi
                  <ChevronDown size={16} />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Write Rating Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100">
                    <Star size={24} className="text-yellow-600 fill-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Viết đánh giá
                    </h3>
                    <p className="text-sm text-gray-500">
                      Chia sẻ trải nghiệm của bạn về báo cáo này
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Star Rating Selector */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Đánh giá của bạn <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                  <StarRating
                    rating={selectedRating}
                    size={40}
                    interactive
                    onRate={(rating) => setSelectedRating(rating as 1 | 2 | 3 | 4 | 5)}
                  />
                  <p className="text-sm font-semibold text-gray-700">
                    {selectedRating === 5 && "Xuất sắc"}
                    {selectedRating === 4 && "Rất tốt"}
                    {selectedRating === 3 && "Tốt"}
                    {selectedRating === 2 && "Tạm được"}
                    {selectedRating === 1 && "Kém"}
                  </p>
                </div>
              </div>

              {/* Message Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nội dung đánh giá <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm, ý kiến của bạn về báo cáo này..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-100 transition-all resize-none"
                  rows={4}
                />
              </div>

              {/* Evidence Upload */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hình ảnh kèm theo (Tùy chọn)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-yellow-500 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-yellow-600"
                >
                  <ImageIcon size={18} />
                  Thêm hình ảnh (Tối đa 5)
                </button>

                {/* Evidence Previews */}
                {evidencePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {evidencePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Hình ảnh ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeEvidence(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                <div className="flex gap-3">
                  <AlertTriangle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Lưu ý</p>
                    <p>
                      Đánh giá của bạn sẽ được hiển thị công khai và giúp cộng đồng
                      đánh giá độ tin cậy của báo cáo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/30"
                >
                  <Send size={18} />
                  Gửi đánh giá
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail View Modal */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                    <Star size={24} className="text-yellow-500 fill-yellow-500" />
                    Tất cả đánh giá ({verifications.length})
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Xem chi tiết đánh giá từ cộng đồng
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Rating Summary */}
              <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-b border-yellow-100">
                <div className="flex items-center gap-8">
                  {/* Average Rating */}
                  <div className="text-center">
                    <div className="text-6xl font-black text-gray-900 mb-2">
                      {averageRating > 0 ? averageRating.toFixed(1) : "—"}
                    </div>
                    <StarRating rating={Math.round(averageRating)} size={24} />
                    <div className="text-sm text-gray-600 mt-2">
                      {verifications.length} đánh giá
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  <div className="flex-1 space-y-2">
                    {ratingDistribution.map(({ stars, count, percentage }) => (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 w-4">{stars}</span>
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600 w-12 text-right">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ratings List - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {verifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Star size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Chưa có đánh giá nào</p>
                  </div>
                ) : (
                  verifications.map((v, index) => (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-5 rounded-xl border bg-white border-gray-200 hover:border-yellow-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={v.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.userName}`}
                          alt={v.userName}
                          className="w-12 h-12 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-bold text-gray-900">
                                {v.userName}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <StarRating rating={v.rating} size={16} />
                                <span className="text-xs text-gray-500">
                                  {v.rating === 5 && "Xuất sắc"}
                                  {v.rating === 4 && "Rất tốt"}
                                  {v.rating === 3 && "Tốt"}
                                  {v.rating === 2 && "Tạm được"}
                                  {v.rating === 1 && "Kém"}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(v.createdAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          
                          <p className="text-gray-700 leading-relaxed mb-3">{v.message}</p>

                          {/* Evidence Images */}
                          {v.evidence && v.evidence.length > 0 && (
                            <div className="flex gap-2 mb-3 overflow-x-auto">
                              {v.evidence.map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt={`Minh chứng ${i + 1}`}
                                  className="h-24 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity border border-gray-200"
                                  onClick={() => window.open(img, "_blank")}
                                />
                              ))}
                            </div>
                          )}

                          {/* Admin Badge */}
                          {v.adminReviewed && (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700 font-medium">
                              <Star size={12} className="fill-blue-500 text-blue-500" />
                              Admin đã xem xét
                            </div>
                          )}

                          {/* Admin Note */}
                          {v.adminNote && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-900">
                                <span className="font-semibold">Ghi chú từ Admin:</span> {v.adminNote}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}