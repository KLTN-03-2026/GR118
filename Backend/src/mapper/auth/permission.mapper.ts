import { ActionInfo, PermissionsInfo, ResourceInfo, PermissionResponse } from "../../dtos/auth/permission";
import { PermissionRow } from "../../repos/aggregation/permission";

export class PermissionMapper {
    static toPermissionsInfo(perms: any): PermissionsInfo {
        let description = perms.description;
        if (!description) {
            description = "";
        }
        return {
            perm_id: perms.perm_id,
            resource_id: perms.resource_id,
            name: perms.name,
            description: description,
            is_root: perms.is_root
        }
    }

    static toPermissionInfo(perms: PermissionRow[]): PermissionResponse {

        if (!perms || perms.length === 0) {
            throw new Error("Permission not found");
        }

        const first = perms[0];

        const description = first.description || "";

        const actions: ActionInfo[] = perms
            .filter(p => p.action_id && p.action_name)
            .map(p => ({
                action_id: p.action_id!,
                name: p.action_name!
            }));

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

