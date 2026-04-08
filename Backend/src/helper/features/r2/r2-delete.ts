import {DeleteObjectCommand} from"@aws-sdk/client-s3";
import dotenv from "dotenv";
import { AppError } from "../../../utils/app-error";
import { ERROR_CODES } from "../../../constant/error";
import {r2} from "../../../config/r2";

dotenv.config();

export const deleteFromR2 = async(key: string) => {
    try{
        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
        });

        await r2.send(command);
    } catch (error) {
        const err = ERROR_CODES.DELETE_ERROR_R2;
        if (error instanceof Error) {
            throw new AppError(err.statusCode, err.code, err.message, { originalError: error.message });
        } else {
            throw new AppError(500, "UNKNOWN_ERROR", "An unknown error occurred while deleting from R2");
        }
    }
}