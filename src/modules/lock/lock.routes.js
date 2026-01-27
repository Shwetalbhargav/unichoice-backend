import { Router } from "express";
import * as lockController from "./lock.controller.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, lockController.getActiveLocks);
router.post("/", requireAuth, lockController.lockUniversity);
router.post("/:lockId/unlock", requireAuth, lockController.unlockUniversity);

export default router;
