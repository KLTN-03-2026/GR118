import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import authModel from "../models/auth.model";
import mongoose from "mongoose";

const SecretKey = process.env.SECRET_KEY;

if (!SecretKey) {
    throw new Error("need SECRET_KEY!");
}

export interface IUserAuth {
    _id: mongoose.Types.ObjectId | string;
    userName: string;
    email: string;
    types: string;
    roleIds: string[];
}

declare global {
    namespace Express {
        interface Request {
            user?: IUserAuth;
        }
    }
}

const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token = req.cookies?.accessToken;

        // Fallback to Authorization header if cookie is missing
        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
            console.log("[Auth] Used Authorization header for authentication");
        }

        if (!token) {
            console.warn("[Auth] No token found in cookies or Authorization header");
            return res.status(401).json({
                success: false,
                message: "Bạn chưa đăng nhập",
            });
        }

        let decoded: any;

        try {
            decoded = jwt.verify(token, SecretKey);
        } catch (error) {
            console.error("[Auth] Token verification failed:", error instanceof Error ? error.message : error);
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ hoặc đã hết hạn",
            });
        }

        const user = await authModel
            .findById(decoded._id)
            .select("-password");

        if (!user) {
            console.warn(`[Auth] User with ID ${decoded._id} from token not found in database`);
            return res.status(401).json({
                success: false,
                message: "Tài khoản không tồn tại hoặc đã bị khóa",
            });
        }

        req.user = {
            _id: user._id,
            userName: user.userName,
            email: user.email,
            types: user.types,
            roleIds: decoded.roleIds || []
        };

        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi xác thực máy chủ",
        });
    }
};

export default isAuthenticated;