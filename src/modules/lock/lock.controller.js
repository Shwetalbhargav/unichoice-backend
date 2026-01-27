import * as lockService from "./lock.service.js";

export const getActiveLocks = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const data = await lockService.getActiveLocks(userId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const lockUniversity = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { universityId, autoCreateTasks = true } = req.body;

    const data = await lockService.lockUniversity(userId, {
      universityId,
      autoCreateTasks,
    });

    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const unlockUniversity = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { lockId } = req.params;

    const data = await lockService.unlockUniversity(userId, lockId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};
