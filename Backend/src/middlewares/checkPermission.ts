import { Request, Response, NextFunction } from "express";
import permissionActionSchema from "../models/auth/permission_actions";
import { SyncResource, SyncAction, GetPermIDsByRoleIDLogin } from "../modules/admin.controller/permission"


const checkPermission = (resource: string, action: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?._id;

            if (!userId) {
                return res.status(401).json({
                    message: "Unauthorized"
                });
            }

            /*
            ==================================
            1. ensure resource tồn tại
            ==================================
            */

            const resourceDoc = await SyncResource(resource);
            if (!resourceDoc) {
                return res.status(403).json({
                    message: "Resource not found"
                });
            }


            /*
            ==================================
            2. ensure action tồn tại
            ==================================
            */
            const actionDoc = await SyncAction(resourceDoc.resource_id, action);

            if (!actionDoc) {
                return res.status(403).json({
                    message: "Action not found"
                });
            }

            /*
            ==================================
            3. lấy role của user
            ==================================
            */

            const roleIds = req.user?.roleIds;

            if (!roleIds || roleIds.length === 0) {
                return res.status(403).json({
                    message: "User has no role"
                });
            }

            /*
            ==================================
            4. role -> permission
            ==================================
            */

            const permIds = await GetPermIDsByRoleIDLogin(roleIds);

            if (permIds.length === 0) {
                return res.status(403).json({
                    message: "Role has no permission"
                });
            }

            /*
            ==================================
            5. permission -> action
            ==================================
            */
            const permActions = await permissionActionSchema.find({
                perm_id: { $in: permIds },
                action_id: actionDoc.action_id.toString()

            });
            console.log("actionDoc.action_id: " + actionDoc.action_id);

            console.log("permActions: " + permActions.length);

            if (permActions.length === 0) {

                return res.status(403).json({
                    message: "Forbidden"
                });

            }

            next();

        } catch (error) {

            console.error(error);

            return res.status(500).json({
                message: "Internal server error"
            });

        }

    };

};

export default checkPermission;