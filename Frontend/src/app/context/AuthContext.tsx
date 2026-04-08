import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  avatar?: string;
  joinedAt: string;
  reportsCount: number;
  resolvedCount: number;
  role: "admin" | "moderator" | "user";
  roleId?: string;
  banned?: boolean;
  banReason?: string;
  banLevel?: "24h" | "3days" | "1month" | "permanent";
  bannedAt?: string;
  bannedUntil?: string;
  warnings?: Array<{
    id: string;
    reason: string;
    createdAt: string;
    adminName: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  sendResetCode: (email: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  verifyResetCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  sendChangePasswordOTP: (email: string, currentPassword: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  changePassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const CURRENT_USER_KEY = "baocaovn_current_user";
const API_BASE_URL = "http://localhost:8081/api/v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (e) {
      console.error("Failed to load user from storage", e);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userName: email, password }),
      });
      const result = await res.json();
      
      if (res.ok && result.success) {
        const beUser = result.user;
        const userData: User = {
          id: beUser._id,
          name: beUser.userName,
          email: beUser.email,
          phone: beUser.phone,
          city: beUser.city,
          avatar: beUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(beUser.userName)}`,
          joinedAt: beUser.createdAt || new Date().toISOString(),
          reportsCount: beUser.reportsCount || 0,
          resolvedCount: beUser.resolvedCount || 0,
          role: beUser.role || "user",
          roleId: beUser.roleId,
          banned: beUser.lockEnd && new Date(beUser.lockEnd) > new Date() ? true : false,
          banReason: beUser.lockReason
        };

        if (userData.banned) {
          return { success: false, error: `Tài khoản của bạn đã bị khóa. Lý do: ${userData.banReason || "Vi phạm quy định"}` };
        }

        setUser(userData);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
        return { success: true };
      }
      
      return { success: false, error: result.message || "Email hoặc mật khẩu không đúng" };
    } catch (error) {
      return { success: false, error: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau." };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: data.name,
          email: data.email,
          password: data.password,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        return { success: false, error: result.message || "Đăng ký thất bại" };
      }
      // Tự động đăng nhập sau khi đăng ký thành công
      return await login(data.email, data.password);
    } catch {
      return { success: false, error: "Không thể kết nối đến máy chủ" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
  };

  const sendResetCode = async (email: string): Promise<{ success: boolean; error?: string; code?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "reset" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.message || "Gửi mã thất bại" };
      }
      return { success: true };
    } catch {
      return { success: false, error: "Không thể kết nối đến máy chủ" };
    }
  };

  const sendChangePasswordOTP = async (email: string, _currentPassword: string): Promise<{ success: boolean; error?: string; code?: string }> => {
    // Note: Verification of currentPassword should ideally happen on BE before sending OTP
    return await sendResetCode(email);
  };

  const changePassword = async (email: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    return await resetPassword(email, code, newPassword);
  };

  const verifyResetCode = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, type: "reset" }),
      });
      const data = await res.json();
      if (res.ok && data.success) return { success: true };
      return { success: false, error: data.message || "Mã xác thực không đúng" };
    } catch {
      return { success: false, error: "Không thể kết nối đến máy chủ" };
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) return { success: true };
      return { success: false, error: data.message || "Đổi mật khẩu thất bại" };
    } catch {
      return { success: false, error: "Không thể kết nối đến máy chủ" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile, sendResetCode, verifyResetCode, resetPassword, sendChangePasswordOTP, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    console.warn("useAuth called outside of AuthProvider");
    return {
      user: null,
      isLoading: true,
      login: async () => ({ success: false, error: "Auth not initialized" }),
      register: async () => ({ success: false, error: "Auth not initialized" }),
      logout: () => {},
      updateProfile: () => {},
      sendResetCode: async () => ({ success: false, error: "Auth not initialized" }),
      verifyResetCode: async () => ({ success: false, error: "Auth not initialized" }),
      resetPassword: async () => ({ success: false, error: "Auth not initialized" }),
      sendChangePasswordOTP: async () => ({ success: false, error: "Auth not initialized" }),
      changePassword: async () => ({ success: false, error: "Auth not initialized" }),
    };
  }
  return ctx;
}