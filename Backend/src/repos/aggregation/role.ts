export interface RoleRow {
    role_id: string;
    name: string;
    description: string;
    is_root: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    permission_id?: string | null;
    permission_name?: string | null;
    permission_description?: string | null;
}