// src/modules/universities/universities.routes.js

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./universities.controller.js";

const router = Router();

/**
 * Auto-filter using onboarding (AI counsellor should call this)
 * GET /api/universities/filter?limit=20&page=1&country=UK (optional overrides)
 */
router.get("/filter", requireAuth, controller.filterUniversitiesFromOnboarding);

/**
 * Manual search (UI/AI can pass everything in query)
 * GET /api/universities/search?country=USA&topCourse=Computer%20Science
 */
router.get("/search", requireAuth, controller.searchUniversities);

/**
 * Details
 * GET /api/universities/:id
 */
router.get("/:id", requireAuth, controller.getUniversityById);

export default router;
