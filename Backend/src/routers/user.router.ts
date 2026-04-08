import { Router } from "express";
import { getMe, uploadFIle } from "../modules/user.controller/user.controller";
import multer from "multer";
import isAuthenticated from "../middlewares/isAuthenticated";
import checkPermission from "../middlewares/checkPermission";
import { ACTIONS } from "../constant/action";
import { RESOURCES } from "../constant/resource";

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
})

router.post("/upload", upload.single("file"), isAuthenticated, checkPermission(RESOURCES.USER, ACTIONS.UPLOAD_FILE), uploadFIle);
router.get("/me", isAuthenticated, getMe);

export default router;