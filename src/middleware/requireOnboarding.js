// src/middlewares/requireOnboarding.js
import prisma from "../config/db.js";
import { error } from "../utils/response.js";

export const requireOnboarding = async (req, res, next) => {
  try {
    // requireAuth should already have set req.user.id
    const userId = req.user?.id;

    if (!userId) {
      return error(res, "Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isOnboarded: true },
    });

    if (!user) {
      return error(res, "User not found", 404);
    }

    if (!user.isOnboarded) {
      return error(
        res,
        "Onboarding required. Please complete onboarding to continue.",
        403,
        { next: "ONBOARDING" }
      );
    }

    return next();
  } catch (err) {
    return next(err);
  }
};
