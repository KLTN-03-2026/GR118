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

    // Fetch user count for each role
    const rolesWithUserCount = await Promise.all(
        roles.map(async (role) => {
            const userCount = await userRoleScheme.countDocuments({
                role_id: role.role_id
            });
            return {
                ...role,
                userCount
            };
        })
    );

    const total = await roleSchema.countDocuments(query);

    const rootCount = await roleSchema.countDocuments({
        ...query,
        is_root: true
    });

    return {
        items: rolesWithUserCount,
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

    const userCount = await userRoleScheme.countDocuments({
        role_id: roleId
    });

    const permissions = await rolePermissionSchema.find({
        role_id: roleId
    }).lean();

    // Lấy ID từ cả bảng liên kết và mảng phi chuẩn hóa trong bản ghi Role
    const relationalIds = permissions.map(p => p.perm_id);
    const denormalizedIds = role.permissions || [];
    const permIds = [...new Set([...relationalIds, ...denormalizedIds])];

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
        permission_description: p.description || "",
        userCount: userCount
    } as any));

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
            permission_description: null,
            userCount: userCount
        } as any];
    }

    return result;
};


export const upsertRole = async (data: any) => {
    if (data.role_id) {
        const filter: any = {
            $or: [{ role_id: data.role_id }]
        };
        if (mongoose.Types.ObjectId.isValid(data.role_id)) {
            filter.$or.push({ _id: data.role_id });
        }

        return await roleSchema.findOneAndUpdate(
            filter,
            data,
            {
                returnDocument: "after"
            }
        );
    }

    const existing = await roleSchema.findOne({ name: data.name });
    if (existing) {
        // Ném lỗi rõ ràng để controller bắt được
        const error: any = new Error("Tên vai trò này đã tồn tại");
        error.statusCode = 400;
        throw error;
    }

    return await roleSchema.create({
        ...data,
        role_id: new mongoose.Types.ObjectId().toString()
    });
};

export const deleteRole = async (roleId: string) => {
    const filter: any = {
        $or: [{ role_id: roleId }]
    };
    if (mongoose.Types.ObjectId.isValid(roleId)) {
        filter.$or.push({ _id: roleId });
    }

    const result = await roleSchema.deleteOne(filter);

    await rolePermissionSchema.deleteMany({
        role_id: roleId
    });

    return result.deletedCount > 0;
};

// Quick lookup by role_id — used for is_root checks before deletion
export const findRoleById = async (roleId: string) => {
    const filter: any = {
        $or: [{ role_id: roleId }]
    };
    if (mongoose.Types.ObjectId.isValid(roleId)) {
        filter.$or.push({ _id: roleId });
    }
    return await roleSchema.findOne(filter).lean();
};

export const disableOrEnableRole = async (
    roleId: string,
    status: boolean
) => {

    const filter: any = {
        $or: [{ role_id: roleId }]
    };
    if (mongoose.Types.ObjectId.isValid(roleId)) {
        filter.$or.push({ _id: roleId });
    }

    return await roleSchema.updateOne(
        filter,
        {
            $set: { is_active: status },
            $currentDate: { updatedAt: true }
        }
    );

};

export const upsertPermissionsForRole = async (
    roleId: string,
    permIds: string[] = [] // Default to empty array
) => {
    try {
        const current = await rolePermissionSchema.find({
            role_id: roleId
        }).lean();

        const currentPermIds = current.map(x => x.perm_id);

        const toAdd = (permIds || []).filter(id => !currentPermIds.includes(id));
        const toRemove = currentPermIds.filter(id => !(permIds || []).includes(id));

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
            await rolePermissionSchema.bulkWrite(operations);
        }

        // Đồng bộ trường permissions vào thẳng bảng roles
        await roleSchema.updateOne(
            { role_id: roleId },
            { $set: { permissions: permIds || [] } }
        );

        return { message: "Permissions updated successfully" };

    } catch (err) {
        throw err;
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