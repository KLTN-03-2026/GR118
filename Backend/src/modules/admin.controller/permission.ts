import { Request, Response, NextFunction } from "express";
import {permissionRepo} from "../../repos/index";
import { AppError } from "../../utils/app-error";
import { ERROR_CODES } from "../../constant/error";
import { PageArray } from "../../helper/pageAray";
import { PermissionMapper } from "../../mapper/auth/permission.mapper";

export const UpsertPermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { permID, resourceID, name, description, actionIDs } = req.body;
        if (!resourceID || !name) {
            const err = ERROR_CODES.INVALID_INPUT;
            return next(new AppError(err.statusCode, err.code, "Missing required fields"));
        }

        const permData = {
            perm_id: permID,
            resource_id: resourceID,
            name,
            description,
        };

        const permUs = await permissionRepo.upsertPermission(permData);

        if (!permUs) {
            const err = ERROR_CODES.SERVER_ERROR;
            return next(new AppError(err.statusCode, err.code, "Failed to upsert permission"));
        }
        if (!Array.isArray(actionIDs)) {
            const err = ERROR_CODES.INVALID_INPUT;
            return next(new AppError(err.statusCode, err.code, "actionIDs must be an array"));
        }
        const result = await permissionRepo.updateActionsToPermission(permUs.perm_id, actionIDs);
        if (!result) {
            const err = ERROR_CODES.SERVER_ERROR;
            return next(new AppError(err.statusCode, err.code, "Failed to update actions to permission"));
        }

        return res.status(200).json({
            success: true,
            permission: result
        });
    } catch (error) {
        console.error("UpsertPermission error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
}

export const DeletePermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Read from route param first (DELETE /permissions/:id), fallback to body for backward compat
        const permID = req.params.id || req.body.permID;
        if (!permID) {
            const err = ERROR_CODES.INVALID_INPUT;
            return next(new AppError(err.statusCode, err.code, "Missing required fields: permID"));
        }

        await permissionRepo.deletePermission(permID);

        return res.status(200).json({
            success: true,
            message: "Permission deleted successfully"
        });
    } catch (error) {
        console.error("DeletePermission error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
}

export const GetPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const merged = Object.assign({}, req.body || {}, req.query || {});
        const { page, limit, search } = merged as { page?: string; limit?: string; search?: string };

        const result = await permissionRepo.getPermissions(search as string);
        if (!result) {
            const err = ERROR_CODES.SERVER_ERROR;
            return next(new AppError(err.statusCode, err.code, "Failed to get permissions"));
        }
        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 10));
        const permInfo = PageArray.toArrayPage(result.permissions, pageNum, limitNum);
        const nonRoot = result.total - result.rootCount;
        let rootPercentage = 0;
        if (result.total > 0) {
            rootPercentage = (result.rootCount / result.total) * 100;
        }
        const nonRootPercentage = 100 - rootPercentage;

        const responseData = permInfo.items.map((perm) => {
            return PermissionMapper.toPermissionsInfo(perm);
        });

        return res.status(200).json({
            success: true,
            permissions: responseData,
            total: result.total,
            page: permInfo.page,
            totalPages: permInfo.totalPages,
            rootCount: result.rootCount,
            nonRootCount: nonRoot,
            rootPercentage: rootPercentage.toFixed(2) + "%",
            nonRootPercentage: nonRootPercentage.toFixed(2) + "%"
        });
    } catch (error) {
        console.error("GetPermissions error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
}

export const GetPermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const permID = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        console.log("GetPermission permID:", permID);
        
        if (!permID) {
            const err = ERROR_CODES.INVALID_INPUT;
            return next(new AppError(err.statusCode, err.code, "Missing required fields"));
        }

        const result = await permissionRepo.getPermission(permID);
        if (!result) {
            const err = ERROR_CODES.NOT_FOUND;
            return next(new AppError(err.statusCode, err.code, "Permission not found"));
        }

        const permInfo = PermissionMapper.toPermissionInfo(result);

        return res.status(200).json({
            success: true,
            permission: permInfo
        });

    } catch (error) {
        console.error("GetPermission error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
}

export const GetActions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rawResourceID = Array.isArray(req.query.resourceID) ? req.query.resourceID[0] : req.query.resourceID;
        const resourceID = typeof rawResourceID === "string" ? rawResourceID : undefined;
        if (!resourceID) {
            const err = ERROR_CODES.INVALID_INPUT;
            return next(new AppError(err.statusCode, err.code, "Missing required fields"));
        }

        const result = await permissionRepo.getActions(resourceID);
        if (!result) {
            const err = ERROR_CODES.SERVER_ERROR;
            return next(new AppError(err.statusCode, err.code, "Failed to get actions"));
        }

        const actionsInfo = PermissionMapper.toActionsResponse(result);

        return res.status(200).json({
            success: true,
            actions: actionsInfo
        });
    } catch (error) {
        console.error("GetActions error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
}

export const GetResources = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await permissionRepo.getResources();
        if (!result) {
            const err = ERROR_CODES.SERVER_ERROR;
            return next(new AppError(err.statusCode, err.code, "Failed to get resources"));
        }

        const resourcesInfo = PermissionMapper.toResourcesResponse(result);

        return res.status(200).json({
            success: true,
            resources: resourcesInfo
        });
    } catch (error) {
        console.error("GetResources error:", error);
        if (error instanceof AppError) {
            return next(error);
        }
        const err = ERROR_CODES.SERVER_ERROR;
        return next(new AppError(err.statusCode, err.code, "Internal Server Error"));
    }
}

export const SyncResource = async (resourceName: string) => {
    if (!resourceName) {
        throw new Error("Missing required fields");
    }
    const result = await permissionRepo.FindOrCreateResource(resourceName);
    if (!result) {
        throw new Error("Failed to sync resource");
    }

    return result;
}

export const SyncAction = async (resourceID: string, actionName: string) => {
    if (!resourceID || !actionName) {
        throw new Error("Missing required fields");
    }
    const result = await permissionRepo.FindOrCreateAction(resourceID, actionName);
    if (!result) {
        throw new Error("Failed to sync action");
    }

    return result;
}

export const GetPermIDsByRoleIDLogin = async (roleId: string[]) => {
    const perms = await permissionRepo.getPermIDsByRoleID(roleId);
    return perms.map(p => p.perm_id);
}


