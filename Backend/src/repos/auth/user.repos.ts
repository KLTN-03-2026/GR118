import { GetMeInterface } from "../aggregation/user";
import authSchema from "../../models/auth.model";
import userRoleSchema from "../../models/auth/user_role";
import roleSchema from "../../models/auth/roles";
import { ROLES } from "../../constant/role";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

export const GetRoleIDsByUserID = async (userId: string) => {
    const roles = await userRoleSchema
        .find({ user_id: userId })
        .select("role_id -_id");

    return roles.map(r => r.role_id);
}

export const syncUserPrimaryRole = async (userId: string, session?: mongoose.ClientSession) => {
    // Tìm các role của user
    const userRoles = await userRoleSchema.find({ user_id: userId }).session(session || null).lean();
    if (userRoles.length === 0) {
        await authSchema.findByIdAndUpdate(userId, { role: null }, { session: session || null });
        return;
    }

    // Lấy tên của role đầu tiên (ưu tiên)
    const roleId = userRoles[0].role_id;
    
    // Tìm kiếm thông minh: hỗ trợ cả _id và role_id
    console.log(`[SyncRole] Found ${userRoles.length} roles for user ${userId}. Primary role ID: ${roleId}`);

    const query: any = { $or: [{ role_id: roleId }] };
    if (mongoose.Types.ObjectId.isValid(roleId)) {
        query.$or.push({ _id: new mongoose.Types.ObjectId(roleId) });
    }
    
    const roleDoc = await roleSchema.findOne(query).session(session || null).lean();
    
    if (roleDoc) {
        console.log(`[SyncRole] Updating user ${userId} primary role field in Auth to: "${roleDoc.name}"`);
        await authSchema.findByIdAndUpdate(userId, { role: roleDoc.name }, { session: session || null });
    } else {
        console.warn(`[SyncRole] WARNING: Role document not found for ID ${roleId}`);
    }
}

export const AddNewRolesToNewUser = async (
    userId: string,
    roleId: string,
    session?: mongoose.ClientSession
) => {
    const result = await userRoleSchema.create([{
        user_id: userId,
        role_id: roleId
    }], { session: session || null });

    await syncUserPrimaryRole(userId, session);
    return result;
};

export const assignRoleToUser = async (
    userId: string,
    roleIds: string[],
    session?: mongoose.ClientSession
) => {

    if (!Array.isArray(roleIds)) {
        throw new Error("roleIds must be an array");
    }

    console.log(`[Role] Assigning roles [${roleIds.join(', ')}] to user ${userId}`);
    await userRoleSchema.deleteMany({ user_id: userId }).session(session || null);
    
    if (roleIds.length > 0) {
        await userRoleSchema.insertMany(
            roleIds.map(roleId => ({
                user_id: userId,
                role_id: roleId
            }))
        );
    }

    await syncUserPrimaryRole(userId, session);

    return await userRoleSchema.find({
        user_id: userId
    }).session(session || null).lean();
};

export const CountUsersByRoles = async (roleIds: string[]) => {

    return await userRoleSchema.aggregate([
        {
            $match: {
                role_id: { $in: roleIds }
            }
        },
        {
            $group: {
                _id: "$role_id",
                count: { $sum: 1 }
            }
        }
    ]);

};

export const GetMe = async (userId: string): Promise<GetMeInterface | null> => {
    if (!userId) {
        throw new Error("Missing required fields");
    }

    const user = await authSchema.findOne({
        _id: userId
    }).lean();

    const aggregate = await userRoleSchema.aggregate([
        {
            $match: { user_id: userId }
        },
        {
            $lookup: {
                from: "rolepermissions",
                localField: "role_id",
                foreignField: "role_id",
                as: "role_perms"
            }
        },
        { $unwind: "$role_perms" },
        {
            $lookup: {
                from: "permissions",
                localField: "role_perms.perm_id",
                foreignField: "perm_id",
                as: "permission"
            }
        },
        { $unwind: "$permission" },
        {
            $group: {
                _id: "$permission.perm_id",
                permission: { $first: "$permission" }
            }
        },
        {
            $lookup: {
                from: "resources",
                localField: "permission.resource_id",
                foreignField: "resource_id",
                as: "resource"
            }
        },
        { $unwind: "$resource" },
        {
            $lookup: {
                from: "permissionactions",
                localField: "_id",
                foreignField: "perm_id",
                as: "perm_actions"
            }
        },
        {
            $lookup: {
                from: "actions",
                localField: "perm_actions.action_id",
                foreignField: "action_id",
                as: "actions"
            }
        },
        {
            $project: {
                _id: 0,
                permission: "$permission.name",
                resource: "$resource.name",
                actions: "$actions.name"
            }
        }
    ]);

    const result: GetMeInterface = {
        user_id: user?._id.toString() || "",
        username: user?.userName || "",
        email: user?.email || "",
        avatar: user?.avatar || null,
        phone: user?.phone || null,
        city: user?.city || null,
        lockEnd: user?.lockEnd || null,
        lockReason: user?.lockReason || null,
        permissions: aggregate.map(a => ({
            permission: a.permission,
            resource: a.resource,
            actions: a.actions.map((action: any) => ({
                name: action
            }))
        }))
    }

    return result;
}

