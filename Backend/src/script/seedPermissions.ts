import mongoose from "mongoose";
import dotenv from "dotenv";
import { resolve } from "path";
import resourceSchema from "../models/auth/resources";
import actionSchema from "../models/auth/actions";
import permissionSchema from "../models/auth/permissions";
import permissionActionSchema from "../models/auth/permission_actions";
import roleSchema from "../models/auth/roles";
import rolePermissionSchema from "../models/auth/role_permissions";

dotenv.config({ path: resolve(__dirname, "../../.env") });

// ══════════════════════════════════════════════════════════════
// 1. RESOURCES — tương ứng với PermissionResource trong frontend
// ══════════════════════════════════════════════════════════════
const RESOURCES = [
    { resource_id: "res_issues",        name: "issues" },
    { resource_id: "res_users",         name: "users" },
    { resource_id: "res_activities",    name: "activities" },
    { resource_id: "res_statistics",    name: "statistics" },
    { resource_id: "res_verifications", name: "verifications" },
    { resource_id: "res_permissions",   name: "permissions" },
    { resource_id: "res_system",        name: "system" },
    { resource_id: "res_reports",       name: "reports" },
];

// ══════════════════════════════════════════════════════════════
// 2. ACTIONS — các hành động cho từng resource
// ══════════════════════════════════════════════════════════════
const ACTIONS = [
    // issues — Báo cáo vấn đề
    { action_id: "act_issues_create",   resource_id: "res_issues",        name: "create" },
    { action_id: "act_issues_read",     resource_id: "res_issues",        name: "read" },
    { action_id: "act_issues_update",   resource_id: "res_issues",        name: "update" },
    { action_id: "act_issues_delete",   resource_id: "res_issues",        name: "delete" },
    { action_id: "act_issues_approve",  resource_id: "res_issues",        name: "approve" },
    { action_id: "act_issues_export",   resource_id: "res_issues",        name: "export" },

    // users — Người dùng
    { action_id: "act_users_create",    resource_id: "res_users",         name: "create" },
    { action_id: "act_users_read",      resource_id: "res_users",         name: "read" },
    { action_id: "act_users_update",    resource_id: "res_users",         name: "update" },
    { action_id: "act_users_delete",    resource_id: "res_users",         name: "delete" },
    { action_id: "act_users_assign",    resource_id: "res_users",         name: "assign" },

    // activities — Hoạt động tình nguyện
    { action_id: "act_activities_create",  resource_id: "res_activities", name: "create" },
    { action_id: "act_activities_read",    resource_id: "res_activities", name: "read" },
    { action_id: "act_activities_update",  resource_id: "res_activities", name: "update" },
    { action_id: "act_activities_delete",  resource_id: "res_activities", name: "delete" },
    { action_id: "act_activities_approve", resource_id: "res_activities", name: "approve" },

    // statistics — Thống kê
    { action_id: "act_stats_read",     resource_id: "res_statistics",     name: "read" },
    { action_id: "act_stats_export",   resource_id: "res_statistics",     name: "export" },

    // verifications — Xác minh
    { action_id: "act_verif_read",     resource_id: "res_verifications",  name: "read" },
    { action_id: "act_verif_approve",  resource_id: "res_verifications",  name: "approve" },
    { action_id: "act_verif_delete",   resource_id: "res_verifications",  name: "delete" },

    // permissions — Quyền hệ thống
    { action_id: "act_perms_create",   resource_id: "res_permissions",    name: "create" },
    { action_id: "act_perms_read",     resource_id: "res_permissions",    name: "read" },
    { action_id: "act_perms_update",   resource_id: "res_permissions",    name: "update" },
    { action_id: "act_perms_delete",   resource_id: "res_permissions",    name: "delete" },

    // system — Cài đặt hệ thống
    { action_id: "act_system_read",    resource_id: "res_system",         name: "read" },
    { action_id: "act_system_update",  resource_id: "res_system",         name: "update" },

    // reports — Báo cáo dữ liệu
    { action_id: "act_reports_read",   resource_id: "res_reports",        name: "read" },
    { action_id: "act_reports_export", resource_id: "res_reports",        name: "export" },
];

