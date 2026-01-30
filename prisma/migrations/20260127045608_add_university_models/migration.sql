-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('Low', 'Medium', 'High');

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "university_name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "website" TEXT,
    "language" TEXT,
    "rating_out_of_5" DOUBLE PRECISION,
    "ranking_global" INTEGER,
    "number_of_courses" INTEGER,
    "top_courses" TEXT[],
    "acceptance_rate" TEXT,
    "risk_level" "RiskLevel",
    "visa" TEXT,
    "post_study_work" TEXT,
    "scholarship" TEXT[],
    "intake" TEXT[],
    "cost_currency" TEXT,
    "tuition" INTEGER,
    "living" INTEGER,
    "exams" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "University_country_city_idx" ON "University"("country", "city");

-- CreateIndex
CREATE INDEX "University_risk_level_idx" ON "University"("risk_level");
