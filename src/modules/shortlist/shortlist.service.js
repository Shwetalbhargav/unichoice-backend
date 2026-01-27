import prisma from "../../config/db.js";
import * as universitiesService from "../universities/universities.service.js";

export const assertOnboarded = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.isOnboarded) {
    const err = new Error("Complete onboarding first.");
    err.statusCode = 403;
    throw err;
  }
};

export const listMine = async (userId) => {
  await assertOnboarded(userId);

  return prisma.shortlistedUniversity.findMany({
    where: { userId },
    include: { university: true },
    orderBy: { createdAt: "desc" },
  });
};

export const add = async ({ userId, universityId, bucket, notes }) => {
  await assertOnboarded(userId);

  // ensure uni exists
  const uni = await prisma.university.findUnique({ where: { id: universityId } });
  if (!uni) {
    const err = new Error("University not found.");
    err.statusCode = 404;
    throw err;
  }

  return prisma.shortlistedUniversity.upsert({
    where: { userId_universityId: { userId, universityId } },
    update: { bucket: bucket ?? undefined, notes: notes ?? undefined },
    create: { userId, universityId, bucket: bucket ?? null, notes: notes ?? null },
    include: { university: true },
  });
};

export const remove = async ({ userId, universityId }) => {
  await assertOnboarded(userId);

  // ignore if not found (or throw—your call)
  return prisma.shortlistedUniversity.delete({
    where: { userId_universityId: { userId, universityId } },
  });
};

export const recommendations = async (userId, overrides = {}) => {
  await assertOnboarded(userId);

  // IMPORTANT: your schema uses OnboardingProfile; make sure your onboarding service aligns with that.
  const profile = await prisma.onboardingProfile.findUnique({ where: { userId } });
  if (!profile) {
    const err = new Error("Onboarding profile not found.");
    err.statusCode = 404;
    throw err;
  }

  // This uses your existing logic: Dream/Target/Safe + reasons
  return universitiesService.filterFromOnboarding(profile, overrides);
};