// ══════════════════════════════════════════════════════════════
// 3. PERMISSIONS — 1 quyền đại diện cho mỗi resource (full access)
//    + các quyền chi tiết hơn
// ══════════════════════════════════════════════════════════════
interface PermData {
    perm_id: string;
    resource_id: string;
    name: string;
    description: string;
    is_root: boolean;
    action_ids: string[];
}

const PERMISSIONS: PermData[] = [
    // ── issues ────────────────────────────────────────────────
    {
        perm_id: "perm_issues_full",
        resource_id: "res_issues",
        name: "Quản lý toàn bộ báo cáo",
        description: "Toàn quyền: xem, tạo, cập nhật, xóa và phê duyệt báo cáo vấn đề",
        is_root: true,
        action_ids: ["act_issues_create", "act_issues_read", "act_issues_update", "act_issues_delete", "act_issues_approve", "act_issues_export"],
    },
    {
        perm_id: "perm_issues_moderate",
        resource_id: "res_issues",
        name: "Kiểm duyệt báo cáo",
        description: "Xem, cập nhật trạng thái và phê duyệt báo cáo (dành cho cán bộ)",
        is_root: false,
        action_ids: ["act_issues_read", "act_issues_update", "act_issues_approve"],
    },
    {
        perm_id: "perm_issues_read",
        resource_id: "res_issues",
        name: "Xem báo cáo",
        description: "Chỉ xem danh sách và chi tiết báo cáo vấn đề",
        is_root: false,
        action_ids: ["act_issues_read"],
    },
    {
        perm_id: "perm_issues_create",
        resource_id: "res_issues",
        name: "Tạo báo cáo vấn đề",
        description: "Tạo báo cáo vấn đề mới và xem danh sách báo cáo",
        is_root: false,
        action_ids: ["act_issues_create", "act_issues_read"],
    },

    // ── users ─────────────────────────────────────────────────
    {
        perm_id: "perm_users_full",
        resource_id: "res_users",
        name: "Quản lý người dùng",
        description: "Toàn quyền: xem, tạo, chỉnh sửa, xóa và phân quyền người dùng",
        is_root: true,
        action_ids: ["act_users_create", "act_users_read", "act_users_update", "act_users_delete", "act_users_assign"],
    },
    {
        perm_id: "perm_users_moderate",
        resource_id: "res_users",
        name: "Quản lý tài khoản cơ bản",
        description: "Xem và chỉnh sửa thông tin người dùng (dành cho cán bộ)",
        is_root: false,
        action_ids: ["act_users_read", "act_users_update"],
    },
    {
        perm_id: "perm_users_read",
        resource_id: "res_users",
        name: "Xem danh sách người dùng",
        description: "Chỉ xem thông tin cơ bản của người dùng",
        is_root: false,
        action_ids: ["act_users_read"],
    },

    // ── activities ────────────────────────────────────────────
    {
        perm_id: "perm_activities_full",
        resource_id: "res_activities",
        name: "Quản lý hoạt động tình nguyện",
        description: "Toàn quyền: tạo, xem, cập nhật, xóa và phê duyệt hoạt động tình nguyện",
        is_root: true,
        action_ids: ["act_activities_create", "act_activities_read", "act_activities_update", "act_activities_delete", "act_activities_approve"],
    },
    {
        perm_id: "perm_activities_moderate",
        resource_id: "res_activities",
        name: "Kiểm duyệt hoạt động tình nguyện",
        description: "Xem, cập nhật và phê duyệt hoạt động tình nguyện (dành cho cán bộ)",
        is_root: false,
        action_ids: ["act_activities_read", "act_activities_update", "act_activities_approve"],
    },
    {
        perm_id: "perm_activities_read",
        resource_id: "res_activities",
        name: "Xem hoạt động tình nguyện",
        description: "Chỉ xem danh sách và chi tiết hoạt động tình nguyện",
        is_root: false,
        action_ids: ["act_activities_read"],
    },
    {
        perm_id: "perm_activities_join",
        resource_id: "res_activities",
        name: "Tham gia hoạt động",
        description: "Xem và đăng ký tham gia hoạt động tình nguyện (dành cho công dân)",
        is_root: false,
        action_ids: ["act_activities_read", "act_activities_create"],
    },

    // ── statistics ────────────────────────────────────────────
    {
        perm_id: "perm_stats_full",
        resource_id: "res_statistics",
        name: "Quản lý thống kê",
        description: "Xem và xuất toàn bộ báo cáo thống kê hệ thống",
        is_root: true,
        action_ids: ["act_stats_read", "act_stats_export"],
    },
    {
        perm_id: "perm_stats_read",
        resource_id: "res_statistics",
        name: "Xem thống kê",
        description: "Chỉ xem các biểu đồ và số liệu thống kê",
        is_root: false,
        action_ids: ["act_stats_read"],
    },

    // ── verifications ─────────────────────────────────────────
    {
        perm_id: "perm_verif_full",
        resource_id: "res_verifications",
        name: "Quản lý xác minh",
        description: "Toàn quyền: xem, phê duyệt và xóa yêu cầu xác minh tài khoản",
        is_root: true,
        action_ids: ["act_verif_read", "act_verif_approve", "act_verif_delete"],
    },
    {
        perm_id: "perm_verif_approve",
        resource_id: "res_verifications",
        name: "Xét duyệt xác minh",
        description: "Xem và phê duyệt yêu cầu xác minh từ người dùng",
        is_root: false,
        action_ids: ["act_verif_read", "act_verif_approve"],
    },

    // ── permissions ───────────────────────────────────────────
    {
        perm_id: "perm_perms_full",
        resource_id: "res_permissions",
        name: "Quản lý quyền hệ thống",
        description: "Toàn quyền: tạo, xem, cập nhật và xóa các quyền trong hệ thống",
        is_root: true,
        action_ids: ["act_perms_create", "act_perms_read", "act_perms_update", "act_perms_delete"],
    },
    {
        perm_id: "perm_perms_read",
        resource_id: "res_permissions",
        name: "Xem quyền hệ thống",
        description: "Chỉ xem danh sách các quyền trong hệ thống",
        is_root: false,
        action_ids: ["act_perms_read"],
    },

    // ── system ────────────────────────────────────────────────
    {
        perm_id: "perm_system_full",
        resource_id: "res_system",
        name: "Cài đặt hệ thống",
        description: "Xem và thay đổi cài đặt chung của hệ thống",
        is_root: true,
        action_ids: ["act_system_read", "act_system_update"],
    },

    // ── reports ───────────────────────────────────────────────
    {
        perm_id: "perm_reports_full",
        resource_id: "res_reports",
        name: "Xuất báo cáo dữ liệu",
        description: "Xem và xuất/tải xuống các báo cáo dữ liệu từ hệ thống",
        is_root: false,
        action_ids: ["act_reports_read", "act_reports_export"],
    },
];

