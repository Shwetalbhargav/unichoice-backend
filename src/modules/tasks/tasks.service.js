import prisma from "../../config/db.js";

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

export const listTasks = async (userId, q = {}) => {
  if (!userId) throw forbidden("Unauthorized");

  const where = {
    userId,
    ...(q.lockId ? { lockId: String(q.lockId) } : {}),
    ...(q.status ? { status: q.status } : {}),
  };

  return prisma.task.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
};

export const createTask = async (userId, payload) => {
  if (!userId) throw forbidden("Unauthorized");
  if (!payload?.title) throw badRequest("title is required");

  return prisma.task.create({
    data: {
      userId,
      lockId: payload.lockId ?? null,
      universityId: payload.universityId ?? null,
      title: payload.title,
      description: payload.description ?? null,
      dueAt: payload.dueAt ? new Date(payload.dueAt) : null,
      status: payload.status ?? "PENDING",
    },
  });
};

export const updateTask = async (userId, taskId, payload) => {
  if (!userId) throw forbidden("Unauthorized");
  if (!taskId) throw badRequest("taskId is required");

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== userId) throw forbidden("Task not found");

  return prisma.task.update({
    where: { id: taskId },
    data: {
      title: payload.title ?? undefined,
      description: payload.description ?? undefined,
      status: payload.status ?? undefined,
      dueAt: payload.dueAt ? new Date(payload.dueAt) : payload.dueAt === null ? null : undefined,
    },
  });
};

/**
 * Generate default tasks for a locked university.
 * - if `tx` provided, uses transaction client
 */
export const generateDefaultTasks = async (userId, { lockId, universityId }, tx) => {
  if (!userId) throw forbidden("Unauthorized");
  if (!lockId && !universityId) throw badRequest("lockId or universityId is required");

  const db = tx ?? prisma;

  // enforce that there is an active lock (gate application guidance)
  if (lockId) {
    const lock = await db.lockedUniversity.findUnique({ where: { id: lockId } });
    if (!lock || lock.userId !== userId) throw forbidden("Lock not found");
    if (!lock.isActive) throw badRequest("Lock is not active");
  }

  const defaults = [
    { title: "Draft SOP (Statement of Purpose)", description: "Create first draft and iterate." },
    { title: "Collect Transcripts", description: "Request official transcripts / mark sheets." },
    { title: "Prepare Resume/CV", description: "One-page academic resume tailored to program." },
    { title: "Shortlist LOR Writers", description: "Reach out to professors/managers for LORs." },
    { title: "IELTS/TOEFL Plan", description: "Book test or prepare timeline (if pending)." },
    { title: "GRE/GMAT Plan", description: "Book test or prepare timeline (if pending)." },
    { title: "Application Form Checklist", description: "Create doc list and deadlines." },
  ];

  // Avoid duplicates for same lock
  const existing = await db.task.findMany({
    where: {
      userId,
      ...(lockId ? { lockId } : {}),
    },
    select: { title: true },
  });

  const existingTitles = new Set(existing.map((t) => t.title));
  const toCreate = defaults
    .filter((t) => !existingTitles.has(t.title))
    .map((t) => ({
      userId,
      lockId: lockId ?? null,
      universityId: universityId ?? null,
      title: t.title,
      description: t.description,
      status: "PENDING",
    }));

  if (!toCreate.length) return [];

  await db.task.createMany({ data: toCreate });
  return db.task.findMany({
    where: { userId, ...(lockId ? { lockId } : {}) },
    orderBy: { createdAt: "desc" },
  });
};
