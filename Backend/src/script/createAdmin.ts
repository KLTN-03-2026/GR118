import mongoose from "mongoose";
import dotenv from "dotenv";
import { resolve } from "path";
import authModel from "../models/auth.model";
import roleSchema from "../models/auth/roles";
import bcrypt from "bcrypt";
import userRoleScheme from "../models/auth/user_role";

dotenv.config({ path: resolve(__dirname, "../../.env") });

async function createAdmin() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI as string);
        
        let adminRole = await roleSchema.findOne({ name: "ADMIN" });
        if (!adminRole) {
            console.log("Role ADMIN not found. Assuring creation...");
            adminRole = await roleSchema.create({ name: "ADMIN", is_root: true, description: "Administrator" });
        }

        const email = "admin@baocaovn.com";
        const password = "admin123456";
        const userName = "admin_root";

        let adminUser = await authModel.findOne({ email });
        
        if (!adminUser) {
            const hashedPassword = await bcrypt.hash(password, 12);
            adminUser = await authModel.create({
                userName,
                email,
                password: hashedPassword,
                types: "login"
            });
            console.log("Admin account created.");
        } else {
            console.log("Admin account already exists.");
        }

        const roleExists = await userRoleScheme.findOne({
            user_id: adminUser._id.toString(),
            role_id: adminRole._id.toString()
        });

        if (!roleExists) {
            await userRoleScheme.create({
                user_id: adminUser._id.toString(),
                role_id: adminRole._id.toString()
            });
            console.log("Assigned ADMIN role to account.");
        } else {
             console.log("Account already has ADMIN role.");
        }

        console.log(`\n--- ADMIN CREDENTIALS ---`);
        console.log(`Username: ${userName}`);
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log(`-------------------------\n`);
        
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

createAdmin();
