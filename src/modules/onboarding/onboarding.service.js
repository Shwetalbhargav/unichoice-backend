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

const mapPayloadToOnboarding = (payload) => ({
  educationLevel: payload.educationLevel,
  fieldOfStudy: payload.fieldOfStudy,
  graduationYear: payload.graduationYear ?? null,

  // map API names -> schema names
  targetDegree: payload.intendedDegree ?? payload.targetDegree ?? null,
  targetIntake: payload.targetIntakeYear
    ? String(payload.targetIntakeYear)
    : (payload.targetIntake ?? null),

  preferredCountries: payload.preferredCountries,

  fundingPlan: payload.fundingPlan ?? null,
  budgetRange: payload.budgetPerYear
    ? String(payload.budgetPerYear)
    : (payload.budgetRange ?? null),

  ieltsStatus: payload.ieltsStatus ?? null,
  greStatus: payload.greStatus ?? null,
  sopStatus: payload.sopStatus ?? null,
});

const isComplete = (data) => {
  return Boolean(
    data.educationLevel &&
      data.targetDegree &&
      data.fieldOfStudy &&
      data.targetIntake &&
      Array.isArray(data.preferredCountries) &&
      data.preferredCountries.length > 0 &&
      data.fundingPlan
  );
};

export const getOnboardingByUserId = async (userId) => {
  return prisma.onboardingProfile.findUnique({ where: { userId } });
};

export const upsertOnboarding = async (userId, payload) => {
  if (payload.preferredCountries) validateCountries(payload.preferredCountries);

  const data = mapPayloadToOnboarding(payload);
  const complete = isComplete(data);

  return prisma.$transaction(async (tx) => {
    const onboarding = await tx.onboardingProfile.upsert({
      where: { userId },
      create: { userId, ...data, completedAt: complete ? new Date() : null },
      update: { ...data, completedAt: complete ? new Date() : null },
    });

    await tx.user.update({
      where: { id: userId },
      data: { isOnboarded: complete },
    });

    return onboarding;
  });
};
