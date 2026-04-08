import { PermissionsInfo } from "./permission";

export interface RoleResponse{
    role_id: string;
    name: string;
    description: string;
    is_root: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    permissions: PermissionsInfo[] | null;
}