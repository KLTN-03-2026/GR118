import { PermissionsInfo } from "../../dtos/auth/permission";
import { RoleResponse } from "../../dtos/auth/role";
import { RoleRow } from "../../repos/aggregation/role";

export class RoleMapper {
    static toRolesInfo(role: any) {
        return {
            role_id: role.role_id,
            name: role.name,
            description: role.description,
            is_root: role.is_root,
            is_active: role.is_active,
            created_at: role.createdAt,
            updated_at: role.updatedAt
        }
    }

    static toRoleResponse(role: RoleRow[]): RoleResponse {
        if (role.length === 0) {
            throw new Error("Role not found");
        }

        const first = role[0];

        const description = first.description || "";

        const permissions: PermissionsInfo[] = role
            .filter(r => r.permission_id && r.permission_name)
            .map(r => ({
                perm_id: r.permission_id!,
                name: r.permission_name!,
                description: r.permission_description || "",
                is_root: null!,
                resource_id: null!,
            }));

        return {
            role_id: first.role_id,
            name: first.name,
            description: description,
            is_root: first.is_root,
            is_active: first.is_active,
            created_at: first.created_at,
            updated_at: first.updated_at,
            permissions: permissions
        };

    }
}