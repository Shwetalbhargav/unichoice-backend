import { Router } from "express";
import * as shortlistController from "./shortlist.controller.js";

const router = Router();

router.get("/", shortlistController.listMine);
router.post("/", shortlistController.add);
router.delete("/:universityId", shortlistController.remove);

// optional: recommendations via universities.service.js
router.get("/recommendations", shortlistController.recommendations);

export default router;
