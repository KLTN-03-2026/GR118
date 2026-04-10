import mongoose from "mongoose";
import dotenv from "dotenv";
import { resolve } from "path";
import roleSchema from "../models/auth/roles";
import rolePermissionSchema from "../models/auth/role_permissions";
import userRoleScheme from "../models/auth/user_role";

dotenv.config({ path: resolve(__dirname, "../../.env") });

async function deleteAdminRole() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI as string);
        
        // Find the role first to get its ID
        const roles = await roleSchema.find({ 
            $or: [
                { name: "admin" },
                { name: "ADMIN" },
                { name: "Quản trị viên" },
                { role_id: "admin_role_001" }
            ]
        });

        if (roles.length === 0) {
            console.log("❌ No Admin role found to delete.");
        } else {
            for (const role of roles) {
                console.log(`🗑️ Deleting role: ${role.name} (${role.role_id})`);
                await roleSchema.deleteOne({ role_id: role.role_id });
                await rolePermissionSchema.deleteMany({ role_id: role.role_id });
                await userRoleScheme.deleteMany({ role_id: role.role_id });
                console.log(`✅ Deleted ${role.name}`);
            }
        }

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

deleteAdminRole();
