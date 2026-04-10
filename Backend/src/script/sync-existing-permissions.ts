import mongoose from "mongoose";
import dotenv from "dotenv";
import permissionSchema from "../models/auth/permissions";
import permissionActionSchema from "../models/auth/permission_actions";
import resourceSchema from "../models/auth/resources";
import path from "path";

// Load env
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function sync() {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/issue_reporting";
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);

    const PERM_IDS = [
        'perm_vande', 'perm_volunteer', 'perm_stats_ov', 'perm_issues_mg', 
        'perm_issues_pr', 'perm_users_mg', 'perm_reports_st', 'perm_activ_mg', 
        'perm_perms_mg', 'perm_roles_mg'
    ];

    console.log(`Starting sync for ${PERM_IDS.length} permissions...`);

    for (const permId of PERM_IDS) {
        // Find all links for this permission
        const links = await permissionActionSchema.find({ perm_id: permId });
        const actionIds = links.map(l => l.action_id);

        if (actionIds.length > 0) {
            const result = await permissionSchema.updateOne(
                { perm_id: permId },
                { $set: { actions: actionIds } }
            );
            console.log(`Updated ${permId}: found ${actionIds.length} actions. Result:`, result.modifiedCount);
        } else {
            console.log(`No actions found for ${permId}, skipping field update.`);
        }
    }

    console.log("Sync completed.");
    await mongoose.disconnect();
}

sync().catch(err => {
    console.error("Sync failed:", err);
    process.exit(1);
});
