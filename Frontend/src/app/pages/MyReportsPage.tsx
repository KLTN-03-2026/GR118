import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Edit3,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Save,
  MapPin,
  Calendar,
} from "lucide-react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useIssues } from "../context/IssuesContext";
import { CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS, STATUS_COLORS, IssueCategory, Issue } from "../data/issues";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const STATUS_ICONS = {
  pending: Clock,
  processing: Loader2,
  resolved: CheckCircle2,
  rejected: XCircle,
};

export function MyReportsPage() {
  const { user } = useAuth();
  const { issues, updateIssue, deleteIssue } = useIssues();
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Filter issues by current user
  const myIssues = issues.filter((issue) => issue.reporterId === user.id);

  const handleDelete = (issueId: string) => {
    deleteIssue(issueId);
    toast.success("Đã xóa báo cáo thành công!");
    setDeleteConfirm(null);
  };

  const handleUpdate = (updatedIssue: Issue) => {
    updateIssue(updatedIssue);
    toast.success("Đã cập nhật báo cáo thành công!");
    setEditingIssue(null);
  };

  const EditModal = ({ issue }: { issue: Issue }) => {
    const [formData, setFormData] = useState({
      title: issue.title,
      description: issue.description,
      category: issue.category,
      location: issue.location,
      district: issue.district,
      city: issue.city,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleUpdate({
        ...issue,
        ...formData,
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto relative"
        onClick={() => setEditingIssue(null)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                <Edit3 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Chỉnh sửa báo cáo</h3>
                <p className="text-gray-500 text-sm">Cập nhật thông tin báo cáo của bạn</p>
              </div>
            </div>
            <button
              onClick={() => setEditingIssue(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as IssueCategory })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                required
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Địa điểm cụ thể <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                required
              />
            </div>

            {/* District and City */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quận/Huyện <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Thành phố <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditingIssue(null)}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Lưu thay đổi
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  const DeleteConfirmModal = ({ issueId }: { issueId: string }) => {
    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => setDeleteConfirm(null)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-xl text-center mb-2">Xác nhận xóa</h3>
          <p className="text-gray-600 text-center mb-6">
            Bạn có chắc chắn muốn xóa báo cáo <span className="font-semibold">"{issue.title}"</span>? 
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Hủy
            </button>
            <button
              onClick={() => handleDelete(issueId)}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
            >
              Xóa
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="font-black text-gray-900 text-3xl">Báo cáo của tôi</h1>
              <p className="text-gray-500">Quản lý các báo cáo bạn đã gửi</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{myIssues.length}</p>
                <p className="text-sm text-gray-500">Tổng báo cáo</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center text-white">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {myIssues.filter((i) => i.status === "pending").length}
                </p>
                <p className="text-sm text-gray-500">Chờ xử lý</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-400 flex items-center justify-center text-white">
                <Loader2 size={20} className="animate-spin" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {myIssues.filter((i) => i.status === "processing").length}
                </p>
                <p className="text-sm text-gray-500">Đang xử lý</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {myIssues.filter((i) => i.status === "resolved").length}
                </p>
                <p className="text-sm text-gray-500">Đã giải quyết</p>
              </div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        {myIssues.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <FileText size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="font-bold text-gray-900 text-xl mb-2">Chưa có báo cáo nào</h3>
            <p className="text-gray-500 mb-6">Bạn chưa gửi báo cáo nào. Hãy báo cáo vấn đề để cải thiện cộng đồng!</p>
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Gửi báo cáo ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {myIssues.map((issue, index) => {
              const StatusIcon = STATUS_ICONS[issue.status];
              return (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row gap-5">
                    {/* Image */}
                    <img
                      src={issue.imageUrl}
                      alt={issue.title}
                      className="w-full md:w-48 h-48 rounded-xl object-cover flex-shrink-0"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-xs font-semibold text-gray-500">
                              #VN{(issue.id || "").toString().padStart(6, "0").slice(-6)}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: CATEGORY_COLORS[issue.category] }}
                            >
                              {CATEGORY_LABELS[issue.category]}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg mb-2">{issue.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{issue.description}</p>
                        </div>

                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white flex-shrink-0"
                          style={{ backgroundColor: STATUS_COLORS[issue.status] }}
                        >
                          <StatusIcon size={12} className={issue.status === "processing" ? "animate-spin" : ""} />
                          {STATUS_LABELS[issue.status]}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} />
                          {issue.district}, {issue.city}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {new Date(issue.reportedAt).toLocaleDateString("vi-VN")}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          to={`/issues/${issue.id}`}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center gap-2 text-sm"
                        >
                          <Eye size={16} />
                          Xem chi tiết
                        </Link>
                        <button
                          onClick={() => setEditingIssue(issue)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-all flex items-center gap-2 text-sm"
                        >
                          <Edit3 size={16} />
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(issue.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all flex items-center gap-2 text-sm"
                        >
                          <Trash2 size={16} />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editingIssue && <EditModal issue={editingIssue} />}
        {deleteConfirm && <DeleteConfirmModal issueId={deleteConfirm} />}
      </AnimatePresence>
    </div>
  );
}