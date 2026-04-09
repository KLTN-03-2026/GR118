import mongoose from "mongoose";
import dotenv from "dotenv";
import { resolve } from "path";
import roleSchema from "../models/auth/roles";
import { ROLES } from "../constant/role";

dotenv.config({ path: resolve(__dirname, "../../.env") });

async function seedRoles() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Connected to MongoDB.");

        const rolesToCreate = [
            { name: ROLES.USERROLE, is_root: false, description: "Normal User" },
            { name: ROLES.ADMINROLE, is_root: true, description: "Administrator" }
        ];

        for (const r of rolesToCreate) {
            const existing = await roleSchema.findOne({ name: r.name });
            if (!existing) {
                await roleSchema.create(r);
                console.log(`Created role: ${r.name}`);
            } else {
                console.log(`Role ${r.name} already exists.`);
            }
        }
    } catch (e) {
        console.error("Error seeding roles:", e);
    } finally {
        process.exit();
    }
}

seedRoles();
