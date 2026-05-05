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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          onClick={() => setEditingIssue(null)}
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden relative z-10 border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative Top Bar */}
          <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                  <Edit3 size={28} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-2xl tracking-tight">Chỉnh sửa báo cáo</h3>
                  <p className="text-gray-500 font-medium">Cập nhật thông tin chi tiết cho sự vụ của bạn</p>
                </div>
              </div>
              <button
                onClick={() => setEditingIssue(null)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side: Basic Info */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                      Tiêu đề sự vụ
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium"
                      placeholder="Nhập tiêu đề ngắn gọn..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                      Phân loại danh mục
                    </label>
                    <div className="relative">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as IssueCategory })}
                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium appearance-none"
                        required
                      >
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <Clock size={16} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                      Mô tả tình trạng
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium resize-none"
                      placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                      required
                    />
                  </div>
                </div>

                {/* Right Side: Location Info */}
                <div className="space-y-5">
                  <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50 space-y-4">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1">
                      <MapPin size={16} />
                      <span>Thông tin vị trí</span>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 ml-1">
                        Địa chỉ cụ thể
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none font-medium text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 ml-1">
                        Quận / Huyện
                      </label>
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none font-medium text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 ml-1">
                        Tỉnh / Thành phố
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none font-medium text-sm"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 items-start">
                    <AlertCircle className="text-amber-500 flex-shrink-0" size={18} />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Thông tin vị trí chính xác giúp cơ quan chức năng xử lý vấn đề nhanh chóng hơn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingIssue(null)}
                  className="px-8 py-3.5 text-gray-500 font-bold hover:text-gray-700 hover:bg-gray-100 rounded-2xl transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  <Save size={22} />
                  Cập nhật báo cáo
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
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
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300"
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
                              #{issue.issueCode || issue.id.slice(-6).toUpperCase()}
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
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-sm"
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
                            className="px-5 py-2.5 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center gap-2 text-xs"
                          >
                            <Eye size={16} />
                            Xem chi tiết
                          </Link>
                          <button
                            onClick={() => setEditingIssue(issue)}
                            className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all flex items-center gap-2 text-xs"
                          >
                            <Edit3 size={16} />
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(issue.id)}
                            className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center gap-2 text-xs"
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