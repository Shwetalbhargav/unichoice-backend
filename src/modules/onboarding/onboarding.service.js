// src/modules/onboarding/onboarding.service.js

import prisma from "../../config/db.js";

const ALLOWED_COUNTRIES = ["USA", "UK", "CANADA", "GERMANY", "AUSTRALIA"];

const validateCountries = (preferredCountries) => {
  if (!Array.isArray(preferredCountries) || preferredCountries.length === 0) {
    const err = new Error("preferredCountries must be a non-empty array");
    err.statusCode = 400;
    throw err;
  }
  const invalid = preferredCountries.filter((c) => !ALLOWED_COUNTRIES.includes(c));
  if (invalid.length) {
    const err = new Error(
      `Invalid preferredCountries: ${invalid.join(", ")}. Allowed: ${ALLOWED_COUNTRIES.join(", ")}`
    );
    err.statusCode = 400;
    throw err;
  }
};

const isComplete = (payload) => {
  return Boolean(
    payload.educationLevel &&
      payload.intendedDegree &&
      payload.fieldOfStudy &&
      payload.targetIntakeYear &&
      Array.isArray(payload.preferredCountries) &&
      payload.preferredCountries.length > 0 &&
      payload.fundingPlan
  );
};

export const getOnboardingByUserId = async (userId) => {
  return prisma.onboarding.findUnique({ where: { userId } });
};

export const upsertOnboarding = async (userId, payload) => {
  if (payload.preferredCountries) validateCountries(payload.preferredCountries);

  const complete = isComplete(payload);

  return prisma.$transaction(async (tx) => {
    const onboarding = await tx.onboarding.upsert({
      where: { userId },
      create: {
        userId,
        ...payload,
        completedAt: complete ? new Date() : null,
      },
      update: {
        ...payload,
        completedAt: complete ? new Date() : null,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { isOnboarded: complete },
    });

    return onboarding;
  });
};
