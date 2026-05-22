import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import resourceSchema from "../../models/auth/resources";
import actionSchema from "../../models/auth/actions";
import permissionSchema from "../../models/auth/permissions";
import permissionActionSchema from "../../models/auth/permission_actions";
import rolePermissionSchema from "../../models/auth/role_permissions";
import roleModel from "../../models/auth/roles";
import authModel from "../../models/auth.model";
import userRoleScheme from "../../models/auth/user_role";
import mongoose from "mongoose";

export const SeedDemoData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("Starting comprehensive seed process (10-module structure)...");

        // 1. SEED RESOURCES
        const RESOURCES = [
            { resource_id: "res_vande",      name: "issues_vande" },
            { resource_id: "res_volunteer",  name: "activities_volunteer" },
            { resource_id: "res_stats_ov",   name: "stats_overview" },
            { resource_id: "res_issues_mg",  name: "issues_mgnt" },
            { resource_id: "res_issues_pr",  name: "issues_process" },
            { resource_id: "res_users_mg",   name: "users_mgnt" },
            { resource_id: "res_reports_st", name: "reports_stats" },
            { resource_id: "res_activ_mg",   name: "activities_mgnt" },
            { resource_id: "res_perms_mg",   name: "perms_mgnt" },
            { resource_id: "res_roles_mg",   name: "roles_mgnt" },
        ];

        for (const r of RESOURCES) {
            await resourceSchema.findOneAndUpdate(
                { resource_id: r.resource_id },
                r,
                { upsert: true }
            );
        }

        // 2. SEED ACTIONS
        const ACTIONS = [
            // Simplified actions for each resource to support the breakdown
            ...RESOURCES.flatMap(r => [
                { action_id: `act_${r.name}_create`,  resource_id: r.resource_id, name: "create" },
                { action_id: `act_${r.name}_read`,    resource_id: r.resource_id, name: "read" },
                { action_id: `act_${r.name}_update`,  resource_id: r.resource_id, name: "update" },
                { action_id: `act_${r.name}_delete`,  resource_id: r.resource_id, name: "delete" },
                { action_id: `act_${r.name}_approve`, resource_id: r.resource_id, name: "approve" },
                { action_id: `act_${r.name}_export`,  resource_id: r.resource_id, name: "export" },
                { action_id: `act_${r.name}_assign`,  resource_id: r.resource_id, name: "assign" },
            ])
        ];

        for (const a of ACTIONS) {
            await actionSchema.findOneAndUpdate(
                { action_id: a.action_id },
                a,
                { upsert: true }
            );
        }

        // 3. SEED PERMISSIONS (One full permission per resource)
        const PERMISSIONS = [
            { perm_id: "perm_vande", resource_id: "res_vande", name: "Vấn đề", description: "Quyền tiếp cận mục Vấn đề", is_root: true },
            { perm_id: "perm_volunteer", resource_id: "res_volunteer", name: "Tình nguyện", description: "Quyền tiếp cận mục Tình nguyện", is_root: true },
            { perm_id: "perm_stats_ov", resource_id: "res_stats_ov", name: "Thống kê tổng quan", description: "Quyền tiếp cận Thống kê tổng quan", is_root: true },
            { perm_id: "perm_issues_mg", resource_id: "res_issues_mg", name: "Quản lý báo cáo", description: "Quyền tiếp cận Quản lý báo cáo", is_root: true },
            { perm_id: "perm_issues_pr", resource_id: "res_issues_pr", name: "Xử lý báo cáo", description: "Quyền tiếp cận Xử lý báo cáo", is_root: true },
            { perm_id: "perm_users_mg", resource_id: "res_users_mg", name: "Quản lý người dùng", description: "Quyền tiếp cận Quản lý người dùng", is_root: true },
            { perm_id: "perm_reports_st", resource_id: "res_reports_st", name: "Thống kê báo cáo", description: "Quyền tiếp cận Thống kê báo cáo", is_root: true },
            { perm_id: "perm_activ_mg", resource_id: "res_activ_mg", name: "Quản lý hoạt động tình nguyện", description: "Quyền tiếp cận Quản lý hoạt động", is_root: true },
            { perm_id: "perm_perms_mg", resource_id: "res_perms_mg", name: "Quản lý quyền", description: "Quyền tiếp cận Quản lý quyền", is_root: true },
            { perm_id: "perm_roles_mg", resource_id: "res_roles_mg", name: "Quản lý vai trò", description: "Quyền tiếp cận Quản lý vai trò", is_root: true },
        ];

        for (const p of PERMISSIONS) {
            await permissionSchema.findOneAndUpdate(
                { perm_id: p.perm_id },
                p,
                { upsert: true }
            );
            // Link all 7 actions
            const resourceName = RESOURCES.find(r => r.resource_id === p.resource_id)?.name;
            const actionNames = ["create", "read", "update", "delete", "approve", "export", "assign"];
            
            const actionIds: string[] = [];
            for (const actName of actionNames) {
                const actionId = `act_${resourceName}_${actName}`;
                actionIds.push(actionId);
                await permissionActionSchema.findOneAndUpdate(
                    { perm_id: p.perm_id, action_id: actionId },
                    { perm_id: p.perm_id, action_id: actionId },
                    { upsert: true }
                );
            }

            // Đồng bộ trường actions vào thẳng bảng permissions
            await permissionSchema.findOneAndUpdate(
                { perm_id: p.perm_id },
                { $set: { actions: actionIds } }
            );
        }

        // 4. SEED ROLES
        const DEFAULT_ROLES = [
            { 
                role_id: "role_admin", 
                name: "admin", 
                description: "Quản trị viên", 
                is_root: true, 
                is_active: true, 
                perms: PERMISSIONS.map(p => p.perm_id) 
            },
            { 
                role_id: "role_canbo", 
                name: "cán bộ", 
                description: "Cán bộ quản lý", 
                is_root: true, 
                is_active: true, 
                perms: ["perm_vande", "perm_volunteer", "perm_issues_mg", "perm_issues_pr", "perm_reports_st", "perm_activ_mg"] 
            },
            { 
                role_id: "role_congdan", 
                name: "công dân", 
                description: "Người dân", 
                is_root: true, 
                is_active: true, 
                perms: ["perm_vande", "perm_volunteer"] 
            },
        ];

        for (const r of DEFAULT_ROLES) {
            const { perms, ...roleData } = r;
            await roleModel.findOneAndUpdate(
                { role_id: r.role_id },
                { ...roleData, permissions: perms }, // Lưu trực tiếp mảng perms vào document
                { upsert: true }
            );
            // Delete old links and add new ones
            await rolePermissionSchema.deleteMany({ role_id: r.role_id });
            for (const permId of perms) {
                await rolePermissionSchema.create({ role_id: r.role_id, perm_id: permId });
            }
        }

        // 5. SEED DEMO USERS
        const hashedPassword = await bcrypt.hash("123456", 12);
        const demoUsers = [
            { name: "Admin", email: "admin@baocaovn.com", roleId: "role_admin", city: "TP. Hồ Chí Minh" },
            { name: "Cán bộ", email: "canbo@baocaovn.com", roleId: "role_canbo", city: "Đà Nẵng" },
            { name: "Công dân", email: "user@baocaovn.com", roleId: "role_congdan", city: "TP. Hồ Chí Minh" }
        ];

        for (const u of demoUsers) {
            let user = await authModel.findOne({ email: u.email });
            if (!user) {
                user = await authModel.create({
                    userName: u.name,
                    email: u.email,
                    password: hashedPassword,
                    types: "login",
                    city: u.city
                });
            } else {
                // Đảm bảo cập nhật trường city nếu chưa có
                user.city = u.city;
                await user.save();
            }

            // Sync role
            await userRoleScheme.findOneAndUpdate(
                { user_id: user._id.toString(), role_id: u.roleId } as any,
                { user_id: user._id.toString(), role_id: u.roleId } as any,
                { upsert: true }
            );
        }

        return res.status(200).json({
            success: true,
            message: "Seeding 10-module system structure completed successfully."
        });
    } catch (error) {
        console.error("Seed error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error during seeding",
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
