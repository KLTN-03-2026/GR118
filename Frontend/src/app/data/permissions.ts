/**
 * Permission Management System
 * Định nghĩa kiểu dữ liệu và dữ liệu mẫu cho hệ thống quản lý quyền
 */

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "approve"
  | "export"
  | "assign"
  | "verify";

export type PermissionResource =
  | "issues_vande"              // Vấn đề
  | "activities_volunteer"      // Tình nguyện
  | "stats_overview"           // Thống kê tổng quan
  | "issues_mgnt"              // Quản lý báo cáo
  | "issues_process"           // Xử lý báo cáo
  | "users_mgnt"               // Quản lý người dùng
  | "reports_stats"            // Thống kê báo cáo
  | "activities_mgnt"          // Quản lý hoạt động tình nguyện
  | "perms_mgnt"               // Quản lý quyền
  | "roles_mgnt";              // Quản lý vai trò

export interface Permission {
  id: string;
  name: string;                    // Tên quyền (unique)
  description: string;              // Mô tả quyền
  resource: PermissionResource;     // Tài nguyên được truy cập
  actions: PermissionAction[];      // Các hành động được phép
  createdAt: string;                // Ngày tạo
  updatedAt?: string;               // Ngày cập nhật
  createdBy?: string;               // ID người tạo
  isSystem?: boolean;               // Quyền hệ thống (không thể xóa)
}

// Labels cho UI
export const RESOURCE_LABELS: Record<PermissionResource, string> = {
  issues_vande: "Vấn đề",
  activities_volunteer: "Tình nguyện",
  stats_overview: "Thống kê tổng quan",
  issues_mgnt: "Quản lý báo cáo",
  issues_process: "Xử lý báo cáo",
  users_mgnt: "Quản lý người dùng",
  reports_stats: "Thống kê báo cáo",
  activities_mgnt: "Quản lý hoạt động tình nguyện",
  perms_mgnt: "Quản lý quyền",
  roles_mgnt: "Quản lý vai trò",
};

export const ACTION_LABELS: Record<PermissionAction, string> = {
  create: "Tạo mới",
  read: "Xem",
  update: "Cập nhật",
  delete: "Xóa",
  approve: "Phê duyệt / Hoàn thành",
  export: "Xuất dữ liệu",
  assign: "Phân công / Phân quyền",
  verify: "Xác minh",
};

// Màu sắc cho resource badges
export const RESOURCE_COLORS: Record<PermissionResource, string> = {
  issues_vande: "#f59e0b",
  activities_volunteer: "#10b981",
  stats_overview: "#8b5cf6",
  issues_mgnt: "#3b82f6",
  issues_process: "#06b6d4",
  users_mgnt: "#6366f1",
  reports_stats: "#f97316",
  activities_mgnt: "#059669",
  perms_mgnt: "#ef4444",
  roles_mgnt: "#d946ef",
};

// Định nghĩa các hành động khả dụng cho từng loại tài nguyên
export const RESOURCE_ACTIONS: Record<PermissionResource, PermissionAction[]> = {
  issues_vande: ["read", "create"],
  activities_volunteer: ["read", "create"],
  stats_overview: ["read"],
  issues_mgnt: ["read", "update", "delete", "export"],
  issues_process: ["read", "update", "assign", "approve"],
  users_mgnt: ["read", "create", "update", "delete", "assign", "verify"],
  reports_stats: ["read", "export"],
  activities_mgnt: ["read", "create", "update", "delete"],
  perms_mgnt: ["read", "create", "update", "delete"],
  roles_mgnt: ["read", "create", "update", "delete"],
};
