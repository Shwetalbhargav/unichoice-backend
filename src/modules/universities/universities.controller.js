// src/modules/universities/universities.controller.js

import service from "./universities.service.js";
import { ok, fail } from "../../utils/response.js";
import { getOnboardingByUserId } from "../onboarding/onboarding.service.js";

/**
 * Manual search endpoint (query-driven).
 */
export const searchUniversities = async (req, res) => {
  try {
    const results = await service.search(req.query);
    return ok(res, "Universities fetched", results);
  } catch (e) {
    return fail(res, e.message);
  }
};

/**
 * Filter using onboarding + optional query overrides.
 * AI should prefer this endpoint because it respects the user's profile automatically.
 */
export const filterUniversitiesFromOnboarding = async (req, res) => {
  try {
    // In your auth middleware you set req.user and req.userId
    // In some places you use req.user.id. We'll support both.
    const userId = req.userId || req.user?.id;
    if (!userId) return fail(res, "Unauthorized");

    const onboarding = await getOnboardingByUserId(userId);

    if (!onboarding) {
      return fail(res, "Onboarding not found. Please complete onboarding first.");
    }

    // Build filters from onboarding
    const results = await service.filterFromOnboarding(onboarding, req.query);

    return ok(res, "Universities filtered from onboarding", results);
  } catch (e) {
    return fail(res, e.message);
  }
};

export const getUniversityById = async (req, res) => {
  try {
    const uni = await service.getById(req.params.id);
    return ok(res, "University fetched", uni);
  } catch (e) {
    return fail(res, e.message);
  }
};
