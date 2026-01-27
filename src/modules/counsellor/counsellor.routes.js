import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as counsellorController from "./counsellor.controller.js";

const router = Router();

// Main “what should I do next?” endpoint
router.get("/status", requireAuth, counsellorController.status);

// Course exploration / selection helper
router.get("/courses", requireAuth, counsellorController.courseOptions);
router.post("/courses/select", requireAuth, counsellorController.selectCourse);

// Recommendations (Dream/Target/Safe buckets)
router.get("/recommendations", requireAuth, counsellorController.recommendations);

// Optional “one-click” actions (nice for frontend)
router.post("/shortlist", requireAuth, counsellorController.shortlist);
router.post("/lock", requireAuth, counsellorController.lock);

export default router;
