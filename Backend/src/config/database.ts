import mongoose from "mongoose";
import dotenv from "dotenv";
import { AppError } from "../utils/app-error";
import { ERROR_CODES } from "../constant/error";

dotenv.config();

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("MongoDB connected");
    } catch (error) {
        if (error instanceof Error) {
            const err = ERROR_CODES.DB_ERROR;
            throw new AppError(err.statusCode, err.code, err.message, { originalError: error.message });
        } else {
            throw new AppError(500, "UNKNOWN_ERROR", "An unknown error occurred while connecting to the database");
        }
    }
};