import prisma from "../../config/db.js";
import  universitiesService from "../universities/universities.service.js";
import  * as shortlistService from "../shortlist/shortlist.service.js";
import  * as lockService from "../lock/lock.service.js";

import { getGeminiModel } from "./gemini.client.js";
import { extractJsonObject, safeAiFallback } from "./ai.json.js";

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

function costLevel(uni) {
  const total = (uni.tuition ?? 0) + (uni.living ?? 0);
  if (total <= 20000) return "LOW";
  if (total <= 40000) return "MEDIUM";
  return "HIGH";
}

function bucketize(universities = []) {
  // Uses acceptanceChance if present; otherwise put everything into TARGET.
  const buckets = { DREAM: [], TARGET: [], SAFE: [] };

  for (const u of universities) {
    const chance = (u.acceptanceChance || u.acceptance || "").toUpperCase();
    if (chance === "LOW") buckets.DREAM.push(u);
    else if (chance === "HIGH") buckets.SAFE.push(u);
    else buckets.TARGET.push(u);
  }

  return buckets;
}

function toAiUniversity(u) {
  return {
    id: u.id,
    name: u.name,
    country: u.country,
    costLevel: u.costLevel || u.cost || "MEDIUM",
    acceptanceChance: u.acceptanceChance || u.acceptance || "MEDIUM",
  };
}

function buildAiSystemPrompt() {
  return `You are AI Counsellor. You MUST output ONLY valid JSON.
No markdown. No code fences. No extra keys.

Rules:
- Return a single JSON object.
- All keys must exist. If unknown, use empty string, empty array, or null.
- Never hallucinate university IDs. Only use universityId values provided in input.
- If stage is ONBOARDING, recommendations arrays must be empty.
- If stage is DISCOVERY and no shortlist/lock exists, suggest actions as empty unless user explicitly asked to shortlist/lock.
- If you cannot comply, return:
{"version":"1.0","stage":"DISCOVERY","say":"I couldn't format the response correctly. Please try again.","profile_summary":{"strengths":[],"gaps":[],"risks":[]},"recommendations":{"DREAM":[],"TARGET":[],"SAFE":[]},"actions":[],"next":{"nextRoute":"/dashboard","message":"Continue your journey."}}`;
}

function buildAiUserPrompt({
  stage,
  userMessage,
  profile,
  universities,
  shortlistCount,
  activeLocksCount,
  tasksCount,
}) {
  return `Return ONLY JSON in the specified schema.

Context:
- Current stage: ${stage}
- User question: ${userMessage || ""}

User profile JSON:
${JSON.stringify(profile, null, 2)}

Available universities JSON array (each object includes at least: id, name, country, costLevel, acceptanceChance):
${JSON.stringify(universities, null, 2)}

Shortlist count: ${shortlistCount}
Active locks: ${activeLocksCount}
Tasks count: ${tasksCount}

JSON schema:
{
  "version": "1.0",
  "stage": "ONBOARDING|DISCOVERY|SHORTLIST|LOCK|TASKS",
  "say": "string",
  "profile_summary": { "strengths": ["string"], "gaps": ["string"], "risks": ["string"] },
  "recommendations": {
    "DREAM": [{ "universityId": "string", "why_fit": "string", "risks": ["string"], "acceptance": "LOW|MEDIUM|HIGH", "costLevel": "LOW|MEDIUM|HIGH" }],
    "TARGET": [{ "universityId": "string", "why_fit": "string", "risks": ["string"], "acceptance": "LOW|MEDIUM|HIGH", "costLevel": "LOW|MEDIUM|HIGH" }],
    "SAFE": [{ "universityId": "string", "why_fit": "string", "risks": ["string"], "acceptance": "LOW|MEDIUM|HIGH", "costLevel": "LOW|MEDIUM|HIGH" }]
  },
  "actions": [
    { "type": "SHORTLIST", "universityId": "string", "bucket": "DREAM|TARGET|SAFE", "notes": "string" },
    { "type": "LOCK", "universityId": "string", "notes": "string" },
    { "type": "CREATE_TASKS", "tasks": [{ "title": "string", "description": "string", "dueInDays": 7 }] }
  ],
  "next": { "nextRoute": "string", "message": "string" }
}

You must:
1) Write "say" that guides the user to the next decision.
2) Produce Dream/Target/Safe recommendations using ONLY the given university ids.
3) Provide "why_fit" and "risks" for each recommended university.
4) Provide actions ONLY if the user explicitly asked to shortlist/lock/create tasks. Otherwise actions must be [].
5) Always set "next.nextRoute" and "next.message" consistent with stage.`;
}

