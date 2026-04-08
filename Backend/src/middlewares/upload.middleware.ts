import multer from "multer";
import { AppError } from "../utils/app-error";

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb)=>{
        const allowed = 
        file.mimetype.startsWith("image/") ||
        file.mimetype.startsWith("video/");

        if(!allowed){
            const err = new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Only image and video files are allowed");
            return cb(err);
        }

        cb(null, true);
    }
});