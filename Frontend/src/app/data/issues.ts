export type IssueCategory =
  | "road"
  | "garbage"
  | "lighting"
  | "flood"
  | "noise"
  | "other";

export type IssueStatus = "pending" | "received" | "processing" | "need_info" | "resolved" | "rejected";

export interface MediaFile {
  type: "image" | "video";
  url: string;
  thumbnail?: string; // For video thumbnails
}

export interface Rating {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: 1 | 2 | 3 | 4 | 5; // Đánh giá từ 1-5 sao
  message: string;
  evidence?: string[]; // Hình ảnh minh chứng
  createdAt: string;
  adminReviewed?: boolean;
  adminNote?: string;
}

// Legacy type for backward compatibility
export type Verification = Rating;

export interface SpamReport {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  reason: "fake" | "spam" | "inappropriate" | "duplicate" | "other";
  reasonText?: string; // Chi tiết lý do
  createdAt: string;
  moderatorReviewed?: boolean;
  moderatorNote?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  issueCode?: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  location: string;
  district: string;
  ward: string;
  city: string;
  lat: number;
  lng: number;
  imageUrl: string;
  mediaFiles?: MediaFile[]; // New field for multiple media
  reporterName: string;
  reporterId: string;
  reportedAt: string;
  updatedAt: string;
  votes: number;
  votedUserIds?: string[];
  comments: number;
  commentsList?: Comment[];
  verifications?: Verification[]; // Danh sách xác minh/tố cáo
  spamReports?: SpamReport[]; // Danh sách báo cáo spam/sai
  aiConfidence?: number;
  aiLabel?: string;
  aiVerified?: boolean;
  aiScore?: number;
  aiAnalysis?: {
    isAuthentic: boolean;
    confidenceScore: number;
    reasons: string[];
    tags: string[];
    severity: "low" | "medium" | "high" | "critical";
  };
  // Moderator workflow fields
  moderatorId?: string;
  moderatorName?: string;
  assignedTo?: string;
  assignedAt?: string;
  receivedAt?: string;
  processingNote?: string;
  completionNote?: string;
  completionEvidence?: string[];
  additionalInfoRequest?: string;
  processingHistory?: ProcessingStep[];
}

export interface ProcessingStep {
  id: string;
  action: "received" | "assigned" | "processing" | "need_info" | "resolved" | "rejected";
  note: string;
  actorId: string;
  actorName: string;
  createdAt: string;
  assignedTo?: string;
  evidence?: string[];
}

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  road: "Đường - Vỉa hè",
  garbage: "Rác thải - Môi trường",
  lighting: "Chiếu sáng công cộng",
  flood: "Ngập lụt lớn",
  noise: "Tiếng ồn - Ô nhiễm",
  other: "Khác",
};

export const CATEGORY_COLORS: Record<IssueCategory, string> = {
  road: "#f97316",
  garbage: "#84cc16",
  lighting: "#eab308",
  flood: "#3b82f6",
  noise: "#a855f7",
  other: "#6b7280",
};

export const STATUS_LABELS: Record<IssueStatus, string> = {
  pending: "Chờ xử lý",
  received: "Đã tiếp nhận",
  processing: "Đang xử lý",
  need_info: "Cần bổ sung",
  resolved: "Đã giải quyết",
  rejected: "Từ chối",
};

export const STATUS_COLORS: Record<IssueStatus, string> = {
  pending: "#f59e0b",
  received: "#6366f1",
  processing: "#3b82f6",
  need_info: "#f97316",
  resolved: "#10b981",
  rejected: "#ef4444",
};

export const mockIssues: Issue[] = [];

export const AI_CATEGORIES: Record<string, { category: IssueCategory; label: string; confidence: number }[]> = {
  road: [
    { category: "road", label: "Ổ gà - Hư hỏng mặt đường", confidence: 94 },
    { category: "road", label: "Lấn chiếm vỉa hè", confidence: 88 },
  ],
  garbage: [
    { category: "garbage", label: "Rác thải - Ô nhiễm môi trường", confidence: 91 },
  ],
  lighting: [
    { category: "lighting", label: "Đèn đường hỏng", confidence: 87 },
  ],
  flood: [
    { category: "flood", label: "Ngập úng - Tắc cống thoát nước", confidence: 96 },
  ],
  noise: [
    { category: "noise", label: "Ô nhiễm tiếng ồn", confidence: 79 },
  ],
};