import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/app-error";
import { ERROR_CODES } from "../../constant/error";
import {roleRepo} from "../../repos/index";
import { PageArray } from "../../helper/pageAray";
import { RoleMapper } from "../../mapper/auth/role.mapper";

export const GetRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, search } = req.query;

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;

        const result = await roleRepo.getRoles(search as string);
        if (!result) {
            const err = ERROR_CODES.SERVER_ERROR;
            return next(new AppError(err.statusCode, err.code, "Failed to get roles"));
        }
        const pageData = PageArray.toArrayPage(result.items, pageNum, limitNum);
        const nonRoot = result.total - result.rootCount;
        let rootPercentage = 0;
        if (result.total > 0) {
            rootPercentage = (result.rootCount / result.total) * 100;
        }
        const nonRootPercentage = 100 - rootPercentage;

        const responseData = pageData.items.map((role) => {
            return RoleMapper.toRolesInfo(role);
        });

        return res.status(200).json({
            success: true,
            roles: responseData,
            total: result.total,
            page: pageData.page,
            totalPages: pageData.totalPages,
            rootCount: result.rootCount,
            nonRootCount: nonRoot,
            rootPercentage: rootPercentage.toFixed(2) + "%",
            nonRootPercentage: nonRootPercentage.toFixed(2) + "%"
        });
    } catch (error) {
        console.error("GetRoles error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
}

export const GetRoleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { roleId } = req.body;
        if (!roleId) {
            const err = ERROR_CODES.INVALID_INPUT;
            return next(new AppError(err.statusCode, err.code, "Missing required Role ID"));
        }
        const result = await roleRepo.getRoleById(roleId);
        if (!result) {
            const err = ERROR_CODES.NOT_FOUND;
            return next(new AppError(err.statusCode, err.code, "Role not found"));
        }
        const responseData = RoleMapper.toRoleResponse(result);

        return res.status(200).json({
            success: true,
            role: responseData
        });
    } catch (error) {
        console.error("GetRoleById error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
}

export const DeleteRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { roleId } = req.body;
        if (!roleId) {
            const err = ERROR_CODES.INVALID_INPUT;
            return next(new AppError(err.statusCode, err.code, "Missing required Role ID"));
        }
        const result = await roleRepo.deleteRole(roleId);
        if (!result) {
            const err = ERROR_CODES.NOT_FOUND;
            return next(new AppError(err.statusCode, err.code, "Role not found"));
        }
        return res.status(200).json({
            success: true,
            message: "Role deleted successfully"
        });
    } catch (error) {
        console.error("DeleteRole error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
}

export const DisableOrEnableRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { roleId, enable } = req.body;
        if (!roleId || enable === undefined) {
            const err = ERROR_CODES.INVALID_INPUT;
            return next(new AppError(err.statusCode, err.code, "Missing required fields"));
        }
        const result = await roleRepo.disableOrEnableRole(roleId, enable);
        if (!result) {
            const err = ERROR_CODES.NOT_FOUND;
            return next(new AppError(err.statusCode, err.code, "Role not found"));
        }
        return res.status(200).json({
            success: true,
            role: result
        });
    } catch (error) {
        console.error("DisableOrEnableRole error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
}

export const UpsertRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { roleId, name, description, permIds } = req.body;
        if (!name) {
            const err = ERROR_CODES.INVALID_INPUT;
            return next(new AppError(err.statusCode, err.code, "Missing required Name"));
        }
        const roleData = {
            role_id: roleId,
            name,
            description
        };
        const roleUs = await roleRepo.upsertRole(roleData);
        if (!roleUs) {
            const err = ERROR_CODES.SERVER_ERROR;
            return next(new AppError(err.statusCode, err.code, "Failed to upsert role"));
        }

        const result = await roleRepo.upsertPermissionsForRole(roleUs.role_id, permIds);
        if (!result) {
            const err = ERROR_CODES.SERVER_ERROR;
            return next(new AppError(err.statusCode, err.code, "Failed to update permissions to role"));
        }

        return res.status(200).json({
            success: true,
            role: roleUs,
            permissions: result
        });
    } catch (error) {
        console.error("UpsertRole error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
}