async function callGeminiStructured({ stage, userMessage, profile, universities, shortlistCount, activeLocksCount, tasksCount, next, buckets }) {
  const model = getGeminiModel();
  if (!model) return safeAiFallback({ stage, next, buckets });

  const system = buildAiSystemPrompt();
  const user = buildAiUserPrompt({
    stage,
    userMessage,
    profile,
    universities,
    shortlistCount,
    activeLocksCount,
    tasksCount,
  });

  try {
    // Gemini SDK uses "contents"; we’ll include system + user as two parts
    const result = await model.generateContent([
      { role: "user", parts: [{ text: system }] },
      { role: "user", parts: [{ text: user }] },
    ]);

    const text = result?.response?.text?.() || "";
    const parsed = extractJsonObject(text);

    if (!parsed || typeof parsed !== "object") {
      return safeAiFallback({ stage, next, buckets });
    }

    // Minimal hardening
    if (!parsed.version) parsed.version = "1.0";
    if (!parsed.stage) parsed.stage = stage;
    if (!parsed.next) parsed.next = next;

    return parsed;
  } catch (e) {
    return safeAiFallback({ stage, next, buckets });
  }
}

export const getStatus = async (userId) => {
  if (!userId) throw forbidden("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isOnboarded: true },
  });

  const profile = await prisma.onboardingProfile.findUnique({ where: { userId } });

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

export const getCourseOptions = async (userId) => {
  if (!userId) throw forbidden("Unauthorized");

  const profile = await prisma.onboardingProfile.findUnique({ where: { userId } });
  if (!profile) throw forbidden("Complete onboarding first.");

  return {
    suggested: [profile?.desiredCourse || null, profile?.fieldOfStudy || null, profile?.specialization || null].filter(Boolean),
    note: "If you store courses on universities, we can return distinct options from DB.",
  };
};

export const selectCourse = async (userId, course) => {
  if (!userId) throw forbidden("Unauthorized");
  if (!course) throw badRequest("course is required");

  const updated = await prisma.onboardingProfile.update({
    where: { userId },
    data: { desiredCourse: course },
  });

  return {
    message: "Course preference saved.",
    profile: updated,
  };
};

/**
 * UPDATED:
 * - keep deterministic recommendation logic
 * - add Gemini structured JSON response with explanations
 * - safe fallback if Gemini fails
 */
export const getRecommendations = async (userId, overrides = {}, userMessage = "") => {
  if (!userId) throw forbidden("Unauthorized");

  const profile = await prisma.onboardingProfile.findUnique({ where: { userId } });
  if (!profile) throw forbidden("Complete onboarding first.");

  // Deterministic list (your existing logic)
  const rec = await universitiesService.filterFromOnboarding(profile, overrides);

  // rec could be array OR object depending on your universitiesService.
  // Normalize to an array best-effort:
  const universitiesArray = Array.isArray(rec)
  ? rec
  : (rec?.items || rec?.universities || rec?.results || []);

  const buckets =
    rec?.grouped && typeof rec.grouped === "object"
      ? rec.grouped
      : bucketize(universitiesArray);


  // Pull live counts for stage + next
  const shortlistCount = await prisma.shortlistedUniversity?.count?.({ where: { userId } }).catch(() => 0);
  const activeLocksCount = await prisma.lockedUniversity?.count?.({ where: { userId, isActive: true } }).catch(() => 0);
  const tasksCount = await prisma.task?.count?.({ where: { userId } }).catch(() => 0);

  // Derive stage from counts (same rules as getStatus)
  let stage = STAGES.DISCOVERY;
  if (!profile) stage = STAGES.ONBOARDING;
  else if ((shortlistCount ?? 0) === 0) stage = STAGES.DISCOVERY;
  else if ((activeLocksCount ?? 0) === 0) stage = STAGES.SHORTLIST;
  else if ((tasksCount ?? 0) === 0) stage = STAGES.LOCK;
  else stage = STAGES.TASKS;

  const next = buildNextAction(stage);

  // Gemini input universities must be small; slice top N for MVP
  const aiUniversities = universitiesArray.slice(0, 15).map(toAiUniversity);

  const aiJson = await callGeminiStructured({
    stage,
    userMessage,
    profile,
    universities: aiUniversities,
    shortlistCount: shortlistCount ?? 0,
    activeLocksCount: activeLocksCount ?? 0,
    tasksCount: tasksCount ?? 0,
    next,
    buckets: {
      DREAM: buckets.DREAM.map(toAiUniversity),
      TARGET: buckets.TARGET.map(toAiUniversity),
      SAFE: buckets.SAFE.map(toAiUniversity),
    },
  });

  return {
    raw: rec,          // your original deterministic response
    buckets,           // deterministic buckets (full objects)
    ai: aiJson,        // structured JSON from Gemini (or fallback)
    stage,
    next,
  };
};

export const shortlistUniversity = async (userId, payload) => {
  if (!shortlistService?.add) throw badRequest("Shortlist module not available.");
  return shortlistService.add({ userId, ...payload });
};

export const lockUniversity = async (userId, payload) => {
  if (!lockService?.lockUniversity) throw badRequest("Lock module not available.");
  return lockService.lockUniversity(userId, { universityId: payload.universityId, autoCreateTasks: true });
};
