import { Router } from "express";
import { requireAuth} from "../../middleware/auth.js";
import * as tasksController from "./tasks.controller.js";

const router = Router();

router.get("/", requireAuth, tasksController.listTasks);
router.post("/",requireAuth, tasksController.createTask);
router.patch("/:taskId", requireAuth, tasksController.updateTask);
router.post("/generate", requireAuth, tasksController.generateTasksForLock);

export default router;
