import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Permission, PermissionResource } from "../data/permissions";
import { api } from "../../utils/api";
import { useAuth } from "./AuthContext";

interface PermissionsContextType {
  permissions: Permission[];
  isLoading: boolean;
  addPermission: (permission: Omit<Permission, "id" | "createdAt">) => Promise<{ success: boolean; error?: string }>;
  updatePermission: (id: string, updates: Partial<Permission>) => Promise<{ success: boolean; error?: string }>;
  deletePermission: (id: string) => Promise<{ success: boolean; error?: string }>;
  getPermissionById: (id: string) => Permission | undefined;
}

const PermissionsContext = createContext<PermissionsContextType | null>(null);

// Mapping resource_id (backend name) → PermissionResource (frontend type)
const RESOURCE_NAME_TO_TYPE: Record<string, PermissionResource> = {
  issues_vande: "issues_vande",
  activities_volunteer: "activities_volunteer",
  stats_overview: "stats_overview",
  issues_mgnt: "issues_mgnt",
  issues_process: "issues_process",
  users_mgnt: "users_mgnt",
  reports_stats: "reports_stats",
  activities_mgnt: "activities_mgnt",
  perms_mgnt: "perms_mgnt",
  roles_mgnt: "roles_mgnt",
};

// Map action names từ backend (create/read/update...) → frontend PermissionAction
const ACTION_NAME_MAP: Record<string, string> = {
  create: "create",
  read: "read",
  update: "update",
  delete: "delete",
  approve: "approve",
  export: "export",
  assign: "assign",
};

/**
 * Map một permission từ backend format sang frontend Permission format.
 * Backend trả về: { perm_id, resource_id, name, description, is_root, createdAt }
 * Frontend cần:  { id, resource, name, description, actions, isSystem, createdAt }
 *
 * Backend's resource_id ở list endpoint là resource "id" (ví dụ "res_issues")
 * hoặc resource "name" (ví dụ "issues") tùy endpoint.
 * Chúng ta map cả hai trường hợp.
 */
function mapBackendPermission(raw: any): Permission {
  // Resolve resource type
  let resourceType: PermissionResource = "system";
  const rid: string = raw.resource_id || "";

  // Thử match theo name trực tiếp
  if (RESOURCE_NAME_TO_TYPE[rid]) {
    resourceType = RESOURCE_NAME_TO_TYPE[rid];
  } else {
    // Thử match theo suffix (ví dụ "res_issues" → "issues")
    const parts = rid.split("_");
    const suffix = parts.slice(1).join("_");
    if (suffix && RESOURCE_NAME_TO_TYPE[suffix]) {
      resourceType = RESOURCE_NAME_TO_TYPE[suffix];
    }
  }

  // Map actions: backend có thể trả thêm actions trong 1 số endpoint detail
  const rawActions: string[] = Array.isArray(raw.actions) ? raw.actions : [];
  const mappedActions = rawActions
    .map((a: any) => {
      const name = typeof a === "string" ? a : a?.name || a?.action_id || "";
      return ACTION_NAME_MAP[name] || name;
    })
    .filter(Boolean) as Permission["actions"];

  return {
    id: raw.perm_id || raw._id || raw.id || "",
    name: raw.name || "",
    description: raw.description || "",
    resource: resourceType,
    actions: mappedActions,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at,
    createdBy: raw.createdBy,
    isSystem: raw.is_root ?? false,
  };
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logout } = useAuth();

  const fetchPermissions = useCallback(async () => {
    try {
      // Fetch tất cả permissions — limit=500 để lấy hết
      const res = await api.get("/auth/permissions?limit=500");

      if (res.status === 401) {
        logout();
        return;
      }

      console.log("[PermissionsContext] API response:", res);
      let rawList: any[] = [];

      if (res.success && Array.isArray(res.permissions) && res.permissions.length > 0) {
        rawList = res.permissions;
      } else if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        rawList = res.data;
      } else {
        console.warn("[PermissionsContext] No permissions in response:", {
          success: res.success,
          permissionsType: typeof res.permissions,
          permissionsLength: res.permissions?.length,
          keys: Object.keys(res),
        });
      }

      console.log("[PermissionsContext] rawList length:", rawList.length);
      setPermissions(rawList.map(mapBackendPermission));
    } catch (error) {
      console.error("[PermissionsContext] Failed to load permissions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const addPermission = async (
    permissionData: Omit<Permission, "id" | "createdAt">
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Tìm resource theo name để lấy resource_id
      const resourcesRes = await api.get("/auth/permissions/resources");
      let resourceId = permissionData.resource; // fallback về resource name

      if (resourcesRes.success && resourcesRes.resources) {
        const found = resourcesRes.resources.find(
          (r: any) => r.name === permissionData.resource || r.resource_id === permissionData.resource
        );
        if (found) resourceId = found.resource_id;
      }

      // Tìm action_ids tương ứng với resource + action names
      const actionsRes = await api.get(`/auth/permissions/action?resourceID=${resourceId}`);
      let actionIDs: string[] = [];

      if (actionsRes.success && actionsRes.actions) {
        actionIDs = actionsRes.actions
          .filter((a: any) => permissionData.actions.includes(a.name))
          .map((a: any) => a.action_id);
      }

      // Fallback: nếu không tìm được action_ids từ backend, gửi action names và để backend tự xử
      if (actionIDs.length === 0) {
        actionIDs = permissionData.actions as string[];
      }

      const payload = {
        name: permissionData.name,
        description: permissionData.description,
        resourceID: resourceId,
        actionIDs: actionIDs,
      };

      const res = await api.post("/auth/permissions", payload);
      if (res.success) {
        await fetchPermissions(); // reload
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
      const res = await api.post("/auth/permissions", payload);
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
