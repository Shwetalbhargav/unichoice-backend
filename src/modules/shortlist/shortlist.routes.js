import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as shortlistController from "./shortlist.controller.js";

const router = Router();

router.get("/", requireAuth, shortlistController.listMine);
router.post("/", requireAuth, shortlistController.add);
router.delete("/:universityId", requireAuth, shortlistController.remove);
router.get("/recommendations", requireAuth, shortlistController.recommendations);

export default router;
