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
    const query: any = {};

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }
    const perm = await permissionSchema.find(query).lean();
  
    const total = await permissionSchema.countDocuments(query);
 
    const rootCount = await permissionSchema.countDocuments({
        ...query,
        is_root: true
    });

    return {
        permissions: perm,
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
    await permissionSchema.deleteOne({ perm_id: permID });

    const permResult = await permissionActionSchema.deleteMany({
        perm_id: permID
    });

    return permResult.deletedCount > 0
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


export const getPermIDsByRoleID = async (roleId: string[]) => {
    const links = await rolePermissionSchema.find({
        role_id: { $in: roleId }
    }).lean();

    const permIds = links.map(a => a.perm_id);

    return await permissionSchema.find({
        perm_id: { $in: permIds }
    }).lean();
}