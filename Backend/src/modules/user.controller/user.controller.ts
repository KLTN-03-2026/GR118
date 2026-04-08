import { Request, Response } from "express";
import { uploadToR2 } from "../../helper/features/r2/r2-upload";
import { AppError } from "../../utils/app-error";
import { ERROR_CODES } from "../../constant/error";
import {userRepo} from "../../repos/index";

export const uploadFIle = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            const err = ERROR_CODES.UPLOAD_ERROR;
            throw new AppError(err.statusCode, err.code, err.message);
        }
        const fileUrl = await uploadToR2(req.file);
        res.status(200).json({
            message: "File uploaded successfully",
            url: fileUrl
        });
    } catch (error) {
        console.error("Controller R2 ERROR:", error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            const err = ERROR_CODES.SERVER_ERROR;
            res.status(err.statusCode).json({ message: err.message });
        }
    }
};
export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const userInfo = await userRepo.GetMe(userId.toString());
        if (!userInfo) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message : "User info retrieved successfully",
            user: userInfo,
        });
    } catch (error) {
        console.error("getMe error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};