import { ActionInfo, PermissionsInfo, ResourceInfo, PermissionResponse } from "../../dtos/auth/permission";
import { PermissionRow } from "../../repos/aggregation/permission";

export class PermissionMapper {
    static toPermissionsInfo(perms: any): PermissionsInfo {
        let description = perms.description;
        if (!description) {
            description = "";
        }
        const permId = perms.perm_id || (perms._id ? perms._id.toString() : "");
        
        // Ưu tiên dùng actions từ phép JOIN (actions_joined), nếu không có thì dùng actions thô từ document
        const actions = (perms.actions_joined && perms.actions_joined.length > 0)
            ? perms.actions_joined.map((a: any) => ({
                action_id: a.action_id,
                name: a.name
            }))
            : (Array.isArray(perms.actions) ? perms.actions.map((id: string) => ({
                action_id: id,
                name: id.split("_").pop() || id
            })) : []);

        return {
            perm_id: permId,
            resource_id: perms.resource_id,
            name: perms.name,
            description: description,
            is_root: perms.is_root,
            actions: actions
        }
    }

    static toPermissionInfo(perms: PermissionRow[]): PermissionResponse {

        if (!perms || perms.length === 0) {
            throw new Error("Permission not found");
        }

        const first = perms[0];
        const description = first.description || "";

        // Lấy danh sách từ JOIN
        let actions: ActionInfo[] = perms
            .filter(p => p.action_id && p.action_name)
            .map(p => ({
                action_id: p.action_id!,
                name: p.action_name!
            }));

        // Nếu JOIN không có kết quả, dùng raw_actions (dữ liệu trực tiếp từ bảng permissions)
        if (actions.length === 0 && first.raw_actions && first.raw_actions.length > 0) {
            actions = first.raw_actions.map(id => ({
                action_id: id,
                name: id.split("_").pop() || id
            }));
        }

        const resource: ResourceInfo = {
            resource_id: first.resource_id,
            name: first.resource_name
        };

        return {
            perm_id: first.perm_id,
            resource: resource,
            permission_name: first.permission_name,
            is_root: first.is_root,
            description: description,
            created_at: first.created_at,
            updated_at: first.updated_at,
            actions: actions
        };
    }

    static toActionsResponse(actions: any[]): ActionInfo[] {
        return actions.map(a => ({
            action_id: a.action_id,
            name: a.name
        }));
    }

    static toResourcesResponse(resources: any[]): ResourceInfo[] {
        return resources.map(r => ({
            resource_id: r.resource_id,
            name: r.name
        }));
    }
}

