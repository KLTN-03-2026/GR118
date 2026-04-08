export interface PermissionRow {
    perm_id: string;
    permission_name: string;
    resource_id: string;
    resource_name: string;
    is_root: boolean;
    description: string;
    created_at: Date;
    updated_at: Date;
    action_id?: string | null;
    action_name?: string | null;
}