// src/modules/universities/universities.service.js

import prisma from "../../config/db.js";


function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeStr(v) {
  if (typeof v !== "string") return "";
  return v.trim();
}

/**
 * Very simple bucket logic:
 * - DREAM: high ranked OR high rating AND (budget slightly stretched)
 * - TARGET: good fit + within budget
 * - SAFE: lower rank OR higher risk tolerance match
 *
 * You can replace this later with proper probability model.
 */
function bucketUniversity({ uni, onboarding }) {
  const rating = uni.ratingOutOf5 ?? 0;
  const rank = uni.rankingGlobal ?? 9999;
  const tuition = uni.tuition ?? 0;
  const living = uni.living ?? 0;

  // onboarding budget assumptions (if missing, treat as "no budget cap")
  const yearlyBudget = onboarding.budgetPerYear ?? null;

  const totalCost = tuition + living;

  const withinBudget = yearlyBudget ? totalCost <= yearlyBudget : true;
  const slightlyOverBudget = yearlyBudget ? totalCost <= yearlyBudget * 1.15 : true;

  const strongUni = rating >= 4.4 || rank <= 200;
  const decentUni = rating >= 4.0 || rank <= 600;

  if (strongUni && slightlyOverBudget && !withinBudget) return "DREAM";
  if (strongUni && withinBudget) return "TARGET";
  if (decentUni && withinBudget) return "TARGET";
  return "SAFE";
}

/**
 * Core query-driven search. (Your current one, cleaned and kept ESM)
 */
const search = async (q) => {
  const {
    country,
    city,
    topCourse,
    intake,
    riskLevel,
    minRating,
    maxTuition,
    maxLiving,
    limit = 20,
    page = 1,
  } = q;

  const where = {
    ...(country ? { country: { equals: country, mode: "insensitive" } } : {}),
    ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
    ...(riskLevel ? { riskLevel } : {}),
    ...(minRating ? { ratingOutOf5: { gte: Number(minRating) } } : {}),
    ...(maxTuition ? { tuition: { lte: Number(maxTuition) } } : {}),
    ...(maxLiving ? { living: { lte: Number(maxLiving) } } : {}),
    ...(topCourse ? { topCourses: { has: topCourse } } : {}),
    ...(intake ? { intake: { has: intake } } : {}),
  };

  const take = Math.min(toInt(limit) ?? 20, 50);
  const skip = (Math.max(toInt(page) ?? 1, 1) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.university.findMany({
      where,
      orderBy: [{ ratingOutOf5: "desc" }, { rankingGlobal: "asc" }],
      take,
      skip,
    }),
    prisma.university.count({ where }),
  ]);

  return { items, total, page: Number(page), limit: take };
};

/**
 * Build a query from onboarding + allow overrides from req.query
 * This is what the AI counsellor should call.
 */
const filterFromOnboarding = async (onboarding, overrides = {}) => {
  // Countries in onboarding are validated as ["USA","UK",...] in onboarding.service.js :contentReference[oaicite:4]{index=4}
  const preferredCountries = Array.isArray(onboarding.preferredCountries)
    ? onboarding.preferredCountries
    : [];

  const country =
    normalizeStr(overrides.country) ||
    (preferredCountries.length ? preferredCountries[0] : undefined);

  // Map onboarding fieldOfStudy -> topCourse (your university model uses topCourses array)
  const topCourse =
    normalizeStr(overrides.topCourse) || normalizeStr(onboarding.fieldOfStudy) || undefined;

  // Intake: onboarding has targetIntakeYear, not season. If you later store "Fall/Spring", map it here.
  const intake = normalizeStr(overrides.intake) || undefined;

  // Budget: If you store budgetPerYear, we split into tuition/living caps.
  // If you don't have budgetPerYear in DB, this stays undefined and no cap will apply.
  const yearlyBudget = onboarding.budgetPerYear ?? null;

  const maxTuition =
    overrides.maxTuition !== undefined
      ? Number(overrides.maxTuition)
      : yearlyBudget
        ? Math.round(yearlyBudget * 0.7)
        : undefined;

  const maxLiving =
    overrides.maxLiving !== undefined
      ? Number(overrides.maxLiving)
      : yearlyBudget
        ? Math.round(yearlyBudget * 0.3)
        : undefined;

  const q = {
    ...overrides,
    country,
    topCourse,
    intake,
    maxTuition,
    maxLiving,
  };

  // Get raw search results
  const base = await search(q);

  // Add bucket classification + simple reason strings for UI/AI
  const enriched = base.items.map((uni) => {
    const bucket = bucketUniversity({ uni, onboarding });

    const reasons = [];
    if (topCourse) reasons.push(`Matches course interest: ${topCourse}`);
    if (country) reasons.push(`Preferred country: ${country}`);
    if (yearlyBudget) reasons.push(`Budget considered: ~${yearlyBudget}/year`);

    return {
      ...uni,
      bucket, // DREAM / TARGET / SAFE
      reasons,
    };
  });

  // Return grouped view as well (helps frontend & AI)
  const grouped = enriched.reduce(
    (acc, u) => {
      acc[u.bucket].push(u);
      return acc;
    },
    { DREAM: [], TARGET: [], SAFE: [] }
  );

  return {
    ...base,
    items: enriched,
    grouped,
    appliedFilters: {
      country,
      topCourse,
      intake,
      maxTuition,
      maxLiving,
    },
  };
};

const getById = async (id) => {
  const uni = await prisma.university.findUnique({ where: { id } });
  if (!uni) throw new Error("University not found");
  return uni;
};

export default { search, filterFromOnboarding, getById };
