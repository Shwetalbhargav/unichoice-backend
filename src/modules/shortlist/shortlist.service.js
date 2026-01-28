// src/modules/shortlist/shortlist.service.js
import prisma from "../../config/db.js";
import universitiesService from "../universities/universities.service.js"; // ✅ default import

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

  return prisma.shortlistItem.findMany({
    where: { userId },
    include: { university: true }, // ✅ works only after you added the relation in schema
    orderBy: { createdAt: "desc" },
  });
};

export const add = async ({ userId, universityId, bucket }) => {
  await assertOnboarded(userId);

  // ensure uni exists
  const uni = await prisma.university.findUnique({ where: { id: universityId } });
  if (!uni) {
    const err = new Error("University not found.");
    err.statusCode = 404;
    throw err;
  }

  return prisma.shortlistItem.upsert({
    where: { userId_universityId: { userId, universityId } },
    update: { bucket: bucket ?? undefined },
    create: { userId, universityId, bucket: bucket ?? null },
    include: { university: true },
  });
};

export const remove = async ({ userId, universityId }) => {
  await assertOnboarded(userId);

  return prisma.shortlistItem.delete({
    where: { userId_universityId: { userId, universityId } },
  });
};

export const recommendations = async (userId, overrides = {}) => {
  await assertOnboarded(userId);

  const profile = await prisma.onboardingProfile.findUnique({ where: { userId } });
  if (!profile) {
    const err = new Error("Onboarding profile not found.");
    err.statusCode = 404;
    throw err;
  }

  // ✅ now works because import is fixed
  return universitiesService.filterFromOnboarding(profile, overrides);
};
