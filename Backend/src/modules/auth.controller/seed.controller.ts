import { Request, Response, NextFunction } from "express";
import authModel from "../../models/auth.model";
import roleModel from "../../models/auth/roles";
import userRoleModel from "../../models/auth/user_role";
import bcrypt from "bcrypt";

export const SeedDemoData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("Starting seed process...");

        // 1. Create Roles if they don't exist
        const defaultRoles = [
            { id: "admin_role_001", name: "admin", description: "Quản trị viên hệ thống" },
            { id: "mod_role_001", name: "moderator", description: "Cán bộ xử lý báo cáo" },
            { id: "user_role_001", name: "user", description: "Người dân gửi báo cáo" }
        ];

        for (const r of defaultRoles) {
            const exists = await roleModel.findOne({ name: r.name });
            if (!exists) {
                await roleModel.create({
                    role_id: r.id,
                    name: r.name,
                    description: r.description,
                    is_active: true
                });
                console.log(`Created role: ${r.name}`);
            }
        }

        // 2. Create Demo Users
        const hashedPassword = await bcrypt.hash("123456", 12);
        const demoUsers = [
            { name: "admin", email: "admin@baocaovn.com", role: "admin", roleId: "admin_role_001" },
            { name: "cán bộ", email: "canbo@baocaovn.com", role: "cán bộ", roleId: "mod_role_001" },
            { name: "user", email: "user@baocaovn.com", role: "user", roleId: "user_role_001" }
        ];

        for (const u of demoUsers) {
            let user = await authModel.findOne({ email: u.email });
            if (!user) {
                user = await authModel.create({
                    userName: u.email.split('@')[0],
                    email: u.email,
                    password: hashedPassword,
                    types: "login"
                });
                console.log(`Created user: ${u.email}`);
            }

            // Assign role
            const roleRelation = await userRoleModel.findOne({ user_id: user._id, role_id: u.roleId });
            if (!roleRelation) {
                await userRoleModel.create({
                    user_id: user._id,
                    role_id: u.roleId
                });
                console.log(`Assigned role ${u.role} to ${u.email}`);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Seeding demo data completed successfully"
        });
    } catch (error) {
        console.error("Seed error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error during seeding"
        });
    }
};
