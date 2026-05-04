import resourceSchema from "../../models/auth/resources";
import actionSchema from "../../models/auth/actions";
import permissionSchema from "../../models/auth/permissions";
import permissionActionSchema from "../../models/auth/permission_actions";
import rolePermissionSchema from "../../models/auth/role_permissions";
import mongoose from "mongoose";
import { PermissionRow } from "../aggregation/permission";

export const getResources = async () => {
    return await resourceSchema.find();
};

export const getActions = async (resource_id: string) => {
    return await actionSchema.find({
        resource_id: resource_id
    });
};

export const getPermissions = async (search: string) => {
    const pipe: any[] = [];

    if (search) {
        pipe.push({
            $match: {
                name: { $regex: search, $options: 'i' }
            }
        });
    }

    // Lookup permission_actions
    pipe.push({
        $lookup: {
            from: "permission_actions",
            localField: "perm_id",
            foreignField: "perm_id",
            as: "pa"
        }
    });

    // Lookup action details
    pipe.push({
        $lookup: {
            from: "actions",
            localField: "pa.action_id",
            foreignField: "action_id",
            as: "actions_joined"
        }
    });

    const permissions = await permissionSchema.aggregate(pipe);
  
    const queryCount: any = {};
    if (search) {
        queryCount.name = { $regex: search, $options: 'i' };
    }
    const total = await permissionSchema.countDocuments(queryCount);
    const rootCount = await permissionSchema.countDocuments({
        ...queryCount,
        is_root: true
    });

    return {
        permissions: permissions,
        total,
        rootCount
    };
};
export const getPermission = async (permId: string): Promise<PermissionRow[] | null> => {

    const permission = await permissionSchema.findOne({ perm_id: permId }).lean();
    if (!permission) {
        return null;
    }

    const resource = await resourceSchema.findOne({
        resource_id: permission.resource_id
    }).lean();

    const permissionActions = await permissionActionSchema.find({
        perm_id: permId
    }).lean();

    const actionIds = permissionActions.map(pa => pa.action_id);

    const actions = await actionSchema.find({
        action_id: { $in: actionIds }
    }).lean();

    const result: PermissionRow[] = actions.map(action => ({
        perm_id: permission.perm_id,
        permission_name: permission.name,
        resource_id: permission.resource_id,
        resource_name: resource?.name || "",
        is_root: permission.is_root,
        description: permission.description || "",
        created_at: permission.createdAt,
        updated_at: permission.updatedAt,
        action_id: action.action_id,
        action_name: action.name,
        raw_actions: permission.actions // Thêm trường này để mapper fallback
    }));

    if (result.length === 0 && permission) {
        return [{
            perm_id: permission.perm_id,
            permission_name: permission.name,
            resource_id: permission.resource_id,
            resource_name: resource?.name || "",
            is_root: permission.is_root,
            description: permission.description || "",
            created_at: permission.createdAt,
            updated_at: permission.updatedAt,
            action_id: null,
            action_name: null,
            raw_actions: permission.actions
        }];
    }

    return result;
};



export const upsertPermission = async (data: any) => {
    if (!data.perm_id) {
        const newPerm = {
            ...data,
            perm_id: new mongoose.Types.ObjectId().toString()
        };

        return await permissionSchema.create(newPerm);
    }

    return await permissionSchema.findOneAndUpdate(
        { perm_id: data.perm_id },
        data,
        {
            upsert: false,
            returnDocument: 'after'
        }
    );
};

export const deletePermission = async (permID: string) => {
    // Support both custom perm_id and MongoDB _id
    const filter: any = { perm_id: permID };
    let perm = await permissionSchema.findOne(filter);
    if (!perm) {
        // Fallback: try by MongoDB _id
        perm = await permissionSchema.findById(permID).catch(() => null);
        if (perm) {
            // Use the actual perm_id for cascading deletes
            await permissionSchema.deleteOne({ _id: permID });
            await permissionActionSchema.deleteMany({ perm_id: perm.perm_id });
            return true;
        }
        return false;
    }

    await permissionSchema.deleteOne({ perm_id: permID });

    const permResult = await permissionActionSchema.deleteMany({
        perm_id: permID
    });

    return true;
};


export const GetActionsByPermissionId = async (permId: string) => {
    const links = await permissionActionSchema.find({
        perm_id: permId
    });

    const actionIds = links.map(a => a.action_id);

    return await actionSchema.find({
        action_id: { $in: actionIds }
    }).lean();
}

