import prisma from "../../config/db.js";
import * as tasksService from "../tasks/tasks.service.js";

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function forbidden(message) {
  const err = new Error(message);
  err.statusCode = 403;
  return err;
}

export const getActiveLocks = async (userId) => {
  if (!userId) throw forbidden("Unauthorized");

  const locks = await prisma.lockedUniversity.findMany({
    where: { userId, isActive: true },
    orderBy: { lockedAt: "desc" },
  });

  return locks;
};

export const lockUniversity = async (userId, { universityId, autoCreateTasks }) => {
  if (!userId) throw forbidden("Unauthorized");
  if (!universityId) throw badRequest("universityId is required");

  // Enforce onboarding gate (per hackathon flow)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isOnboarded: true },
  });
  if (!user?.isOnboarded) throw forbidden("Complete onboarding before locking a university.");

  // Ensure university exists
  const uni = await prisma.university.findUnique({ where: { id: universityId } });
  if (!uni) throw badRequest("Invalid universityId");

  return prisma.$transaction(async (tx) => {
    // Optional: deactivate previous active locks if you want ONLY ONE active lock at a time
    // await tx.lockedUniversity.updateMany({
    //   where: { userId, isActive: true },
    //   data: { isActive: false, unlockedAt: new Date() },
    // });

    // If already locked and active, return it
    const existing = await tx.lockedUniversity.findFirst({
      where: { userId, universityId, isActive: true },
    });
    if (existing) return existing;

    const lock = await tx.lockedUniversity.create({
      data: { userId, universityId, isActive: true },
    });

    if (autoCreateTasks) {
      await tasksService.generateDefaultTasks(userId, { lockId: lock.id, universityId }, tx);
    }

    return lock;
  });
};

export const unlockUniversity = async (userId, lockId) => {
  if (!userId) throw forbidden("Unauthorized");
  if (!lockId) throw badRequest("lockId is required");

  const lock = await prisma.lockedUniversity.findUnique({ where: { id: lockId } });
  if (!lock || lock.userId !== userId) throw forbidden("Lock not found");

  if (!lock.isActive) return lock;

  return prisma.lockedUniversity.update({
    where: { id: lockId },
    data: { isActive: false, unlockedAt: new Date() },
  });
};
