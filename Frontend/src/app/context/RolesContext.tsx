import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Role } from "../data/roles";
import { api } from "../../utils/api";

interface RolesContextType {
  roles: Role[];
  isLoading: boolean;
  addRole: (role: Omit<Role, "id" | "createdAt">) => Promise<{ success: boolean; error?: string }>;
  updateRole: (id: string, updates: Partial<Role>) => Promise<{ success: boolean; error?: string }>;
  deleteRole: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleRoleStatus: (id: string) => Promise<{ success: boolean; error?: string }>;
  getRoleById: (id: string) => Role | undefined;
}

const RolesContext = createContext<RolesContextType | null>(null);

export function RolesProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = async () => {
    try {
      const res = await api.get("/auth/role");
      if (res.success && res.data) {
        setRoles(res.data);
      } else if (res.roles) {
        setRoles(res.roles);
      }
    } catch (error) {
      console.error("Failed to load roles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const addRole = async (
    roleData: Omit<Role, "id" | "createdAt">
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.post("/auth/role", roleData);
      if (res.success) {
        await fetchRoles();
        return { success: true };
      }
      return { success: false, error: res.message || "Thêm vai trò thất bại" };
    } catch (error) {
      return { success: false, error: "Không thể kết nối đến máy chủ" };
    }
  };

  const updateRole = async (
    id: string,
    updates: Partial<Role>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.patch(`/auth/role`, { id, ...updates });
      if (res.success) {
        setRoles((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
          )
        );
        return { success: true };
      }
      return { success: false, error: res.message || "Cập nhật vai trò thất bại" };
    } catch (error) {
      return { success: false, error: "Không thể kết nối đến máy chủ" };
    }
  };

  const deleteRole = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.delete(`/auth/role?id=${id}`);
      if (res.success) {
        setRoles((prev) => prev.filter((r) => r.id !== id));
        return { success: true };
      }
      return { success: false, error: res.message || "Xóa vai trò thất bại" };
    } catch (error) {
      return { success: false, error: "Không thể kết nối đến máy chủ" };
    }
  };

  const toggleRoleStatus = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.patch("/auth/role", { id, toggleStatus: true });
      if (res.success) {
        setRoles((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, isActive: !r.isActive, updatedAt: new Date().toISOString() } : r
          )
        );
        return { success: true };
      }
      return { success: false, error: res.message || "Thay đổi trạng thái thất bại" };
    } catch (error) {
      return { success: false, error: "Không thể kết nối đến máy chủ" };
    }
  };

  const getRoleById = (id: string): Role | undefined => {
    return roles.find((r) => r.id === id);
  };

  return (
    <RolesContext.Provider
      value={{
        roles,
        isLoading,
        addRole,
        updateRole,
        deleteRole,
        toggleRoleStatus,
        getRoleById,
      }}
    >
      {children}
    </RolesContext.Provider>
  );
}

export function useRoles() {
  const context = useContext(RolesContext);
  if (!context) {
    console.warn("useRoles called outside of RolesProvider");
    return {
      roles: [],
      isLoading: true,
      addRole: async () => ({ success: false, error: "Context not initialized" }),
      updateRole: async () => ({ success: false, error: "Context not initialized" }),
      deleteRole: async () => ({ success: false, error: "Context not initialized" }),
      toggleRoleStatus: async () => ({ success: false, error: "Context not initialized" }),
      getRoleById: () => undefined,
    };
  }
  return context;
}
