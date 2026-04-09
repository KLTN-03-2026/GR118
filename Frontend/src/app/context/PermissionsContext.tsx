import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Permission } from "../data/permissions";
import { api } from "../../utils/api";

interface PermissionsContextType {
  permissions: Permission[];
  isLoading: boolean;
  addPermission: (permission: Omit<Permission, "id" | "createdAt">) => Promise<{ success: boolean; error?: string }>;
  updatePermission: (id: string, updates: Partial<Permission>) => Promise<{ success: boolean; error?: string }>;
  deletePermission: (id: string) => Promise<{ success: boolean; error?: string }>;
  getPermissionById: (id: string) => Permission | undefined;
}

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await api.get("/auth/permissions");
        if (res.success && res.data) {
          setPermissions(res.data);
        } else if (res.permissions) {
          setPermissions(res.permissions);
        }
      } catch (error) {
        console.error("Failed to load permissions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  const addPermission = async (
    permissionData: Omit<Permission, "id" | "createdAt">
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = {
        name: permissionData.name,
        description: permissionData.description,
        resourceID: permissionData.resource,
        actionIDs: permissionData.actions,
      };
      const res = await api.post("/auth/permissions", payload);
      if (res.success) {
        // Reload permissions from server
        const updated = await api.get("/auth/permissions");
        if (updated.success && updated.data) setPermissions(updated.data);
        else if (updated.permissions) setPermissions(updated.permissions);
        return { success: true };
      }
      return { success: false, error: res.message || "Thêm quyền thất bại" };
    } catch (error) {
      return { success: false, error: "Không thể kết nối đến máy chủ" };
    }
  };

  const updatePermission = async (
    id: string,
    updates: Partial<Permission>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = {
        permID: id,
        name: updates.name,
        description: updates.description,
        resourceID: updates.resource,
        actionIDs: updates.actions,
      };
      const res = await api.post(`/auth/permissions`, payload);
      if (res.success) {
        setPermissions((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          )
        );
        return { success: true };
      }
      return { success: false, error: res.message || "Cập nhật quyền thất bại" };
    } catch (error) {
      return { success: false, error: "Không thể kết nối đến máy chủ" };
    }
  };

  const deletePermission = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.delete(`/auth/permissions/${id}`);
      if (res.success) {
        setPermissions((prev) => prev.filter((p) => p.id !== id));
        return { success: true };
      }
      return { success: false, error: res.message || "Xóa quyền thất bại" };
    } catch (error) {
      return { success: false, error: "Không thể kết nối đến máy chủ" };
    }
  };

  const getPermissionById = (id: string): Permission | undefined => {
    return permissions.find((p) => p.id === id);
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        isLoading,
        addPermission,
        updatePermission,
        deletePermission,
        getPermissionById,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    console.warn("usePermissions called outside of PermissionsProvider");
    return {
      permissions: [],
      isLoading: true,
      addPermission: async () => ({ success: false, error: "Context not initialized" }),
      updatePermission: async () => ({ success: false, error: "Context not initialized" }),
      deletePermission: async () => ({ success: false, error: "Context not initialized" }),
      getPermissionById: () => undefined,
    };
  }
  return context;
}
