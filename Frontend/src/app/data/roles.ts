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

// Dữ liệu mẫu - Vai trò mặc định của hệ thống
export const mockRoles: Role[] = [
  {
    id: "role_001",
    name: "Quản trị viên hệ thống",
    description: "Có toàn quyền truy cập và quản lý mọi chức năng trong hệ thống",
    permissionIds: [
      "perm_001", // Quản lý toàn bộ báo cáo
      "perm_003", // Quản lý người dùng
      "perm_005", // Quản lý hoạt động tình nguyện
      "perm_006", // Xem thống kê hệ thống
      "perm_007", // Xem xét xác minh
      "perm_008", // Quản lý quyền hệ thống
      "perm_009", // Cài đặt hệ thống
      "perm_010", // Xuất báo cáo dữ liệu
    ],
    isActive: true,
    isSystem: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    createdBy: "system",
    userCount: 5,
  },
  {
    id: "role_002",
    name: "Cán bộ phường/xã",
    description: "Quản lý và xử lý các báo cáo trong phạm vi được phân công",
    permissionIds: [
      "perm_001", // Quản lý toàn bộ báo cáo
      "perm_004", // Xem danh sách người dùng
      "perm_005", // Quản lý hoạt động tình nguyện
      "perm_006", // Xem thống kê hệ thống
    ],
    isActive: true,
    isSystem: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    createdBy: "system",
    userCount: 15,
  },
  {
    id: "role_003",
    name: "Công dân",
    description: "Người dùng thông thường, có thể báo cáo vấn đề và theo dõi tiến độ",
    permissionIds: [
      "perm_002", // Xem báo cáo
    ],
    isActive: true,
    isSystem: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    createdBy: "system",
    userCount: 245,
  },
  {
    id: "role_004",
    name: "Chuyên viên xác minh",
    description: "Chuyên trách xem xét và xác minh các yêu cầu từ người dùng",
    permissionIds: [
      "perm_002", // Xem báo cáo
      "perm_004", // Xem danh sách người dùng
      "perm_007", // Xem xét xác minh
    ],
    isActive: true,
    isSystem: false,
    createdAt: "2024-01-05T00:00:00.000Z",
    createdBy: "admin_001",
    userCount: 8,
  },
  {
    id: "role_005",
    name: "Điều phối viên tình nguyện",
    description: "Quản lý và điều phối các hoạt động tình nguyện",
    permissionIds: [
      "perm_002", // Xem báo cáo
      "perm_005", // Quản lý hoạt động tình nguyện
    ],
    isActive: true,
    isSystem: false,
    createdAt: "2024-01-10T00:00:00.000Z",
    createdBy: "admin_001",
    userCount: 12,
  },
  {
    id: "role_006",
    name: "Phân tích dữ liệu",
    description: "Xem và phân tích các báo cáo thống kê, xuất dữ liệu",
    permissionIds: [
      "perm_002", // Xem báo cáo
      "perm_006", // Xem thống kê hệ thống
      "perm_010", // Xuất báo cáo dữ liệu
    ],
    isActive: true,
    isSystem: false,
    createdAt: "2024-01-15T00:00:00.000Z",
    createdBy: "admin_001",
    userCount: 6,
  },
  {
    id: "role_007",
    name: "Hỗ trợ kỹ thuật",
    description: "Vai trò tạm thời đã bị vô hiệu hóa",
    permissionIds: [
      "perm_004", // Xem danh sách người dùng
    ],
    isActive: false,
    isSystem: false,
    createdAt: "2024-02-01T00:00:00.000Z",
    createdBy: "admin_001",
    userCount: 0,
  },
];

// Labels và colors cho UI
export const ROLE_STATUS_COLORS = {
  active: "#10b981",      // green
  inactive: "#6b7280",    // gray
};

export const ROLE_STATUS_LABELS = {
  active: "Đang hoạt động",
  inactive: "Đã vô hiệu hóa",
};
