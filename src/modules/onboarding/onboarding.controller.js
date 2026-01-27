// src/modules/onboarding/onboarding.controller.js

import { success } from "../../utils/response.js";
import { getOnboardingByUserId, upsertOnboarding } from "./onboarding.service.js";

export const getMyOnboarding = async (req, res, next) => {
  try {
    const data = await getOnboardingByUserId(req.user.id);
    return success(res, "Onboarding fetched", data);
  } catch (err) {
    next(err);
  }
};

export const upsertMyOnboarding = async (req, res, next) => {
  try {
    const data = await upsertOnboarding(req.user.id, req.body);
    return success(res, "Onboarding saved", data);
  } catch (err) {
    next(err);
  }
};
