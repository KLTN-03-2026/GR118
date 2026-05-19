import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Shield,
  ArrowLeft,
  Save,
  Loader2,
  Lock,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Link, Navigate, useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../context/PermissionsContext";
import {
  PermissionResource,
  PermissionAction,
  RESOURCE_LABELS,
  ACTION_LABELS,
  RESOURCE_COLORS,
  RESOURCE_ACTIONS,
} from "../data/permissions";
import { toast } from "sonner";

export function PermissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, can, isLoading } = useAuth();
  const { getPermissionById, updatePermission } = usePermissions();

  const permission = getPermissionById(id || "");

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    resource: "" as PermissionResource | "",
    actions: [] as PermissionAction[],
  });

  // Initialize form data - MOVED BEFORE EARLY RETURNS to respect React rules of hooks
  useEffect(() => {
    if (permission) {
      setFormData({
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        actions: permission.actions,
      });
    }
  }, [permission]);

  // Khi đổi tài nguyên, lọc bỏ các hành động không còn khả dụng
  useEffect(() => {
    if (formData.resource) {
      const validActions = RESOURCE_ACTIONS[formData.resource as PermissionResource] || [];
      setFormData(prev => ({
        ...prev,
        actions: prev.actions.filter(a => validActions.includes(a))
      }));
    }
  }, [formData.resource]);

  // Auth/loading checks
  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  // Permission guard
  if (!user || !can("perms_mgnt", "read")) {
    return <Navigate to="/" replace />;
  }

  // Redirect if permission not found
  if (!permission) {
    return <Navigate to="/admin/permissions" replace />;
  }

  const allActions: PermissionAction[] = formData.resource 
    ? RESOURCE_ACTIONS[formData.resource as PermissionResource] || []
    : [];

  const toggleAction = (action: PermissionAction) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter((a) => a !== action)
        : [...prev.actions, action],
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên quyền");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Vui lòng nhập mô tả");
      return;
    }
    if (!formData.resource) {
      toast.error("Vui lòng chọn tài nguyên");
      return;
    }
    if (formData.actions.length === 0) {
      toast.error("Vui lòng chọn ít nhất một hành động");
      return;
    }

    setIsSaving(true);

    const result = await updatePermission(permission.id, {
      name: formData.name,
      description: formData.description,
      resource: formData.resource,
      actions: formData.actions,
    });

    setIsSaving(false);

    if (result.success) {
      toast.success("Cập nhật quyền thành công!");
      setIsEditing(false);
    } else {
      toast.error(result.error || "Có lỗi xảy ra");
    }
  };

  const handleCancel = () => {
    setFormData({
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      actions: permission.actions,
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {/* Back Button */}
        <Link
          to="/admin/permissions"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-semibold">Quay lại danh sách quyền</span>
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: RESOURCE_COLORS[permission.resource] }}
              >
                <Shield size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="font-black text-gray-900 text-2xl">{permission.name}</h1>
                  {permission.isSystem && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      <Lock size={12} />
                      Quyền hệ thống
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{permission.description}</p>
              </div>
            </div>

            {!isEditing && can("perms_mgnt", "update") && (
              <button
                onClick={() => setIsEditing(true)}
                disabled={permission.isSystem}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Chỉnh sửa
              </button>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={18} className="text-blue-500" />
              <span className="text-sm font-semibold text-gray-600">Ngày tạo</span>
            </div>
            <p className="font-bold text-gray-900">
              {new Date(permission.createdAt).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </motion.div>

          {permission.updatedAt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <Calendar size={18} className="text-green-500" />
                <span className="text-sm font-semibold text-gray-600">Ngày cập nhật</span>
              </div>
              <p className="font-bold text-gray-900">
                {new Date(permission.updatedAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <User size={18} className="text-purple-500" />
              <span className="text-sm font-semibold text-gray-600">Người tạo</span>
            </div>
            <p className="font-bold text-gray-900">{permission.createdBy || "Hệ thống"}</p>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-6">
              {permission.isSystem && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900 mb-1">Lưu ý về quyền hệ thống</p>
                    <p className="text-sm text-yellow-700">
                      Bạn chỉ có thể chỉnh sửa tên và mô tả. Không thể thay đổi tài nguyên và hành động của quyền hệ thống.
                    </p>
                  </div>
                </div>
              )}

              {/* Tên quyền */}
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  Tên quyền <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Quản lý báo cáo"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Mô tả */}
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về quyền này..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                  disabled={isSaving}
                />
              </div>

              {/* Resource */}
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  Tài nguyên <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.resource}
                  onChange={(e) => setFormData({ ...formData, resource: e.target.value as PermissionResource })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                  disabled={isSaving || permission.isSystem}
                >
                  <option value="">-- Chọn tài nguyên --</option>
                  {Object.entries(RESOURCE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div>
                <label className="block font-semibold text-gray-700 mb-3">
                  Hành động <span className="text-red-500">*</span>
                </label>
                
                {/* Hiển thị preview các hành động đã chọn */}
                {formData.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    {formData.actions.map((action) => (
                      <span
                        key={action}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold flex items-center gap-2 border border-blue-100 shadow-sm"
                      >
                        <CheckCircle2 size={14} className="text-blue-500" />
                        {ACTION_LABELS[action]}
                      </span>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => toggleAction(action)}
                      disabled={isSaving || permission.isSystem}
                      className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        formData.actions.includes(action)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {formData.actions.includes(action) && <CheckCircle2 size={16} />}
                        <span>{ACTION_LABELS[action]}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="space-y-6">
              {/* Tài nguyên */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield size={18} className="text-blue-500" />
                  Tài nguyên
                </h3>
                <span
                  className="inline-block px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: RESOURCE_COLORS[permission.resource] }}
                >
                  {RESOURCE_LABELS[permission.resource]}
                </span>
              </div>

              {/* Hành động */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" />
                  Hành động được phép
                </h3>
                <div className="flex flex-wrap gap-2">
                  {permission.actions.map((action) => (
                    <span
                      key={action}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold"
                    >
                      {ACTION_LABELS[action]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Mô tả chi tiết</h3>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl">
                  {permission.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
