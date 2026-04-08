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

        const token = req.cookies?.accessToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Bạn chưa đăng nhập",
            });
        }

        let decoded: any;

        try {
            decoded = jwt.verify(token, SecretKey);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ hoặc đã hết hạn",
            });
        }

        const user = await authModel
            .findById(decoded._id)
            .select("-password");

        if (!user) {
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