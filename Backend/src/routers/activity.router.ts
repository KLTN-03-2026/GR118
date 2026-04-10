import { Router } from "express";
import * as activityController from "../modules/activity.controller/activity.controller";

const router = Router();

router.get("/", activityController.getAllActivities);
router.get("/:id", activityController.getActivityById);
router.post("/", activityController.createActivity);
router.patch("/:id", activityController.updateActivity);
router.delete("/:id", activityController.deleteActivity);
router.post("/:id/register", activityController.registerParticipant);
router.post("/:id/cancel", activityController.cancelRegistration);

export default router;
