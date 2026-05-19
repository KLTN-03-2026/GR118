import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Eye,
  ChevronDown,
  Lock,
  AlertCircle,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Link, Navigate } from "react-router";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "../components/ui/drawer";

// ──────────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────────

const DeletePermissionModal = ({
  permissionId,
  permissions,
  onClose,
  onDelete,
}: {
  permissionId: string;
  permissions: any[];
  onClose: () => void;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const permission = permissions.find((p) => p.id === permissionId);

  if (!permission) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await onDelete(permissionId);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Xóa quyền thành công!");
      onClose();
    } else {
      toast.error(result.error || "Có lỗi xảy ra");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => !isDeleting && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Xác nhận xóa quyền</h3>
            <p className="text-gray-600 text-sm">
              Bạn có chắc chắn muốn xóa quyền <span className="font-semibold">"{permission.name}"</span>?
            </p>
            {permission.isSystem && (
              <p className="text-red-600 text-sm mt-2 font-semibold">
                ⚠️ Đây là quyền hệ thống, không thể xóa!
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || permission.isSystem}
            className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 size={18} />
                Xóa quyền
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export function PermissionsPage() {
  const { can, user, isLoading } = useAuth();
  const { permissions, addPermission, deletePermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceFilter, setResourceFilter] = useState<PermissionResource | "all">("all");
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    resource: "" as PermissionResource | "",
    actions: [] as PermissionAction[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!can("perms_mgnt", "read")) {
    return <Navigate to="/" replace />;
  }

  // Filter permissions
  const filteredPermissions = permissions.filter((perm) => {
    const matchesSearch =
      perm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      perm.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesResource = resourceFilter === "all" || perm.resource === resourceFilter;
    return matchesSearch && matchesResource;
  });

  // Stats
  const stats = [
    {
      label: "Tổng quyền",
      value: permissions.length,
      icon: Shield,
      color: "bg-blue-500",
    },
    {
      label: "Quyền hệ thống",
      value: permissions.filter((p) => p.isSystem).length,
      icon: Lock,
      color: "bg-purple-500",
    },
    {
      label: "Quyền tùy chỉnh",
      value: permissions.filter((p) => !p.isSystem).length,
      icon: Edit3,
      color: "bg-green-500",
    },
  ];

  const allActions: PermissionAction[] = formData.resource 
    ? RESOURCE_ACTIONS[formData.resource as PermissionResource] || []
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) { toast.error("Vui lòng nhập tên quyền"); return; }
    if (!formData.description.trim()) { toast.error("Vui lòng nhập mô tả"); return; }
    if (!formData.resource) { toast.error("Vui lòng chọn tài nguyên"); return; }
    if (formData.actions.length === 0) { toast.error("Vui lòng chọn ít nhất một hành động"); return; }

    setIsSubmitting(true);
    const result = await addPermission({
      name: formData.name,
      description: formData.description,
      resource: formData.resource,
      actions: formData.actions,
      createdBy: user?.id,
    });
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Tạo quyền mới thành công!");
      setShowAddDrawer(false);
      setFormData({ name: "", description: "", resource: "", actions: [] });
    } else {
      toast.error(result.error || "Có lỗi xảy ra");
    }
  };

  const toggleAction = (action: PermissionAction) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter((a) => a !== action)
        : [...prev.actions, action],
    }));
  };


  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="font-black text-gray-900 text-3xl">Quản lý quyền</h1>
                <p className="text-gray-500">Quản lý các quyền truy cập trong hệ thống</p>
              </div>
            </div>
            {can("perms_mgnt", "create") && (
              <button
                onClick={() => setShowAddDrawer(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Plus size={18} />
                Thêm quyền
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center text-white`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc mô tả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <div className="relative">
              <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value as PermissionResource | "all")}
                className="pl-11 pr-10 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none bg-white cursor-pointer min-w-[200px]"
              >
                <option value="all">Tất cả tài nguyên</option>
                {Object.entries(RESOURCE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPermissions.length === 0 ? (
            <div key="empty-state" className="col-span-full bg-white rounded-2xl p-12 text-center border border-gray-100">
              <AlertCircle size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400">Không tìm thấy quyền nào</p>
            </div>
          ) : (
            filteredPermissions.map((permission, index) => (
              <motion.div
                key={permission.id || `perm-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 truncate">{permission.name}</h3>
                      {permission.isSystem && (
                        <Lock size={14} className="text-purple-500 flex-shrink-0" title="Quyền hệ thống" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{permission.description}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <span
                    className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: RESOURCE_COLORS[permission.resource] }}
                  >
                    {RESOURCE_LABELS[permission.resource]}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {new Date(permission.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/permissions/${permission.id}`}
                      className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </Link>
                    {can("perms_mgnt", "update") && (
                      <Link
                        to={`/admin/permissions/${permission.id}`}
                        className="p-2 hover:bg-orange-50 rounded-lg text-orange-600 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={16} />
                      </Link>
                    )}
                    {can("perms_mgnt", "delete") && (
                      <button
                        onClick={() => setShowDeleteModal(permission.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors disabled:opacity-50"
                        title={permission.isSystem ? "Không thể xóa quyền hệ thống" : "Xóa"}
                        disabled={permission.isSystem}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {filteredPermissions.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Hiển thị {filteredPermissions.length} / {permissions.length} quyền
          </div>
        )}
      </div>

      {/* Add Permission Drawer - full width, slides from left */}
      <Drawer
        open={showAddDrawer}
        onOpenChange={(open) => { if (!isSubmitting) setShowAddDrawer(open); }}
        direction="left"
      >
        <DrawerContent className="w-full! sm:max-w-full! h-screen! flex flex-col">
          <DrawerHeader className="border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                  <Plus size={20} />
                </div>
                <div>
                  <span className="font-black text-gray-900 text-xl block">Thêm quyền mới</span>
                  <span className="text-sm text-gray-500 font-normal">Tạo quyền mới cho hệ thống</span>
                </div>
              </DrawerTitle>
              <button
                onClick={() => !isSubmitting && setShowAddDrawer(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <DrawerDescription className="sr-only">Form thêm quyền mới vào hệ thống</DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-8">
              <form onSubmit={handleSubmit}>
                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* LEFT: Tên quyền + Mô tả */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">1</span>
                        Thông tin cơ bản
                      </h3>
                    </div>

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
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Mô tả */}
                    <div className="flex-1">
                      <label className="block font-semibold text-gray-700 mb-2">
                        Mô tả <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Mô tả chi tiết về quyền này..."
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* RIGHT: Tài nguyên + Hành động */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-black">2</span>
                        Phạm vi & Hành động
                      </h3>
                    </div>

                    {/* Resource */}
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">
                        Tài nguyên <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.resource}
                          onChange={(e) => setFormData({ ...formData, resource: e.target.value as PermissionResource })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer pr-10"
                          disabled={isSubmitting}
                        >
                          <option value="">-- Chọn tài nguyên --</option>
                          {Object.entries(RESOURCE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <label className="block font-semibold text-gray-700 mb-3">
                        Hành động <span className="text-red-500">*</span>
                        {formData.actions.length > 0 && (
                          <span className="ml-2 text-blue-600 font-normal text-sm">
                            (Đã chọn: {formData.actions.length})
                          </span>
                        )}
                      </label>

                      {/* Hiển thị preview các hành động đã chọn */}
                      {formData.actions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-wrap gap-2 mb-4 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200"
                        >
                          {formData.actions.map((action) => (
                            <span
                              key={action}
                              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold flex items-center gap-2 border border-blue-100 shadow-sm"
                            >
                              <CheckCircle2 size={14} className="text-blue-500" />
                              {ACTION_LABELS[action]}
                            </span>
                          ))}
                        </motion.div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {allActions.map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => toggleAction(action)}
                            disabled={isSubmitting}
                            className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                              formData.actions.includes(action)
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {formData.actions.includes(action) && <CheckCircle2 size={16} className="flex-shrink-0" />}
                              <span>{ACTION_LABELS[action]}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons - full width below two columns */}
                <div className="flex gap-3 pt-8 mt-8 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddDrawer(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Tạo quyền
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <DeletePermissionModal
            key="delete-modal"
            permissionId={showDeleteModal}
            permissions={permissions}
            onClose={() => setShowDeleteModal(null)}
            onDelete={deletePermission}
          />
        )}
      </AnimatePresence>
    </div>
  );
}