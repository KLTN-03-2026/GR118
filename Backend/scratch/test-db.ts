import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const testConnection = async () => {
    const uri = process.env.MONGO_URI;
    console.log("Attempting to connect to:", uri ? uri.split("@")[1] : "undefined (hidden credentials)");
    
    try {
        await mongoose.connect(uri as string, {
            serverSelectionTimeoutMS: 5000 // Timeout after 5s
        });
        console.log("Successfully connected!");
        await mongoose.disconnect();
    } catch (error) {
        console.error("Connection failed with details:");
        console.error(error);
    }
};

testConnection();
