import prisma from "../../config/db.js";
import * as universitiesService from "../universities/universities.service.js";

// OPTIONAL (if you already built these modules)
import * as shortlistService from "../shortlist/shortlist.service.js";
import * as lockService from "../lock/lock.service.js";

function forbidden(message) {
  const err = new Error(message);
  err.statusCode = 403;
  return err;
}

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

// Helpers: decide stage + next navigation route
const STAGES = {
  ONBOARDING: "ONBOARDING",
  DISCOVERY: "DISCOVERY",
  SHORTLIST: "SHORTLIST",
  LOCK: "LOCK",
  TASKS: "TASKS",
};

function buildNextAction(stage) {
  switch (stage) {
    case STAGES.ONBOARDING:
      return { nextRoute: "/onboarding", message: "Complete onboarding to start recommendations." };
    case STAGES.DISCOVERY:
      return { nextRoute: "/discover", message: "Explore courses and recommended universities." };
    case STAGES.SHORTLIST:
      return { nextRoute: "/shortlist", message: "Shortlist universities before locking one." };
    case STAGES.LOCK:
      return { nextRoute: "/lock", message: "Lock your final university to unlock application tasks." };
    case STAGES.TASKS:
      return { nextRoute: "/tasks", message: "Follow your application to-dos." };
    default:
      return { nextRoute: "/dashboard", message: "Continue your journey." };
  }
}

export const getStatus = async (userId) => {
  if (!userId) throw forbidden("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isOnboarded: true },
  });

  // If onboarding profile exists, we can do discovery
  const profile = await prisma.onboardingProfile.findUnique({
    where: { userId },
  });

  // counts (don’t crash if modules not migrated yet)
  const shortlistCount = await prisma.shortlistedUniversity
    ?.count?.({ where: { userId } })
    .catch(() => 0);

  const activeLocks = await prisma.lockedUniversity
    ?.findMany?.({ where: { userId, isActive: true } })
    .catch(() => []);

  const tasksCount = await prisma.task
    ?.count?.({ where: { userId } })
    .catch(() => 0);

  let stage = STAGES.DISCOVERY;

  if (!user?.isOnboarded || !profile) stage = STAGES.ONBOARDING;
  else if ((shortlistCount ?? 0) === 0) stage = STAGES.DISCOVERY;
  else if ((activeLocks?.length ?? 0) === 0) stage = STAGES.SHORTLIST;
  else if ((tasksCount ?? 0) === 0) stage = STAGES.LOCK;
  else stage = STAGES.TASKS;

  return {
    stage,
    next: buildNextAction(stage),
    stats: {
      shortlisted: shortlistCount ?? 0,
      activeLocks: activeLocks?.length ?? 0,
      tasks: tasksCount ?? 0,
    },
  };
};

/**
 * Course selection helper:
 * If you have a Courses table later, plug it here.
 * For now, infer options from existing universities table (distinct course/program strings).
 */
export const getCourseOptions = async (userId) => {
  if (!userId) throw forbidden("Unauthorized");

  const profile = await prisma.onboardingProfile.findUnique({ where: { userId } });
  if (!profile) throw forbidden("Complete onboarding first.");

  // If your University model has fields like program/courseName/fieldOfStudy, use those.
  // Since we don’t know your exact columns, we keep this safe + minimal:
  // Option A: return “suggested” based on profile
  return {
    suggested: [
      profile?.desiredCourse || null,
      profile?.fieldOfStudy || null,
      profile?.specialization || null,
    ].filter(Boolean),
    note: "If you store courses on universities, we can return distinct options from DB.",
  };
};

export const selectCourse = async (userId, course) => {
  if (!userId) throw forbidden("Unauthorized");
  if (!course) throw badRequest("course is required");

  // Save into onboarding profile (adjust field name to your schema)
  // If you already have `desiredCourse`, store it there.
  const updated = await prisma.onboardingProfile.update({
    where: { userId },
    data: { desiredCourse: course },
  });

  return {
    message: "Course preference saved.",
    profile: updated,
  };
};

export const getRecommendations = async (userId, overrides = {}) => {
  if (!userId) throw forbidden("Unauthorized");

  const profile = await prisma.onboardingProfile.findUnique({ where: { userId } });
  if (!profile) throw forbidden("Complete onboarding first.");

  // Your existing recommendation logic lives here:
  return universitiesService.filterFromOnboarding(profile, overrides);
};

// Optional “one click” actions (if these services exist in your codebase)
export const shortlistUniversity = async (userId, payload) => {
  if (!shortlistService?.add) throw badRequest("Shortlist module not available.");
  return shortlistService.add({ userId, ...payload });
};

export const lockUniversity = async (userId, payload) => {
  if (!lockService?.lockUniversity) throw badRequest("Lock module not available.");
  return lockService.lockUniversity(userId, { universityId: payload.universityId, autoCreateTasks: true });
};
