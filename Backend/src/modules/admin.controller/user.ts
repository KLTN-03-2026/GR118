import { Request, Response, NextFunction } from "express";
import { PageArray } from "../../helper/pageAray";
import { UserMapper } from "../../mapper/auth/user.mapper";
import { ERROR_CODES } from "../../constant/error";
import { AppError } from "../../utils/app-error";
import { userRepo } from "../../repos/index";

// assignRoleToUser
export const AssignRoleToUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, roleIds } = req.body;
        await userRepo.assignRoleToUser(userId, roleIds);

        return res.status(200).json({
            success: true,
            message: "Roles assigned to user successfully"
        });
    } catch (error) {
        console.error("AssignRoleToUser error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

export const GetUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, search } = req.query;
        const result = await userRepo.getUsers(search as string);
        if (!result) {
            const err = ERROR_CODES.SERVER_ERROR;
            return next(new AppError(err.statusCode, err.code, "Failed to get users"));
        }

        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 10));
        const usersInfo = PageArray.toArrayPage(result.users, pageNum, limitNum);

        const responseData = usersInfo.items.map((user) => {
            return UserMapper.toUsersResponse(user);
        });

        return res.status(200).json({
            success: true,
            users: responseData,
            total: result.total,
            page: usersInfo.page,
            totalPages: usersInfo.totalPages,
        });
    } catch (error) {
        console.error("GetUsers error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
}

export const GetUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id) {
            const err = ERROR_CODES.NOT_FOUND;
            return next(new AppError(err.statusCode, err.code, "User not found"));
        }

        console.log("GetUserById userID:", id);


        const result = await userRepo.getUser(id);
        if (!result) {
            const err = ERROR_CODES.NOT_FOUND;
            return next(new AppError(err.statusCode, err.code, "User not found"));
        }

        const responseData = UserMapper.toUserResponse(result.user, result.roles);

        return res.status(200).json({
            success: true,
            user: responseData,
        });
    } catch (error) {
        console.error("GetUserById error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
}
export const LockOrUnlockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { lockReason } = req.body || {};

        if (!id) {
            const err = ERROR_CODES.NOT_FOUND;
            return next(new AppError(err.statusCode, err.code, "User not found"));
        }

        const result = await userRepo.lockOrUnlockUser(id, lockReason);

        return res.status(200).json({
            success: true,
            message: result.action === "locked"
                ? "User locked successfully"
                : "User unlocked successfully",
            data: result
        });

    } catch (error) {
        console.error("LockOrUnlockUser error:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error"
        });
    }
};

export const CreateNewUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userName, email, password, roleIds } = req.body;

        const result = await userRepo.createNewUserByAdmin(userName, email, password, roleIds);
        if (!result.success || !result.data) {
            const err = ERROR_CODES.INVALID_INPUT;
            return next(new AppError(err.statusCode, err.code, result.message || "Failed to create user"));
        }

        const responseData = UserMapper.toUserResponse(result.data.user, result.data.roles);

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: responseData
        });
    } catch (error) {
        console.error("CreateNewUser error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
};

export const UpdateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id) {
            const err = ERROR_CODES.NOT_FOUND;
            return next(new AppError(err.statusCode, err.code, "User not found"));
        }

        const { userName, email, password, roleIds } = req.body;

        const result = await userRepo.updateUserByAdmin(id, {
            userName,
            email,
            password,
            roleIds
        });

        if (!result.success || !result.data) {
            const isNotFound = result.message === "User not found";
            const err = isNotFound ? ERROR_CODES.NOT_FOUND : ERROR_CODES.INVALID_INPUT;
            return next(new AppError(err.statusCode, err.code, result.message || "Failed to update user"));
        }

        const responseData = UserMapper.toUserResponse(result.data.user, result.data.roles);

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: responseData
        });
    } catch (error) {
        console.error("UpdateUser error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
};

export const DeleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id) {
            const err = ERROR_CODES.NOT_FOUND;
            return next(new AppError(err.statusCode, err.code, "User not found"));
        }

        const result = await userRepo.deleteUser(id);
        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: "Xóa người dùng thành công"
        });
    } catch (error) {
        console.error("DeleteUser error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};