import mongoose from "mongoose";
import dotenv from "dotenv";
import { resolve } from "path";
import resourceSchema from "../models/auth/resources";
import actionSchema from "../models/auth/actions";
import permissionSchema from "../models/auth/permissions";
import permissionActionSchema from "../models/auth/permission_actions";
import roleModel from "../models/auth/roles";
import rolePermissionSchema from "../models/auth/role_permissions";
import authModel from "../models/auth.model";
import userRoleScheme from "../models/auth/user_role";
import bcrypt from "bcrypt";

dotenv.config({ path: resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/issue_reporting";

async function seed() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected.");

        // 1. RESOURCES (10 Modules)
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

        console.log("📦 Seeding Resources...");
        for (const r of RESOURCES) {
            await resourceSchema.findOneAndUpdate({ resource_id: r.resource_id }, r, { upsert: true });
        }

        // 2. ACTIONS
        console.log("📦 Seeding Actions...");
        const ACTIONS_LIST = RESOURCES.flatMap(r => [
            { action_id: `act_${r.name}_create`,  resource_id: r.resource_id, name: "create" },
            { action_id: `act_${r.name}_read`,    resource_id: r.resource_id, name: "read" },
            { action_id: `act_${r.name}_update`,  resource_id: r.resource_id, name: "update" },
            { action_id: `act_${r.name}_delete`,  resource_id: r.resource_id, name: "delete" },
            { action_id: `act_${r.name}_approve`, resource_id: r.resource_id, name: "approve" },
            { action_id: `act_${r.name}_export`,  resource_id: r.resource_id, name: "export" },
            { action_id: `act_${r.name}_assign`,  resource_id: r.resource_id, name: "assign" },
        ]);

        for (const a of ACTIONS_LIST) {
            await actionSchema.findOneAndUpdate({ action_id: a.action_id }, a, { upsert: true });
        }

        // 3. PERMISSIONS
        console.log("📦 Seeding Permissions...");
        const PERMISSIONS = [
            { perm_id: "perm_vande", resource_id: "res_vande", name: "Vấn đề", description: "Tiếp cận module Vấn đề", is_root: true },
            { perm_id: "perm_volunteer", resource_id: "res_volunteer", name: "Tình nguyện", description: "Tiếp cận module Tình nguyện", is_root: true },
            { perm_id: "perm_stats_ov", resource_id: "res_stats_ov", name: "Thống kê tổng quan", description: "Tiếp cận Thống kê tổng quan", is_root: true },
            { perm_id: "perm_issues_mg", resource_id: "res_issues_mg", name: "Quản lý báo cáo", description: "Tiếp cận Quản lý báo cáo", is_root: true },
            { perm_id: "perm_issues_pr", resource_id: "res_issues_pr", name: "Xử lý báo cáo", description: "Tiếp cận Xử lý báo cáo", is_root: true },
            { perm_id: "perm_users_mg", resource_id: "res_users_mg", name: "Quản lý người dùng", description: "Tiếp cận Quản lý người dùng", is_root: true },
            { perm_id: "perm_reports_st", resource_id: "res_reports_st", name: "Thống kê báo cáo", description: "Tiếp cận Thống kê báo cáo", is_root: true },
            { perm_id: "perm_activ_mg", resource_id: "res_activ_mg", name: "Quản lý hoạt động tình nguyện", description: "Tiếp cận Quản lý hoạt động", is_root: true },
            { perm_id: "perm_perms_mg", resource_id: "res_perms_mg", name: "Quản lý quyền", description: "Tiếp cận Quản lý quyền", is_root: true },
            { perm_id: "perm_roles_mg", resource_id: "res_roles_mg", name: "Quản lý vai trò", description: "Tiếp cận Quản lý vai trò", is_root: true },
        ];

        for (const p of PERMISSIONS) {
            await permissionSchema.findOneAndUpdate({ perm_id: p.perm_id }, p, { upsert: true });
            
            // Link all 7 actions for this resource to this permission
            const resourceName = RESOURCES.find(r => r.resource_id === p.resource_id)?.name;
            const actionNames = ["create", "read", "update", "delete", "approve", "export", "assign"];
            
            for (const actName of actionNames) {
                const actionId = `act_${resourceName}_${actName}`;
                await permissionActionSchema.findOneAndUpdate(
                    { perm_id: p.perm_id, action_id: actionId },
                    { perm_id: p.perm_id, action_id: actionId },
                    { upsert: true }
                );
            }
        }

        // 4. ROLES
        console.log("📦 Seeding Roles...");
        const ROLES_DATA = [
            { role_id: "role_admin", name: "admin", description: "Quản trị viên", is_root: true, is_active: true, perms: PERMISSIONS.map(p => p.perm_id) },
            { role_id: "role_canbo", name: "cán bộ", description: "Cán bộ quản lý", is_root: true, is_active: true, perms: ["perm_vande", "perm_volunteer", "perm_issues_mg", "perm_issues_pr", "perm_reports_st", "perm_activ_mg"] },
            { role_id: "role_congdan", name: "công dân", description: "Người dân", is_root: true, is_active: true, perms: ["perm_vande", "perm_volunteer"] },
        ];

        for (const r of ROLES_DATA) {
            const { perms, ...roleData } = r;
            await roleModel.findOneAndUpdate({ role_id: r.role_id }, roleData, { upsert: true });
            
            await rolePermissionSchema.deleteMany({ role_id: r.role_id });
            for (const pId of perms) {
                await rolePermissionSchema.create({ role_id: r.role_id, perm_id: pId });
            }
        }

        console.log("✅ Database updated successfully with 10 modules.");
    } catch (e) {
        console.error("❌ Error seeding:", e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();
