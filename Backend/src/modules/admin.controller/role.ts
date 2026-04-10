import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/app-error";
import { ERROR_CODES } from "../../constant/error";
import {roleRepo} from "../../repos/index";
import { PageArray } from "../../helper/pageAray";
import { RoleMapper } from "../../mapper/auth/role.mapper";
import * as fs from 'fs';

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
        const roleId = req.params.id;
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
        // Frontend gửi DELETE /role?id=xxx — đọc từ query param trước, fallback sang body
        const roleId = (req.query.id as string) || req.body.roleId;
        if (!roleId) {
            const err = ERROR_CODES.INVALID_INPUT;
            return next(new AppError(err.statusCode, err.code, "Missing required Role ID"));
        }

        // Kiểm tra vai trò hệ thống (is_root) — không được phép xóa
        const role = await roleRepo.findRoleById(roleId);
        if (role && role.is_root) {
            return next(new AppError(403, "FORBIDDEN", "Không thể xóa vai trò hệ thống mặc định"));
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

export const UpdateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, roleId, enable, toggleStatus, name, description, permissionIds, permIds } = req.body;
        const targetId = id || roleId;

        if (!targetId) {
            return next(new AppError(400, "BAD_REQUEST", "Missing Role ID"));
        }

        // Trường hợp 1: Chỉ cập nhật trạng thái (Enable/Disable)
        if (enable !== undefined || toggleStatus) {
            const status = toggleStatus ? undefined : enable; // Nếu toggleStatus thì repo sẽ tự đảo ngược hoặc ta lấy từ DB
            
            // Nếu là toggle, ta cần lấy trạng thái hiện tại
            let finalStatus = enable;
            if (toggleStatus) {
                const currentRole = await roleRepo.findRoleById(targetId);
                finalStatus = !currentRole?.is_active;
            }

            const result = await roleRepo.disableOrEnableRole(targetId, finalStatus);
            return res.status(200).json({ success: true, role: result });
        }

        // Trường hợp 2: Cập nhật thông tin chi tiết (Name, Description...)
        const roleData: any = { role_id: targetId };
        if (name) roleData.name = name;
        if (description) roleData.description = description;

        const updatedRole = await roleRepo.upsertRole(roleData);
        
        // Cập nhật quyền nếu có
        const targetPerms = permissionIds || permIds;
        if (targetPerms) {
            await roleRepo.upsertPermissionsForRole(targetId, targetPerms);
        }

        return res.status(200).json({
            success: true,
            role: updatedRole,
            message: "Cập nhật vai trò thành công"
        });

    } catch (error: any) {
        console.error("UpdateRole error:", error);
        return next(new AppError(500, "SERVER_ERROR", error.message || "Internal Server Error"));
    }
}

export const UpsertRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { roleId, name, description, permIds = [] } = req.body;
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
    } catch (error: any) {
        // Ghi log chi tiết ra file để debug
        const logMsg = `\n[${new Date().toISOString()}] UpsertRole Error: ${error.message}\nStack: ${error.stack}\n`;
        try { fs.appendFileSync('error_details.txt', logMsg); } catch(e) {}

        console.error("UpsertRole error detail:", error.message || error);
        
        if (error instanceof AppError) {
            return next(error);
        }

        if (error.statusCode === 400) {
            return next(new AppError(400, "BAD_REQUEST", error.message));
        }

        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error: " + (error.message || "")));
    }
}
