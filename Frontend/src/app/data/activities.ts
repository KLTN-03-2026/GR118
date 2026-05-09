export interface Participant {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  userCity?: string;
  userAvatar?: string;
  note?: string;
  registeredAt: string;
  status: "registered" | "cancelled" | "attended" | "absent";
  cancelledAt?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  content: string; // Nội dung chi tiết
  location: string;
  district: string;
  ward: string;
  city: string;
  lat: number;
  lng: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  maxParticipants: number; // Số lượng tối đa
  currentParticipants: number; // Số người đã đăng ký
  imageUrl: string;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  registrationOpen: boolean; // Đóng/mở đăng ký
  status: "upcoming" | "ongoing" | "completed" | "cancelled" | "hidden";
  tags?: string[];
  participants?: Participant[];
}

export const mockActivities: Activity[] = [];

export const mockParticipants: Participant[] = [];
