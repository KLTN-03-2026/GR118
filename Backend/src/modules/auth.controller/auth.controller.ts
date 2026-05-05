import { Request, Response } from 'express';
import authModel from '../../models/auth.model';
import bcrypt from "bcrypt";
import otpModel from "../../models/otp.model";

import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from 'google-auth-library';
import roleSchema from '../../models/auth/roles';
import { ROLES } from '../../constant/role';
import { userRepo, authRepo, permissionRepo } from "../../repos/index";
import { generateTokens } from '../../utils/jwt';
import mongoose from 'mongoose';


const secret = process.env.SECRET_KEY;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
if (!secret) {
    throw new Error("Thiếu biến môi trường SECRET_KEY!");
}
if (!refreshSecret) {
    throw new Error("Thiếu biến môi trường JWT_REFRESH_SECRET!");
}
const googleClientId = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(googleClientId);

export const register = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    try {
        let { userName, email, password } = req.body;

        const result = await session.withTransaction(async () => {
            const verifiedOtp = await otpModel.findOne({
                email: email?.trim().toLowerCase(),
                type: "register",
                used: true
            }).sort({ updatedAt: -1 }).session(session);

            if (!verifiedOtp) {
                throw new Error("Vui lòng xác thực email bằng mã OTP trước khi đăng ký");
            }

            const createRes = await authRepo.CreateNewUser(userName, email, password, session);

            if (!createRes.success || !createRes.data) {
                throw new Error(createRes.message || "Không thể tạo tài khoản");
            }

            const newUser = createRes.data;

            const userRole = await roleSchema.findOne({ name: ROLES.USERROLE }).session(session);
            if (!userRole) {
                throw new Error("Không tìm thấy vai trò người dùng mặc định. Vui lòng liên hệ quản trị viên.");
            }
            
            await userRepo.AddNewRolesToNewUser(newUser._id.toString(), userRole.role_id, session);
            
            await otpModel.deleteMany({ email: email?.trim().toLowerCase(), type: "register" }, { session });

            return { success: true };
        });

        if (result.success) {
            return res.status(201).json({
                success: true,
                message: "Account created successfully"
            });
        }

    } catch (error: any) {
        console.error("Register error:", error);
        
        // Trả về lỗi cụ thể nếu do logic nghiệp vụ
        const businessErrors = [
            "Vui lòng xác thực email bằng mã OTP trước khi đăng ký",
            "This email or username is already registered",
            "Không tìm thấy vai trò người dùng mặc định"
        ];
        
        if (businessErrors.some(msg => error.message?.includes(msg))) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    } finally {
        await session.endSession();
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        let { userName, password } = req.body;
        const result = await authRepo.loginService(userName, password);
        if (!result.success || !result.data) {
            return res.status(400).json(result);
        }
        const user = result.data;

        const checkLock = await userRepo.checkLockAccount(user._id.toString());
        if (checkLock.locked) {
            return res.status(403).json({
                success: false,
                message: `Your account is locked until ${checkLock.lockEnd ? checkLock.lockEnd.toLocaleString() : 'unknown'}. Reason: ${checkLock.lockReason}`
            });
        }

        const roleIds = await userRepo.GetRoleIDsByUserID(user._id.toString());
        if (!roleIds || !roleIds.length) {
            return res.status(403).json({
                success: false,
                message: "User role not found"
            });
        }
        
        // Filter valid ObjectIds for the _id query part
        const validRoleObjectIds = roleIds.filter(id => id && mongoose.Types.ObjectId.isValid(id));

        const roleRes = await roleSchema.find({ 
            $or: [
                { role_id: { $in: roleIds } },
                { _id: { $in: validRoleObjectIds } }
            ]
        }).lean();
        
        const primaryRole = user.role || (roleRes.length > 0 && roleRes[0].name ? roleRes[0].name.toLowerCase() : "user");
        const primaryRoleId = roleIds[0] || null;

        console.log("User " + user.userName + " logged in with roles: " + (roleRes.length > 0 ? roleRes.map(r => r.name).join(", ") : "none"));

        const { accessToken, refreshToken } = generateTokens(user._id.toString(), roleIds);
        user.refreshToken = refreshToken;
        await user.save();
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions: any = {
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction,
            maxAge: 24 * 60 * 60 * 1000
        };

        const permissions = await permissionRepo.getUserPermissions(roleIds);

        return res.status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
            .json({
                success: true,
                message: `Welcome back ${user.userName}`,
                accessToken,
                refreshToken,
                user: {
                    _id: user._id,
                    userName: user.userName,
                    email: user.email,
                    role: primaryRole,
                    roleId: primaryRoleId,
                    permissions: permissions
                }
            })
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const loginWithGoogle = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: "Google ID token is required"
            });
        }

        const result = await authRepo.loginWithGoogleService(idToken);

        if (!result.success || !result.data) {
            return res.status(400).json(result);
        }

        const { user, accessToken, refreshToken } = result.data;

        const checkLock = await userRepo.checkLockAccount(user._id.toString());
        if (checkLock.locked) {
            return res.status(403).json({
                success: false,
                message: `Your account is locked until ${checkLock.lockEnd ? checkLock.lockEnd.toLocaleString() : 'unknown'}. Reason: ${checkLock.lockReason}`
            });
        }

        const roleIds = await userRepo.GetRoleIDsByUserID(user._id.toString());
        // Filter valid ObjectIds for the _id query part
        const validRoleObjectIds = roleIds.filter(id => id && mongoose.Types.ObjectId.isValid(id));

        const roleRes = await roleSchema.find({ 
            $or: [
                { role_id: { $in: roleIds } },
                { _id: { $in: validRoleObjectIds } }
            ]
        }).lean();
        
        const primaryRole = user.role || (roleRes.length > 0 && roleRes[0].name ? roleRes[0].name.toLowerCase() : "user");
        const primaryRoleId = roleIds.length > 0 ? roleIds[0] : null;

        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions: any = {
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction,
            maxAge: 24 * 60 * 60 * 1000
        };

        const permissions = await permissionRepo.getUserPermissions(roleIds);

        return res.status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
            .json({
                success: true,
                message: `Welcome back ${user.userName}`,
                accessToken,
                refreshToken,
                user: {
                    _id: user._id,
                    userName: user.userName,
                    email: user.email,
                    role: primaryRole,
                    roleId: primaryRoleId,
                    permissions: permissions
                }
            });

    } catch (error) {
        console.error("Google login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const tokenToRefresh = req.cookies?.refreshToken || req.body.refreshToken;

        if (!tokenToRefresh) {
            return res.status(401).json({ success: false, message: "Refresh token is required" });
        }

        const decoded = jwt.verify(tokenToRefresh, refreshSecret) as { _id: string };

        const user = await authModel.findOne({
            _id: decoded._id,
            refreshToken: tokenToRefresh
        });

        if (!user) {
            return res.status(403).json({ success: false, message: "Invalid refresh token. Please login again." });
        }

        const newAccessToken = jwt.sign({ _id: user._id }, secret, { expiresIn: '15m' });
        const newRefreshToken = jwt.sign({ _id: user._id }, refreshSecret, { expiresIn: '7d' });

        user.refreshToken = newRefreshToken;
        await user.save();

        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = { 
            httpOnly: true, 
            sameSite: (isProduction ? "none" : "lax") as "none" | "lax", 
            secure: isProduction 
        };

        return res.status(200)
            .cookie("accessToken", newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
            .cookie("refreshToken", newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
            .json({
                success: true,
                message: "Token refreshed successfully",
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            });
    } catch (error) {
        console.error("Refresh token error:", error);
        return res.status(403).json({ success: false, message: "Invalid or expired refresh token" });
    }
}

export const logout = async (req: Request, res: Response) => {
    try {
        const tokenToRevoke = req.cookies?.refreshToken || req.body.refreshToken;

        if (tokenToRevoke) {
            await authModel.updateOne(
                { refreshToken: tokenToRevoke },
                { $set: { refreshToken: null } }
            );
        }

        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = { 
            httpOnly: true, 
            sameSite: (isProduction ? "none" : "lax") as "none" | "lax", 
            secure: isProduction 
        };

        return res.status(200)
            .clearCookie("accessToken", cookieOptions)
            .clearCookie("refreshToken", cookieOptions)
            .json({
                success: true,
                message: "Logged out successfully"
            });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const user = await authModel.findById(userId).lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Lấy danh sách roleId từ bảng user_roles
        const roleIds = await userRepo.GetRoleIDsByUserID(userId.toString());
        
        // Tìm thông tin vai trò để lấy tên vai trò chính
        const validObjectIds = roleIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        const roleDocs = await roleSchema.find({
            $or: [
                { role_id: { $in: roleIds } },
                { _id: { $in: validObjectIds } }
            ]
        }).lean();

        const primaryRole = user.role || (roleDocs.length > 0 ? roleDocs[0].name.toLowerCase() : "user");
        const primaryRoleId = roleIds[0] || null;

        // Lấy danh sách quyền hạn mới nhất
        const permissions = await permissionRepo.getUserPermissions(roleIds);

        return res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                userName: user.userName,
                email: user.email,
                role: primaryRole,
                roleId: primaryRoleId,
                permissions: permissions,
                phone: user.phone,
                city: user.city,
                avatar: user.avatar,
                createdAt: user.createdAt,
                reportsCount: (user as any).reportsCount || 0,
                resolvedCount: (user as any).resolvedCount || 0,
                lockEnd: user.lockEnd,
                lockReason: user.lockReason
            }
        });
    } catch (error) {
        console.error("GetProfile error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

 e x p o r t   c o n s t   T e s t E m a i l   =   a s y n c   ( r e q :   a n y ,   r e s :   a n y )   = >   { 
         c o n s t   {   e m a i l   }   =   r e q . q u e r y ; 
         i f   ( ! e m a i l )   r e t u r n   r e s . s t a t u s ( 4 0 0 ) . j s o n ( {   s u c c e s s :   f a l s e ,   m e s s a g e :   \  
 E m a i l  
 q u e r y  
 p a r a m  
 i s  
 r e q u i r e d \   } ) ; 
 
         t r y   { 
                 c o n s t   {   s e n d O t p E m a i l   }   =   r e q u i r e ( \ . . / . . / u t i l s / e m a i l . s e r v i c e \ ) ; 
                 a w a i t   s e n d O t p E m a i l ( e m a i l   a s   s t r i n g ,   \ 1 2 3 4 5 6 \ ,   \ l o g i n \ ) ; 
                 r e t u r n   r e s . s t a t u s ( 2 0 0 ) . j s o n ( {   s u c c e s s :   t r u e ,   m e s s a g e :   \ E m a i l  
 t e s t  
 d i s p a t c h  
 i n i t i a t e d .  
 C h e c k  
 s e r v e r  
 l o g s  
 a n d  
 y o u r  
 i n b o x / s p a m . \   } ) ; 
         }   c a t c h   ( e r r o r )   { 
                 r e t u r n   r e s . s t a t u s ( 5 0 0 ) . j s o n ( {   s u c c e s s :   f a l s e ,   m e s s a g e :   e r r o r   i n s t a n c e o f   E r r o r   ?   e r r o r . m e s s a g e   :   \ T e s t  
 f a i l e d \   } ) ; 
         } 
 } ;  
 