export const getUsers = async (search: string) => {
    const query: any = {};

    if (search) {
        query.$or = [
            { userName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ];
    }

    const users = await authSchema.find(query).lean();

    const total = await authSchema.countDocuments(query);

    return {
        users,
        total
    }
}

export const getUser = async (userId: string) => {
    const user = await authSchema.findOne({ _id: userId }).lean();
    if (!user) {
        return null;
    }

    const existingRoles = await userRoleSchema.find({ user_id: userId }).lean();
    const roleIds = existingRoles.map((r: any) => r.role_id);
    const validRoleObjectIds = roleIds.filter((id: any) => id && mongoose.Types.ObjectId.isValid(id));

    const roleRes = await roleSchema.find({ 
        $or: [
            { role_id: { $in: roleIds } },
            { _id: { $in: validRoleObjectIds } }
        ]
    }).lean();

    const roleName = roleRes.map(r => r.name);

    return {
        user,
        roles: roleName
    }
}
export const checkLockAccount = async (userId: string) => {
    const user = await authSchema.findOne({ _id: userId }).lean();
    if (!user) {
        throw new Error("User not found");
    }
    if (user.lockEnd && user.lockEnd > new Date()) {
        return {
            locked: true,
            lockEnd: user.lockEnd,
            lockReason: user.lockReason
        }
    }
    return {
        locked: false
    }
}

export const lockOrUnlockUser = async (userId: string, lockReason?: string) => {
    const user = await authSchema.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    const now = new Date();
    const isLocked = user.lockEnd && user.lockEnd > now;

    let action: "locked" | "unlocked";

    if (isLocked) {
        user.lockEnd = null;
        user.lockReason = null;
        action = "unlocked";
    } else {
        const lockTime = new Date();
        lockTime.setFullYear(lockTime.getFullYear() + 10);

        user.lockEnd = lockTime;
        user.lockReason = lockReason || "No reason provided";
        action = "locked";
    }

    await user.save();

    return {
        userId,
        lockEnd: user.lockEnd,
        lockReason: user.lockReason,
        action
    };
};

export const createNewUserByAdmin = async (
    userName: string,
    name: string,
    email: string,
    password: string,
    roleIds?: string[]
) => {
    userName = userName?.trim().toLowerCase();
    name = name?.trim();
    email = email?.trim().toLowerCase();
    password = password?.trim();

    if (!userName || !name || !email || !password) {
        return {
            success: false,
            message: "All fields are required"
        };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            success: false,
            message: "Invalid email format"
        };
    }

    if (password.length < 6) {
        return {
            success: false,
            message: "Password must be at least 6 characters"
        };
    }

    if (roleIds && !Array.isArray(roleIds)) {
        return {
            success: false,
            message: "roleIds must be an array"
        };
    }

    const exists = await authSchema.findOne({
        $or: [{ userName }, { email }]
    });

    if (exists) {
        return {
            success: false,
            message: "This email or username is already registered"
        };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await authSchema.create({
        userName,
        name,
        email,
        password: hashedPassword,
        types: "login"
    });

    // Nếu Admin không chọn role, mặc định gán role "công dân"
    let finalRoleIds = roleIds;
    if (!finalRoleIds || finalRoleIds.length === 0) {
        const defaultRole = await roleSchema.findOne({ name: ROLES.USERROLE });
        if (defaultRole) {
            finalRoleIds = [defaultRole.role_id];
        }
    }

    if (finalRoleIds && finalRoleIds.length > 0) {
        await assignRoleToUser(newUser._id.toString(), finalRoleIds);
    }

    const user = await getUser(newUser._id.toString());

    return {
        success: true,
        data: user
    };
};

export const updateUserByAdmin = async (
    userId: string,
    payload: {
        userName?: string;
        name?: string;
        email?: string;
        password?: string;
        roleIds?: string[];
    }
) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return {
            success: false,
            message: "User not found"
        };
    }

    const user = await authSchema.findById(userId);
    if (!user) {
        return {
            success: false,
            message: "User not found"
        };
    }

    const userName = payload.userName?.trim().toLowerCase();
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password?.trim();
    const roleIds = payload.roleIds;

    if (roleIds !== undefined && !Array.isArray(roleIds)) {
        return {
            success: false,
            message: "roleIds must be an array"
        };
    }

    if (
        userName === undefined &&
        email === undefined &&
        password === undefined &&
        roleIds === undefined
    ) {
        return {
            success: false,
            message: "No data to update"
        };
    }

    if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                success: false,
                message: "Invalid email format"
            };
        }

        const duplicateEmail = await authSchema.findOne({
            email,
            _id: { $ne: userId }
        });

        if (duplicateEmail) {
            return {
                success: false,
                message: "Email is already in use"
            };
        }

        user.email = email;
    }

    if (userName !== undefined) {
        if (!userName) {
            return {
                success: false,
                message: "Username cannot be empty"
            };
        }

        const duplicateUserName = await authSchema.findOne({
            userName,
            _id: { $ne: userId }
        });

        if (duplicateUserName) {
            return {
                success: false,
                message: "Username is already in use"
            };
        }

        user.userName = userName;
    }

    if (payload.name !== undefined) {
        if (!payload.name.trim()) {
            return {
                success: false,
                message: "Name cannot be empty"
            };
        }
        user.name = payload.name.trim();
    }

    if (password !== undefined) {
        if (password.length < 6) {
            return {
                success: false,
                message: "Password must be at least 6 characters"
            };
        }

        user.password = await bcrypt.hash(password, 12);
    }

    await user.save();

    if (roleIds !== undefined) {
        await assignRoleToUser(userId, roleIds);
    }

    const userUpdated = await getUser(userId);

    return {
        success: true,
        data: userUpdated
    };
};

export const deleteUser = async (userId: string) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return {
            success: false,
            message: "User ID không hợp lệ"
        };
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await authSchema.findByIdAndDelete(userId).session(session);
        await userRoleSchema.deleteMany({ user_id: userId }).session(session);
        
        await session.commitTransaction();
        session.endSession();

        return {
            success: true,
            message: "Xóa người dùng thành công"
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

