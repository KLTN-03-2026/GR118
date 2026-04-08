export interface ActionInfo{
    action_id: string;
    name: string;
}

export interface ResourceInfo {
    resource_id: string;
    name: string;
}

export interface PermissionsInfo {
    perm_id: string;
    resource_id: string;
    name: string;
    description?: string;
    is_root: boolean;
}

export interface PermissionResponse {
    perm_id: string;
    permission_name: string;
    resource: ResourceInfo | null;
    is_root: boolean;
    description?: string;
    created_at: Date;
    updated_at: Date;
    actions: ActionInfo[] | null;
}