export const updateActionsToPermission = async (
    permId: string,
    actionIds: string[]
) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const current = await permissionActionSchema.find({
            perm_id: permId
        }).session(session).lean();

        const currentActionIds = current.map(x => x.action_id);
        

        const toAdd = actionIds.filter(id => !currentActionIds.includes(id));
        const toRemove = currentActionIds.filter(id => !actionIds.includes(id));

        const operations: any[] = [];

        if (toAdd.length > 0) {
            operations.push(
                ...toAdd.map(id => ({
                    insertOne: {
                        document: {
                            perm_id: permId,
                            action_id: id
                        }
                    }
                }))
            );
        }

        if (toRemove.length > 0) {
            operations.push({
                deleteMany: {
                    filter: {
                        perm_id: permId,
                        action_id: { $in: toRemove }
                    }
                }
            });
        }

        if (operations.length > 0) {
            await permissionActionSchema.bulkWrite(operations, { session });
        }

        // Đồng bộ trường 'actions' vào bảng 'permissions' để dễ dàng xem trong DB
        await permissionSchema.updateOne(
            { perm_id: permId },
            { $set: { actions: actionIds } },
            { session }
        );

        await session.commitTransaction();
        return { message: "Updated successfully" };

    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};


export const FindOrCreateAction = async (resourceID: string, name: string) => {
    let action = await actionSchema.findOne({ name: name, resource_id: resourceID });
    if (!action) {
        action = await actionSchema.create({
            action_id: new mongoose.Types.ObjectId().toString(),
            resource_id: resourceID,
            name
        });
    }

    return action;
}

export const FindOrCreateResource = async (name: string) => {
    let resource = await resourceSchema.findOne({ name: name });
    if (!resource) {
        resource = await resourceSchema.create({
            resource_id: new mongoose.Types.ObjectId().toString(),
            name
        });
    } else {
        resource.name = name;
        await resource.save();
    }

    return resource;
}


export const getPermIDsByRoleID = async (roleIds: string[]) => {
    if (!roleIds || roleIds.length === 0) return [];

    // 1. Tìm tất cả các document role tương ứng để lấy ra danh sách role_id chuẩn (string)
    const validObjectIds = roleIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const roles = await mongoose.model("roles").find({
        $or: [
            { role_id: { $in: roleIds } },
            { _id: { $in: validObjectIds } }
        ]
    }).lean();

    const normalizedRoleIds = [...new Set(roles.map(r => r.role_id))];

    if (normalizedRoleIds.length === 0) return [];

    // 2. Tìm các liên kết quyền dựa trên danh sách role_id đã chuẩn hóa
    const links = await rolePermissionSchema.find({
        role_id: { $in: normalizedRoleIds }
    }).lean();

    const permIds = links.map(a => a.perm_id);

    return await permissionSchema.find({
        perm_id: { $in: permIds }
    }).lean();
}

/**
 * Resolves all permissions for a list of roles into a structured object for the UI.
 * Returns: { [resource_name]: action_names[] }
 */
export const getUserPermissions = async (roleIds: string[]) => {
    // 1. Get all permission documents for these roles
    const perms = await getPermIDsByRoleID(roleIds);
    const result: Record<string, string[]> = {};

    // 2. Map of resource_id -> resource_name
    const resourceIds = [...new Set(perms.map(p => p.resource_id))];
    const resources = await resourceSchema.find({ resource_id: { $in: resourceIds } }).lean();
    const resourceMap: Record<string, string> = {};
    resources.forEach(r => {
        resourceMap[r.resource_id] = r.name;
    });

    // 3. For each permission, get action names
    for (const p of perms) {
        const resourceName = resourceMap[p.resource_id] || p.resource_id;
        if (!result[resourceName]) result[resourceName] = [];

        // Check if actions are already denormalized in the permission document
        if (p.actions && Array.isArray(p.actions) && p.actions.length > 0) {
            // These might be action_ids or action_names depending on seed/sync state
            // Let's resolve them to names for the UI
            const actions = await actionSchema.find({ 
                $or: [
                    { action_id: { $in: p.actions } },
                    { name: { $in: p.actions } }
                ] 
            }).lean();
            
            const names = actions.map(a => a.name);
            result[resourceName] = [...new Set([...result[resourceName], ...names])];
        } else {
            // Fallback to permission_actions link table
            const pActions = await GetActionsByPermissionId(p.perm_id);
            const names = pActions.map(a => a.name);
            result[resourceName] = [...new Set([...result[resourceName], ...names])];
        }
    }

    return result;
};