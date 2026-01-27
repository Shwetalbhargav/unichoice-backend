import * as counsellorService from "./counsellor.service.js";

export const status = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const data = await counsellorService.getStatus(userId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const courseOptions = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const data = await counsellorService.getCourseOptions(userId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const selectCourse = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { course } = req.body;
    const data = await counsellorService.selectCourse(userId, course);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const recommendations = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    // query can override filters: ?country=USA&budget=20000 etc.
    const data = await counsellorService.getRecommendations(userId, req.query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const shortlist = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { universityId, bucket, notes } = req.body;
    const data = await counsellorService.shortlistUniversity(userId, {
      universityId,
      bucket,
      notes,
    });
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const lock = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { universityId } = req.body;
    const data = await counsellorService.lockUniversity(userId, { universityId });
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};
