// src/modules/onboarding/onboarding.routes.js

import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import { getMyOnboarding, upsertMyOnboarding } from "./onboarding.controller.js";

const router = Router();

router.get("/me", requireAuth, getMyOnboarding);
router.post("/", requireAuth, upsertMyOnboarding);

export default router;
