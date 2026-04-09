import mongoose from "mongoose";
import dotenv from "dotenv";
import { resolve } from "path";
import authModel from "../models/auth.model";
import userRoleScheme from "../models/auth/user_role";
import roleSchema from "../models/auth/roles";

dotenv.config({ path: resolve(__dirname, "../../.env") });

async function verifyAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        
        const user = await authModel.findOne({ userName: "admin_root" }).lean();
        if (!user) {
            console.log("User admin_root not found in auths collection");
            return;
        }

        console.log("1. User in auths collection:");
        console.log(JSON.stringify(user, null, 2));

        const userRoles = await userRoleScheme.find({ user_id: user._id.toString() }).lean();
        console.log("\n2. Mapping in user_roles collection:");
        console.log(JSON.stringify(userRoles, null, 2));

        const roleIds = userRoles.map(ur => ur.role_id);
        const roles = await roleSchema.find({ _id: { $in: roleIds } }).lean();
        console.log("\n3. Role definition in roles collection:");
        console.log(JSON.stringify(roles, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

verifyAdmin();
