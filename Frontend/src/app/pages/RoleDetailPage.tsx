import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Save,
  Shield,
  Users,
  Calendar,
  Edit3,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Info,
  User,
} from "lucide-react";
import { Link, useParams, Navigate, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useRoles } from "../context/RolesContext";
import { usePermissions } from "../context/PermissionsContext";
import { RESOURCE_LABELS, ACTION_LABELS, RESOURCE_COLORS } from "../data/permissions";
import { toast } from "sonner";

export function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { roles, updateRole, toggleRoleStatus } = useRoles();
  const { permissions } = usePermissions();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToggleModal, setShowToggleModal] = useState(false);

  const role = roles.find((r) => r.id === id);

  const [formData, setFormData] = useState({
    name: role?.name || "",
    description: role?.description || "",
    permissionIds: role?.permissionIds || [],
  });

  // Update form data when role changes
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        permissionIds: role.permissionIds,
      });
    }
  }, [role]);

  // Redirect if not admin
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Role not found
  if (!role) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-gray-300" />
          <h2 className="font-bold text-gray-900 text-2xl mb-2">Không tìm thấy vai trò</h2>
          <p className="text-gray-500 mb-6">Vai trò này không tồn tại hoặc đã bị xóa</p>
          <Link
            to="/admin/roles"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all"
          >
            <ArrowLeft size={18} />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên vai trò");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Vui lòng nhập mô tả vai trò");
      return;
    }

    if (formData.permissionIds.length === 0) {
      toast.error("Vai trò phải có ít nhất một quyền");
      return;
    }

    setIsSaving(true);
    const result = await updateRole(role.id, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      permissionIds: formData.permissionIds,
    });
    setIsSaving(false);

    if (result.success) {
      toast.success("Cập nhật vai trò thành công!");
      setIsEditing(false);
    } else {
      toast.error(result.error || "Có lỗi xảy ra");
    }
  };

  const handleToggleStatus = async () => {
    setIsSaving(true);
    const result = await toggleRoleStatus(role.id);
    setIsSaving(false);

    if (result.success) {
      toast.success(
        role.isActive
          ? "Đã vô hiệu hóa vai trò"
          : "Đã kích hoạt vai trò"
      );
      setShowToggleModal(false);
    } else {
      toast.error(result.error || "Có lỗi xảy ra");
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const rolePermissions = permissions.filter((p) =>
    role.permissionIds.includes(p.id)
  );

  // Group permissions by resource
  const permissionsByResource = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  // Toggle Status Modal
  const ToggleStatusModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => !isSaving && setShowToggleModal(false)}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            role.isActive ? "bg-orange-100" : "bg-green-100"
          }`}>
            {role.isActive ? (
              <XCircle size={24} className="text-orange-600" />
            ) : (
              <CheckCircle2 size={24} className="text-green-600" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              {role.isActive ? "Vô hiệu hóa vai trò" : "Kích hoạt vai trò"}
            </h3>
            <p className="text-sm text-gray-500">Xác nhận thay đổi trạng thái</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-sm text-gray-600 mb-2">
            {role.isActive
              ? "Vai trò sẽ bị vô hiệu hóa và người dùng sẽ không thể sử dụng các quyền liên quan."
              : "Vai trò sẽ được kích hoạt và người dùng có thể sử dụng các quyền đã gán."}
          </p>
          <p className="font-bold text-gray-900">{role.name}</p>
          {role.userCount && role.userCount > 0 && (
            <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
              <AlertCircle size={14} />
              Ảnh hưởng đến {role.userCount} người dùng
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowToggleModal(false)}
            disabled={isSaving}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleToggleStatus}
            disabled={isSaving}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
              role.isActive ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Đang xử lý...
              </>
            ) : role.isActive ? (
              <>
                <XCircle size={18} />
                Vô hiệu hóa
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Kích hoạt
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Link
                to="/admin/roles"
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </Link>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="font-black text-gray-900 text-2xl">Chi tiết vai trò</h1>
                <p className="text-gray-500 text-sm">Xem và chỉnh sửa thông tin vai trò</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowToggleModal(true)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                  role.isActive
                    ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {role.isActive ? (
                  <>
                    <ToggleRight size={18} />
                    Vô hiệu hóa
                  </>
                ) : (
                  <>
                    <ToggleLeft size={18} />
                    Kích hoạt
                  </>
                )}
              </button>
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: role.name,
                        description: role.description,
                        permissionIds: role.permissionIds,
                      });
                    }}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-3 border border-gray-200 bg-white rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    <X size={18} />
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all disabled:opacity-50"
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
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all"
                >
                  <Edit3 size={18} />
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Info size={20} className="text-blue-500" />
                <h2 className="font-bold text-gray-900 text-lg">Thông tin cơ bản</h2>
              </div>

              <div className="space-y-4">
                {/* Role Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên vai trò
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      disabled={role.isSystem}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-lg">{role.name}</p>
                      {role.isSystem && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                          <Shield size={10} />
                          Hệ thống
                        </span>
                      )}
                    </div>
                  )}
                  {role.isSystem && isEditing && (
                    <p className="text-xs text-gray-500 mt-1">
                      Không thể thay đổi tên vai trò hệ thống
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mô tả
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                    />
                  ) : (
                    <p className="text-gray-600">{role.description}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  {role.isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      <CheckCircle2 size={14} />
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                      <XCircle size={14} />
                      Đã vô hiệu hóa
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Permissions Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-purple-500" />
                  <h2 className="font-bold text-gray-900 text-lg">
                    Quyền được gán ({isEditing ? formData.permissionIds.length : rolePermissions.length})
                  </h2>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {Object.entries(permissionsByResource).map(([resource, perms]) => (
                    <div key={resource}>
                      <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">
                        {RESOURCE_LABELS[resource as keyof typeof RESOURCE_LABELS]}
                      </h4>
                      <div className="space-y-2">
                        {perms.map((permission) => (
                          <label
                            key={permission.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 ${
                              formData.permissionIds.includes(permission.id)
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissionIds.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm">
                                {permission.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {permission.description}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {permission.actions.map((action) => (
                                  <span
                                    key={action}
                                    className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                                  >
                                    {ACTION_LABELS[action]}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : rolePermissions.length > 0 ? (
                <div className="space-y-3">
                  {rolePermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900">{permission.name}</h4>
                            {permission.isSystem && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                <Shield size={10} />
                                Hệ thống
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{permission.description}</p>
                        </div>
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: RESOURCE_COLORS[permission.resource] + "20" }}
                        >
                          <Shield
                            size={20}
                            style={{ color: RESOURCE_COLORS[permission.resource] }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold text-white"
                          style={{ backgroundColor: RESOURCE_COLORS[permission.resource] }}
                        >
                          {RESOURCE_LABELS[permission.resource]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShieldAlert size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">Vai trò chưa có quyền nào</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Thống kê</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Shield size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số quyền</p>
                    <p className="font-black text-gray-900 text-xl">
                      {role.permissionIds.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Người dùng</p>
                    <p className="font-black text-gray-900 text-xl">
                      {role.userCount || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Thông tin khác</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={14} className="text-gray-400" />
                  <span>Tạo: {new Date(role.createdAt).toLocaleString("vi-VN")}</span>
                </div>
                {role.updatedAt && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    <span>
                      Cập nhật: {new Date(role.updatedAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                )}
                {role.createdBy && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User size={14} className="text-gray-400" />
                    <span>Người tạo: {role.createdBy}</span>
                  </div>
                )}
              </div>
            </div>

            {/* System Role Warning */}
            {role.isSystem && (
              <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                <div className="flex items-start gap-3">
                  <Shield size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-red-900 mb-1">Vai trò hệ thống</h4>
                    <p className="text-sm text-red-700">
                      Vai trò này là vai trò hệ thống và không thể xóa. Một số trường có thể bị
                      giới hạn chỉnh sửa.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {showToggleModal && <ToggleStatusModal />}
        </AnimatePresence>
      </div>
    </div>
  );
}