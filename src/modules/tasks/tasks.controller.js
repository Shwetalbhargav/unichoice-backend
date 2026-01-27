import * as tasksService from "./tasks.service.js";

export const listTasks = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const data = await tasksService.listTasks(userId, req.query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const data = await tasksService.createTask(userId, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { taskId } = req.params;
    const data = await tasksService.updateTask(userId, taskId, req.body);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const generateTasksForLock = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { lockId, universityId } = req.body;
    const data = await tasksService.generateDefaultTasks(userId, { lockId, universityId });
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};
