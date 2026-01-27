import * as shortlistService from "./shortlist.service.js";

export const listMine = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await shortlistService.listMine(userId);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

export const add = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { universityId, bucket, notes } = req.body;
    const data = await shortlistService.add({ userId, universityId, bucket, notes });
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
};

export const remove = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { universityId } = req.params;
    await shortlistService.remove({ userId, universityId });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};

export const recommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await shortlistService.recommendations(userId, req.query);
    res.json(data);
  } catch (e) {
    next(e);
  }
};