// ══════════════════════════════════════════════════════════════
// 4. ROLES MẶC ĐỊNH (is_root = true → không thể sửa/xóa trên UI)
// ══════════════════════════════════════════════════════════════
interface RoleData {
    role_id: string;
    name: string;
    description: string;
    is_root: boolean;
    is_active: boolean;
    perm_ids: string[];
}

const DEFAULT_ROLES: RoleData[] = [
    {
        role_id: "role_admin",
        name: "Quản trị viên",
        description: "Vai trò quản trị hệ thống — có toàn bộ quyền, không thể xóa hoặc chỉnh sửa",
        is_root: true,
        is_active: true,
        // Admin có TẤT CẢ permissions (is_root + non-root)
        perm_ids: PERMISSIONS.map(p => p.perm_id),
    },
    {
        role_id: "role_canbo",
        name: "Cán bộ",
        description: "Cán bộ quản lý — có quyền trên báo cáo, người dùng, hoạt động, quyền hệ thống và báo cáo dữ liệu",
        is_root: true,
        is_active: true,
        // Cán bộ: issues + users + activities + permissions + reports
        perm_ids: [
            "perm_issues_full",
            "perm_issues_moderate",
            "perm_users_full",
            "perm_users_moderate",
            "perm_activities_full",
            "perm_activities_moderate",
            "perm_perms_read",
            "perm_reports_full",
            "perm_stats_read",
            "perm_verif_approve",
        ],
    },
    {
        role_id: "role_congdan",
        name: "Công dân",
        description: "Người dùng thông thường — có quyền cơ bản trên báo cáo, xem người dùng và tham gia hoạt động",
        is_root: true,
        is_active: true,
        // Công dân: issues (tạo + xem) + users (xem) + activities (tham gia + xem)
        perm_ids: [
            "perm_issues_create",
            "perm_issues_read",
            "perm_users_read",
            "perm_activities_join",
            "perm_activities_read",
        ],
    },
];

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
async function upsertOne<T>(
    model: any,
    filter: object,
    data: object,
    label: string
): Promise<void> {
    const existing = await model.findOne(filter);
    if (!existing) {
        await model.create(data);
        console.log(`  ✅ Tạo ${label}`);
    } else {
        await model.updateOne(filter, { $set: data });
        console.log(`  ♻️  Cập nhật ${label}`);
    }
}

