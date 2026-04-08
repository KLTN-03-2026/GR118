import roleSchema from "../../models/auth/roles";
import rolePermissionSchema from "../../models/auth/role_permissions";
import userRoleScheme from "../../models/auth/user_role";
import resourceSchema from "../../models/auth/resources";
import Action from "../../models/auth/actions";
import PermissionAction from "../../models/auth/permission_actions";
import RolePermission from "../../models/auth/role_permissions";
import Permissions from "../../models/auth/permissions";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { RoleRow } from "../aggregation/role";


export const getRoles = async (search: string) => {
    const query: any = {};

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const roles = await roleSchema.find(query).lean();

    const total = await roleSchema.countDocuments(query);

    const rootCount = await roleSchema.countDocuments({
        ...query,
        is_root: true
    });

    return {
        items: roles,
        total,
        rootCount
    };
};

export const getRoleById = async (roleId: string): Promise<RoleRow[] | null> => {
    const role = await roleSchema.findOne({
        role_id: roleId
    }).lean();

    if (!role) {
        return null;
    }

    const permissions = await rolePermissionSchema.find({
        role_id: roleId
    }).lean();

    const permIds = permissions.map(p => p.perm_id);

    const perms = await Permissions.find({
        perm_id: { $in: permIds }
    }).lean();

    const result: RoleRow[] = perms.map(p => ({
        role_id: role?.role_id || "",
        name: role?.name || "",
        description: role?.description || "",
        is_root: role?.is_root || false,
        is_active: role?.is_active || false,
        created_at: role?.createdAt,
        updated_at: role?.updatedAt,
        permission_id: p.perm_id || "",
        permission_name: p.name || "",
        permission_description: p.description || ""
    }));

    if (result.length === 0 && role) {
        return [{
            role_id: role.role_id,
            name: role.name,
            description: role.description || "",
            is_root: role.is_root,
            is_active: role.is_active,
            created_at: role.createdAt,
            updated_at: role.updatedAt,
            permission_id: null,
            permission_name: null,
            permission_description: null
        }];
    }

    return result;
};


export const upsertRole = async (data: any) => {
    if (data.role_id) {
        return await roleSchema.findOneAndUpdate(
            { role_id: data.role_id },
            data,
            {
                returnDocument: "after"
            }
        );
    }

    const existing = await roleSchema.findOne({ name: data.name });
    if (existing) {
        throw new Error("Role name already exists");
    }

    return await roleSchema.create({
        ...data,
        role_id: randomUUID()
    });
};

export const deleteRole = async (roleId: string) => {

    const result = await roleSchema.deleteOne({
        role_id: roleId
    });

    await rolePermissionSchema.deleteMany({
        role_id: roleId
    });

    return result.deletedCount > 0;
};

export const disableOrEnableRole = async (
    roleId: string,
    status: boolean
) => {

    return await roleSchema.updateOne(
        { role_id: roleId },
        {
            $set: { is_active: status },
            $currentDate: { updatedAt: true }
        }
    );

};

export const upsertPermissionsForRole = async (
    roleId: string,
    permIds: string[]
) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const current = await rolePermissionSchema.find({
            role_id: roleId
        }).session(session).lean();

        const currentPermIds = current.map(x => x.perm_id);

        const toAdd = permIds.filter(id => !currentPermIds.includes(id));
        const toRemove = currentPermIds.filter(id => !permIds.includes(id));

        const operations: any[] = [];

        if (toAdd.length > 0) {
            operations.push(
                ...toAdd.map(id => ({
                    insertOne: {
                        document: {
                            role_id: roleId,
                            perm_id: id
                        }
                    }
                }))
            );
        }
        if (toRemove.length > 0) {
            operations.push({
                deleteMany: {
                    filter: {
                        role_id: roleId,
                        perm_id: { $in: toRemove }
                    }
                }
            });
        }
        if (operations.length > 0) {
            await rolePermissionSchema.bulkWrite(operations, { session });
        }
        await session.commitTransaction();

        return { message: "Permissions updated successfully" };

    } catch (err) {

        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

export const checkPermission = async (
    roleIds: string[],
    resourceName: string,
    actionName: string
): Promise<boolean> => {
    const resource = await resourceSchema.findOne({ name: resourceName }).lean();
    if (!resource) return false;

    const action = await Action.findOne({
        resource_id: resource.resource_id,
        name: actionName
    }).lean();
    if (!action) return false;

    const permActions = await PermissionAction.find({
        action_id: action.action_id
    }).lean();

    if (!permActions.length) return false;

    const hasPermission = await RolePermission.exists({
        role_id: { $in: roleIds },
        perm_id: { $in: permActions.map(pa => pa.perm_id) }
    });

    return !!hasPermission;
};