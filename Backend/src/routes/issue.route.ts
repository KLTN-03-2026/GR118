import { Router } from "express";
import { updateIssue } from "../controllers/issue.controller";

const router = Router();

// Route PATCH /api/issues/:id - cập nhật một issue theo id hoặc issueCode
router.patch("/api/issues/:id", updateIssue);

export default router;
