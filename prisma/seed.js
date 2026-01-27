// prisma/seed.js (ESM)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Driver adapter init (fixes PrismaClientInitializationError)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---- keep rest of your seed logic as-is ----
function extractTopLevelArrays(raw) {
  const arrays = [];
  let depth = 0;
  let start = -1;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "[") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "]") {
      depth--;
      if (depth === 0 && start !== -1) {
        arrays.push(raw.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return arrays;
}

function toRiskLevel(value) {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  if (v === "low") return "Low";
  if (v === "medium") return "Medium";
  if (v === "high") return "High";
  return null;
}

async function main() {
  const filePath = path.join(__dirname, "data", "final data.json");
  const raw = fs.readFileSync(filePath, "utf-8");

  const arrayStrings = extractTopLevelArrays(raw);
  const all = arrayStrings.flatMap((s) => JSON.parse(s));

  console.log(`Found ${all.length} university records`);
  console.log("Prisma models:", Object.keys(prisma));
  console.log(
  Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'))
);


  await prisma.university.deleteMany();

  for (const u of all) {
    await prisma.university.create({
      data: {
        universityName: u.university_name,
        country: u.country,
        city: u.city,
        website: u.website ?? null,
        language: u.language ?? null,

        ratingOutOf5: typeof u.rating_out_of_5 === "number" ? u.rating_out_of_5 : null,
        rankingGlobal: Number.isInteger(u.ranking_global) ? u.ranking_global : null,
        numberOfCourses: Number.isInteger(u.number_of_courses) ? u.number_of_courses : null,

        topCourses: Array.isArray(u.top_courses) ? u.top_courses : [],
        acceptanceRate: u.acceptance_rate ?? null,

        riskLevel: toRiskLevel(u.risk_level),
        visa: u.visa ?? null,
        postStudyWork: u.post_study_work ?? null,

        scholarship: Array.isArray(u.scholarship) ? u.scholarship : [],
        intake: Array.isArray(u.intake) ? u.intake : [],

        costCurrency: u.cost?.currency ?? null,
        tuition: typeof u.cost?.tuition === "number" ? u.cost.tuition : null,
        living: typeof u.cost?.living === "number" ? u.cost.living : null,

        exams: u.exams ?? null,
      },
    });
  }

  console.log("Seeding complete ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
