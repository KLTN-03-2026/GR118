import { Router } from "express";
import * as issueController from "../modules/issue.controller/issue.controller";

const router = Router();

router.get("/", issueController.getAllIssues);
router.get("/:id", issueController.getIssueById);
router.post("/", issueController.createIssue);
router.put("/:id/status", issueController.updateIssueStatus);
router.post("/:id/verifications", issueController.verifyIssue);
router.post("/:id/vote", issueController.upvoteIssue);

export default router;
