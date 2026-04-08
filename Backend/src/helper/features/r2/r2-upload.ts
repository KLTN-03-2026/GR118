import { PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { AppError } from "../../../utils/app-error";
import { ERROR_CODES } from "../../../constant/error";
import { r2 } from "../../../config/r2";

dotenv.config();

export const uploadToR2 = async (file: Express.Multer.File) => {
    const key = `uploads/${Date.now()}-${file.originalname}`;

    try {
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await r2.send(command);
    } catch (error) {
        console.error("R2 ERROR:", error);
        if (error instanceof Error) {
            const err = ERROR_CODES.R2_UPLOAD_ERROR;
            throw new AppError(err.statusCode, err.code, err.message, { originalError: error.message });
        } else {
            throw new AppError(500, "UNKNOWN_ERROR", "An unknown error occurred while uploading to R2");
        }
    }

   return `${process.env.R2_PUBLIC_URL}/${encodeURIComponent(key)}`;
}