// ══════════════════════════════════════════════════════════════
// MAIN SEED
// ══════════════════════════════════════════════════════════════
async function seed() {
    try {
        console.log("🔌 Kết nối MongoDB...");
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("✅ Đã kết nối.\n");

        // ── Step 1: Resources ─────────────────────────────────
        console.log("📦 [1/4] Seeding Resources...");
        for (const r of RESOURCES) {
            await upsertOne(
                resourceSchema,
                { resource_id: r.resource_id },
                r,
                `Resource: ${r.name}`
            );
        }

        // ── Step 2: Actions ───────────────────────────────────
        console.log("\n⚡ [2/4] Seeding Actions...");
        for (const a of ACTIONS) {
            await upsertOne(
                actionSchema,
                { action_id: a.action_id },
                a,
                `Action: [${a.resource_id}] ${a.name}`
            );
        }

        // ── Step 3: Permissions + Permission-Actions ──────────
        console.log("\n🔐 [3/4] Seeding Permissions...");
        for (const p of PERMISSIONS) {
            const { action_ids, ...permData } = p;

            await upsertOne(
                permissionSchema,
                { perm_id: permData.perm_id },
                permData,
                `Permission: ${permData.name}`
            );

            // Link permission → actions (upsert each link)
            for (const actionId of action_ids) {
                const linkExists = await permissionActionSchema.findOne({
                    perm_id: permData.perm_id,
                    action_id: actionId
                });
                if (!linkExists) {
                    await permissionActionSchema.create({
                        perm_id: permData.perm_id,
                        action_id: actionId
                    });
                }
            }
        }

        // ── Step 4: Default Roles + Role-Permissions ──────────
        console.log("\n👥 [4/4] Seeding Default Roles...");
        for (const role of DEFAULT_ROLES) {
            const { perm_ids, ...roleData } = role;

            await upsertOne(
                roleSchema,
                { role_id: roleData.role_id },
                roleData,
                `Role: ${roleData.name}`
            );

            // Link role → permissions (upsert each link)
            for (const permId of perm_ids) {
                const linkExists = await rolePermissionSchema.findOne({
                    role_id: role.role_id,
                    perm_id: permId
                });
                if (!linkExists) {
                    try {
                        await rolePermissionSchema.create({
                            role_id: role.role_id,
                            perm_id: permId
                        });
                    } catch (e: any) {
                        // Ignore duplicate key errors
                        if (e.code !== 11000) throw e;
                    }
                }
            }
        }

        console.log(`
╔══════════════════════════════════════════════════════╗
║  🎉 SEED HOÀN THÀNH!                                 ║
╠══════════════════════════════════════════════════════╣
║  📦 Resources : ${RESOURCES.length.toString().padStart(2)} (issues, users, activities...)  ║
║  ⚡ Actions   : ${ACTIONS.length.toString().padStart(2)} actions                           ║
║  🔐 Permissions: ${PERMISSIONS.length.toString().padStart(2)} quyền                        ║
║  👥 Roles      :  3 (Admin, Cán bộ, Công dân)       ║
╠══════════════════════════════════════════════════════╣
║  Mở Quản lý quyền → thấy ${PERMISSIONS.length} quyền           ║
║  Mở Quản lý vai trò → thấy 3 vai trò mặc định       ║
╚══════════════════════════════════════════════════════╝`);

    } catch (e) {
        console.error("❌ Lỗi khi seed:", e);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();

// Cách chạy:
// npx ts-node src/script/seedPermissions.ts
