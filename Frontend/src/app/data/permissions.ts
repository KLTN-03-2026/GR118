/**
 * Permission Management System
 * Định nghĩa kiểu dữ liệu và dữ liệu mẫu cho hệ thống quản lý quyền
 */

export type PermissionAction = "create" | "read" | "update" | "delete" | "approve" | "export" | "assign";

export type PermissionResource =
  | "issues"           // Quản lý báo cáo
  | "users"            // Quản lý người dùng
  | "activities"       // Quản lý hoạt động tình nguyện
  | "statistics"       // Xem thống kê
  | "verifications"    // Quản lý xác minh
  | "permissions"      // Quản lý quyền
  | "system"           // Cài đặt hệ thống
  | "reports";         // Báo cáo dữ liệu

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

// Dữ liệu mẫu - Quyền mặc định của hệ thống
export const mockPermissions: Permission[] = [
  {
    id: "perm_001",
    name: "Quản lý toàn bộ báo cáo",
    description: "Có thể xem, tạo, cập nhật, xóa và phê duyệt tất cả các báo cáo vấn đề",
    resource: "issues",
    actions: ["create", "read", "update", "delete", "approve"],
    createdAt: "2024-01-01T00:00:00.000Z",
    createdBy: "admin_001",
    isSystem: true,
  },
  {
    id: "perm_002",
    name: "Xem báo cáo",
    description: "Chỉ có quyền xem danh sách và chi tiết các báo cáo",
    resource: "issues",
    actions: ["read"],
    createdAt: "2024-01-01T00:00:00.000Z",
    createdBy: "admin_001",
    isSystem: true,
  },
  {
    id: "perm_003",
    name: "Quản lý người dùng",
    description: "Có thể xem, chỉnh sửa, xóa và phân quyền người dùng",
    resource: "users",
    actions: ["read", "update", "delete", "assign"],
    createdAt: "2024-01-01T00:00:00.000Z",
    createdBy: "admin_001",
    isSystem: true,
  },
  {
    id: "perm_004",
    name: "Xem danh sách người dùng",
    description: "Chỉ có quyền xem thông tin người dùng",
    resource: "users",
    actions: ["read"],
    createdAt: "2024-01-01T00:00:00.000Z",
    createdBy: "admin_001",
    isSystem: false,
  },
  {
    id: "perm_005",
    name: "Quản lý hoạt động tình nguyện",
    description: "Có thể tạo, xem, cập nhật và xóa các hoạt động tình nguyện",
    resource: "activities",
    actions: ["create", "read", "update", "delete", "approve"],
    createdAt: "2024-01-02T00:00:00.000Z",
    createdBy: "admin_001",
    isSystem: true,
  },
  {
    id: "perm_006",
    name: "Xem thống kê hệ thống",
    description: "Có quyền truy cập và xem các báo cáo thống kê",
    resource: "statistics",
    actions: ["read", "export"],
    createdAt: "2024-01-02T00:00:00.000Z",
    createdBy: "admin_001",
    isSystem: false,
  },
  {
    id: "perm_007",
    name: "Xem xét xác minh",
    description: "Có thể xem và phê duyệt các yêu cầu xác minh từ người dùng",
    resource: "verifications",
    actions: ["read", "approve"],
    createdAt: "2024-01-03T00:00:00.000Z",
    createdBy: "admin_001",
    isSystem: true,
  },
  {
    id: "perm_008",
    name: "Quản lý quyền hệ thống",
    description: "Có thể tạo, xem, cập nhật và xóa các quyền trong hệ thống",
    resource: "permissions",
    actions: ["create", "read", "update", "delete"],
    createdAt: "2024-01-03T00:00:00.000Z",
    createdBy: "admin_001",
    isSystem: true,
  },
  {
    id: "perm_009",
    name: "Cài đặt hệ thống",
    description: "Có quyền truy cập và thay đổi cài đặt hệ thống",
    resource: "system",
    actions: ["read", "update"],
    createdAt: "2024-01-04T00:00:00.000Z",
    createdBy: "admin_001",
    isSystem: true,
  },
  {
    id: "perm_010",
    name: "Xuất báo cáo dữ liệu",
    description: "Có quyền xuất và tải xuống các báo cáo dữ liệu",
    resource: "reports",
    actions: ["read", "export"],
    createdAt: "2024-01-05T00:00:00.000Z",
    createdBy: "admin_001",
    isSystem: false,
  },
];

// Labels cho UI
export const RESOURCE_LABELS: Record<PermissionResource, string> = {
  issues: "Báo cáo vấn đề",
  users: "Người dùng",
  activities: "Hoạt động tình nguyện",
  statistics: "Thống kê",
  verifications: "Xác minh",
  permissions: "Quyền hệ thống",
  system: "Cài đặt hệ thống",
  reports: "Báo cáo dữ liệu",
};

export const ACTION_LABELS: Record<PermissionAction, string> = {
  create: "Tạo mới",
  read: "Xem",
  update: "Cập nhật",
  delete: "Xóa",
  approve: "Phê duyệt",
  export: "Xuất dữ liệu",
  assign: "Phân công",
};

// Màu sắc cho resource badges
export const RESOURCE_COLORS: Record<PermissionResource, string> = {
  issues: "#f59e0b",        // amber
  users: "#3b82f6",         // blue
  activities: "#10b981",    // green
  statistics: "#8b5cf6",    // purple
  verifications: "#06b6d4", // cyan
  permissions: "#ef4444",   // red
  system: "#6366f1",        // indigo
  reports: "#f97316",       // orange
};
