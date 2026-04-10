import mongoose from "mongoose";
import dotenv from "dotenv";
import roleSchema from "../models/auth/roles";
import rolePermissionSchema from "../models/auth/role_permissions";
import path from "path";

// Load env
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function sync() {
    const mongoUri = process.env.MONGODB_URI || "mongodb://tranthai16_db_user:waUH3xhRYrn17VwN@ac-4ty3y98-shard-00-00.42qeiou.mongodb.net:27017,ac-4ty3y98-shard-00-01.42qeiou.mongodb.net:27017,ac-4ty3y98-shard-00-02.42qeiou.mongodb.net:27017/?ssl=true&replicaSet=atlas-wsivs9-shard-0&authSource=admin&retryWrites=true&w=majority";
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);

    const roles = await roleSchema.find({});
    console.log(`Starting sync for ${roles.length} roles...`);

    for (const role of roles) {
        const links = await rolePermissionSchema.find({ role_id: role.role_id });
        const permIds = links.map(l => l.perm_id);

        if (permIds.length > 0) {
            await roleSchema.updateOne(
                { role_id: role.role_id },
                { $set: { permissions: permIds } }
            );
            console.log(`Updated role ${role.name}: added ${permIds.length} permissions.`);
        } else {
            console.log(`Role ${role.name} has no permissions, skipping.`);
            // Đảm bảo permissions là mảng rỗng nếu không có
            await roleSchema.updateOne(
                { role_id: role.role_id },
                { $set: { permissions: [] } }
            );
        }
    }

    console.log("Sync completed.");
    await mongoose.disconnect();
}

sync().catch(err => {
    console.error("Sync failed:", err);
    process.exit(1);
});
