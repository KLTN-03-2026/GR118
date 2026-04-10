/**
 * Role Management System
 * Định nghĩa kiểu dữ liệu và dữ liệu mẫu cho hệ thống quản lý vai trò
 */

export interface Role {
  id: string;
  name: string;                    // Tên vai trò (unique)
  description: string;              // Mô tả vai trò
  permissionIds: string[];          // Danh sách ID quyền được gán cho vai trò này
  isActive: boolean;                // Vai trò có đang hoạt động không
  isSystem?: boolean;               // Vai trò hệ thống (không thể xóa)
  createdAt: string;                // Ngày tạo
  updatedAt?: string;               // Ngày cập nhật
  createdBy?: string;               // ID người tạo
  userCount?: number;               // Số lượng người dùng có vai trò này
}

// Labels và colors cho UI
export const ROLE_STATUS_COLORS = {
  active: "#10b981",      // green
  inactive: "#6b7280",    // gray
};

export const ROLE_STATUS_LABELS = {
  active: "Đang hoạt động",
  inactive: "Đã vô hiệu hóa",
};
