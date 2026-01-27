// src/modules/users/users.routes.js

import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import { getMe } from "./users.controller.js";

const router = Router();

router.get("/me", requireAuth, getMe);

export default router;
