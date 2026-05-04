import { useParams, Link } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  XCircle,
  User,
  Share2,
  ChevronLeft,
  ChevronRight,
  Video,
  Image as ImageIcon,
} from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS, STATUS_COLORS } from "../data/issues";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { IssueMap } from "../components/IssueMap";
import { CommentsSection } from "../components/CommentsSection";
import { ShareModal } from "../components/ShareModal";
import { VerificationSection } from "../components/VerificationSection";
import { SimilarIssues } from "../components/SimilarIssues";
import { useIssues } from "../context/IssuesContext";
import { PageTitle } from "../components/PageTitle";

const STATUS_ICONS = {
  pending: AlertCircle,
  processing: Loader2,
  resolved: CheckCircle2,
  rejected: XCircle,
};

const TIMELINE = [
  { label: "Đã tiếp nhận báo cáo", done: true, date: "28/02/2026 08:30" },
  { label: "Giao cho đơn vị xử lý", done: true, date: "01/03/2026 09:00" },
  { label: "Đang khảo sát thực địa", done: false, date: null },
  { label: "Hoàn thành xử lý", done: false, date: null },
];

export function IssueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { issues, voteIssue } = useIssues();
  const issue = issues.find((i) => i.id === id);
  
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVoting, setIsVoting] = useState(false);

  const voted = user && issue?.votedUserIds?.includes(user.id);
  const votes = issue?.votes ?? 0;
  
  const mediaFiles = issue?.mediaFiles || (issue?.imageUrl ? [{ type: "image" as const, url: issue.imageUrl }] : []);

  if (!issue) {
    return (
      <div className="min-h-screen pt-28 flex flex-col items-center justify-center text-gray-400">
        <AlertCircle size={48} className="mb-4" />
        <p className="text-lg font-medium">Không tìm thấy vấn đề này</p>
        <Link to="/issues" className="mt-4 text-red-500 hover:underline">← Quay lại danh sách</Link>
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[issue.status];
  const catColor = CATEGORY_COLORS[issue.category];
  const statusColor = STATUS_COLORS[issue.status];

  const handleVote = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để bình chọn");
      return;
    }
    if (!issue) return;

    setIsVoting(true);
    const success = await voteIssue(issue.id, user.id);
    if (success) {
      if (voted) {
        toast.success("Đã bỏ bình chọn");
      } else {
        toast.success("Cảm ơn bạn đã bình chọn!");
      }
    } else {
      toast.error("Không thể thực hiện bình chọn. Vui lòng thử lại.");
    }
    setIsVoting(false);
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6">
        <PageTitle title={issue.title} backTo="/issues" className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100"
            >
              <div className="relative h-64 sm:h-80">
                {/* Main Media Display */}
                {mediaFiles.length > 0 && (
                  <>
                    {mediaFiles[currentMediaIndex].type === "image" ? (
                      <img 
                        src={mediaFiles[currentMediaIndex].url} 
                        alt={issue.title} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <video 
                        src={mediaFiles[currentMediaIndex].url} 
                        controls 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                
                {/* Navigation Arrows */}
                {mediaFiles.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentMediaIndex((i) => (i === 0 ? mediaFiles.length - 1 : i - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setCurrentMediaIndex((i) => (i === mediaFiles.length - 1 ? 0 : i + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
                
                {/* Media Counter */}
                {mediaFiles.length > 1 && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
                    {currentMediaIndex + 1} / {mediaFiles.length}
                  </div>
                )}
                
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none">
                  <span className="px-3 py-1.5 rounded-full text-white text-sm font-medium" style={{ backgroundColor: catColor }}>
                    {CATEGORY_LABELS[issue.category]}
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-white text-sm font-semibold flex items-center gap-1.5" style={{ backgroundColor: statusColor }}>
                    <StatusIcon size={13} className={issue.status === "processing" ? "animate-spin" : ""} />
                    {STATUS_LABELS[issue.status]}
                  </span>
                </div>
              </div>

              {/* Media Thumbnails */}
              {mediaFiles.length > 1 && (
                <div className="px-4 pt-3 pb-4 flex gap-2 overflow-x-auto relative">
                  {mediaFiles.map((media, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentMediaIndex(idx)}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${ 
                        idx === currentMediaIndex 
                          ? "border-red-500 scale-105" 
                          : "border-gray-200 hover:border-gray-300" 
                      }`}
                    >
                      {media.type === "image" ? (
                        <img src={media.url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="relative w-full h-full bg-gray-900">
                          <video src={media.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Video size={20} className="text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-6">
                <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-red-400" />
                    {issue.location}, {issue.ward}, {issue.district}, {issue.city}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-400" />
                    {formatDate(issue.reportedAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-gray-400" />
                    {issue.reporterName}
                  </span>
                </div>

                <p className="text-gray-600 leading-relaxed">{issue.description}</p>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100">
                  <button
                    onClick={handleVote}
                    disabled={isVoting}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      voted
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-200"
                        : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    {isVoting ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                    {votes} Bình chọn
                  </button>
                  <button
                    onClick={() => setShowComments(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium transition-all"
                  >
                    <MessageSquare size={16} />
                    {issue.comments} Bình luận
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium transition-all"
                  >
                    <Share2 size={16} />
                    Chia sẻ
                  </button>
                </div>
              </div>
            </motion.div>

            {/* AI Analysis */}
            {issue.aiLabel && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-100"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={18} className="text-purple-600" />
                  <span className="font-bold text-purple-800">Phân tích AI</span>
                </div>
                <p className="text-gray-700 font-medium mb-3">{issue.aiLabel}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-purple-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${issue.aiConfidence}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full bg-gradient-to-r from-purple-400 to-blue-500 rounded-full"
                    />
                  </div>
                  <span className="text-purple-700 font-bold text-sm">{issue.aiConfidence}% chính xác</span>
                </div>
              </motion.div>
            )}

            {/* Verification Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <VerificationSection
                issueId={issue.id}
                issueTitle={issue.title}
                reporterId={issue.reporterId}
                verifications={issue.verifications}
              />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Map Location */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-red-500" />
                Vị trí xảy ra sự việc
              </h3>
              <IssueMap
                lat={issue.lat}
                lng={issue.lng}
                title={issue.title}
                location={`${issue.location}, ${issue.ward}, ${issue.district}, ${issue.city}`}
              />
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <h3 className="font-bold text-gray-900 mb-4">Tiến độ xử lý</h3>
              <div className="space-y-4">
                {TIMELINE.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.done ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        {item.done ? (
                          <CheckCircle2 size={14} className="text-green-600" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                        )}
                      </div>
                      {i < TIMELINE.length - 1 && (
                        <div className={`w-0.5 h-6 mt-1 ${item.done ? "bg-green-200" : "bg-gray-100"}`} />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className={`text-sm font-medium ${item.done ? "text-gray-900" : "text-gray-400"}`}>
                        {item.label}
                      </p>
                      {item.date && <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <h3 className="font-bold text-gray-900 mb-4">Thông tin</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Mã báo cáo", value: `#${issue.issueCode || issue.id.slice(-6).toUpperCase()}` },
                  { label: "Danh mục", value: CATEGORY_LABELS[issue.category] },
                  { label: "Phường/Xã", value: issue.ward },
                  { label: "Quận/Huyện", value: issue.district },
                  { label: "Thành phố", value: issue.city },
                  { label: "Cập nhật lần cuối", value: new Date(issue.updatedAt).toLocaleDateString("vi-VN") },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-900 font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Related Issues */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <SimilarIssues
                currentIssueId={issue.id}
                currentLocation={{ lat: issue.lat, lng: issue.lng }}
                maxResults={4}
              />
            </motion.div>
          </div>
        </div>

        {/* Comments Section */}
        <CommentsSection
          issueId={issue.id}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
        />

        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={issue.title}
          url={window.location.href}
        />
      </div>
    </div>
  );
}