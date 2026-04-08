import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  UserCog, 
  Search, 
  Filter, 
  Eye, 
  Plus,
  Trash2,
  ChevronDown,
  Shield,
  Users,
  AlertCircle,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  X,
} from "lucide-react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useRoles } from "../context/RolesContext";
import { usePermissions } from "../context/PermissionsContext";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "../components/ui/drawer";

export function RolesPage() {
  const { user } = useAuth();
  const { roles, isLoading, addRole, deleteRole } = useRoles();
  const { permissions } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state lifted up
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissionIds: [] as string[],
    isActive: true,
  });

  // Redirect if not admin
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && role.isActive) ||
      (statusFilter === "inactive" && !role.isActive);
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: "Tổng vai trò", value: roles.length, icon: UserCog, color: "bg-blue-500" },
    { label: "Đang hoạt động", value: roles.filter((r) => r.isActive).length, icon: CheckCircle2, color: "bg-green-500" },
    { label: "Đã vô hiệu hóa", value: roles.filter((r) => !r.isActive).length, icon: XCircle, color: "bg-gray-500" },
    { label: "Tổng người dùng", value: roles.reduce((sum, r) => sum + (r.userCount || 0), 0), icon: Users, color: "bg-purple-500" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên vai trò");
      setIsSubmitting(false);
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Vui lòng nhập mô tả vai trò");
      setIsSubmitting(false);
      return;
    }
    if (formData.permissionIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một quyền");
      setIsSubmitting(false);
      return;
    }

    const result = await addRole({
      name: formData.name.trim(),
      description: formData.description.trim(),
      permissionIds: formData.permissionIds,
      isActive: formData.isActive,
      userCount: 0,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Thêm vai trò thành công!");
      setShowAddDrawer(false);
      setFormData({ name: "", description: "", permissionIds: [], isActive: true });
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

  // Delete Role Modal
  const DeleteRoleModal = ({ roleId }: { roleId: string }) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return null;

    const handleDelete = async () => {
      setIsSubmitting(true);
      const result = await deleteRole(roleId);
      setIsSubmitting(false);

      if (result.success) {
        toast.success("Xóa vai trò thành công!");
        setShowDeleteModal(null);
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
        onClick={() => !isSubmitting && setShowDeleteModal(null)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Xóa vai trò</h3>
              <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <p className="text-sm text-gray-600 mb-2">Bạn có chắc chắn muốn xóa vai trò:</p>
            <p className="font-bold text-gray-900">{role.name}</p>
            {role.userCount && role.userCount > 0 && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle size={14} />
                Vai trò này đang được gán cho {role.userCount} người dùng
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(null)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Xóa vai trò
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Link
                to="/admin"
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </Link>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                <UserCog size={24} />
              </div>
              <div>
                <h1 className="font-black text-gray-900 text-3xl">Quản lý vai trò</h1>
                <p className="text-gray-500">Quản lý vai trò và phân quyền hệ thống</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddDrawer(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
            >
              <Plus size={18} />
              Thêm vai trò
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                placeholder="Tìm kiếm theo tên vai trò hoặc mô tả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <div className="relative">
              <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                className="pl-11 pr-10 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none bg-white cursor-pointer min-w-[200px]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã vô hiệu hóa</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-gray-100">
              <AlertCircle size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Không tìm thấy vai trò nào</p>
            </div>
          ) : (
            filteredRoles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{role.name}</h3>
                      {role.isSystem && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                          <Shield size={10} />
                          Hệ thống
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{role.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {role.isActive ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      <CheckCircle2 size={12} />
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                      <XCircle size={12} />
                      Đã vô hiệu hóa
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={14} className="text-blue-500" />
                      <span className="text-xs text-gray-600">Quyền</span>
                    </div>
                    <p className="font-black text-gray-900 text-lg">{role.permissionIds.length}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users size={14} className="text-purple-500" />
                      <span className="text-xs text-gray-600">Người dùng</span>
                    </div>
                    <p className="font-black text-gray-900 text-lg">{role.userCount || 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 pb-4 border-b border-gray-100">
                  <Calendar size={12} />
                  <span>Tạo: {new Date(role.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/admin/roles/${role.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-semibold hover:bg-blue-100 transition-all"
                  >
                    <Eye size={16} />
                    Chi tiết
                  </Link>
                  {!role.isSystem && (
                    <button
                      onClick={() => setShowDeleteModal(role.id)}
                      disabled={!!(role.userCount && role.userCount > 0)}
                      className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title={role.userCount && role.userCount > 0 ? "Không thể xóa vai trò đang được sử dụng" : "Xóa vai trò"}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Add Role Drawer - full width, slides from left */}
      <Drawer
        open={showAddDrawer}
        onOpenChange={(open) => { if (!isSubmitting) setShowAddDrawer(open); }}
        direction="left"
      >
        <DrawerContent className="w-full! sm:max-w-full! h-screen! flex flex-col">
          <DrawerHeader className="border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                  <Plus size={20} />
                </div>
                <div>
                  <span className="font-black text-gray-900 text-xl block">Thêm vai trò mới</span>
                  <span className="text-sm text-gray-500 font-normal">Tạo vai trò và gán quyền từ hệ thống</span>
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
            <DrawerDescription className="sr-only">Form thêm vai trò mới vào hệ thống</DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-8">
              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                  {/* LEFT: Tên vai trò + Mô tả + Trạng thái */}
                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">1</span>
                      Thông tin cơ bản
                    </h3>

                    {/* Role Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tên vai trò <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ví dụ: Quản lý nội dung"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Mô tả <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Mô tả vai trò và trách nhiệm..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-semibold text-gray-900">Trạng thái vai trò</p>
                        <p className="text-sm text-gray-500">Vai trò có đang hoạt động không?</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        className={`relative w-14 h-8 rounded-full transition-all flex-shrink-0 ${
                          formData.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                        disabled={isSubmitting}
                      >
                        <motion.div
                          layout
                          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                          style={{ left: formData.isActive ? 30 : 4 }}
                        />
                      </button>
                    </div>

                    {/* Buttons - Moved to left column */}
                    <div className="flex gap-3 pt-6">
                      <button
                        type="button"
                        onClick={() => setShowAddDrawer(false)}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <Plus size={18} />
                            Thêm vai trò
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* RIGHT: Gán quyền dạng bảng */}
                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-black">2</span>
                      Phân quyền
                      {formData.permissionIds.length > 0 && (
                        <span className="ml-2 text-blue-600 text-sm font-normal">
                          (Đã chọn: {formData.permissionIds.length})
                        </span>
                      )}
                    </h3>

                    {/* Permissions Table */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 text-left">
                                <input
                                  type="checkbox"
                                  checked={formData.permissionIds.length === permissions.length && permissions.length > 0}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({ ...formData, permissionIds: permissions.map(p => p.id) });
                                    } else {
                                      setFormData({ ...formData, permissionIds: [] });
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  disabled={isSubmitting}
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Tên quyền
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Tài nguyên
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Hành động
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {permissions.map((permission) => (
                              <tr
                                key={permission.id}
                                className={`hover:bg-gray-50 transition-colors ${
                                  formData.permissionIds.includes(permission.id) ? 'bg-blue-50' : ''
                                }`}
                              >
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={formData.permissionIds.includes(permission.id)}
                                    onChange={() => togglePermission(permission.id)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    disabled={isSubmitting}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm">{permission.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{permission.description}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                    {permission.resource}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {permission.actions.map((action) => (
                                      <span
                                        key={action}
                                        className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium"
                                      >
                                        {action}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && <DeleteRoleModal roleId={showDeleteModal} />}
      </AnimatePresence>
    </div>
  );
}