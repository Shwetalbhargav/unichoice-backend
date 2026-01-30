/*
  Warnings:

  - The `preferred_countries` column on the `onboarding_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `funding_plan` column on the `onboarding_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `ielts_status` column on the `onboarding_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `gre_status` column on the `onboarding_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `sop_status` column on the `onboarding_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Country" AS ENUM ('USA', 'UK', 'CANADA', 'GERMANY', 'AUSTRALIA');

-- CreateEnum
CREATE TYPE "FundingPlan" AS ENUM ('SELF_FUNDED', 'SCHOLARSHIP', 'LOAN');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SopStatus" AS ENUM ('NOT_STARTED', 'DRAFT', 'READY');

-- AlterTable
ALTER TABLE "onboarding_profiles" ADD COLUMN     "completed_at" TIMESTAMP(3),
DROP COLUMN "preferred_countries",
ADD COLUMN     "preferred_countries" "Country"[],
DROP COLUMN "funding_plan",
ADD COLUMN     "funding_plan" "FundingPlan",
DROP COLUMN "ielts_status",
ADD COLUMN     "ielts_status" "ExamStatus",
DROP COLUMN "gre_status",
ADD COLUMN     "gre_status" "ExamStatus",
DROP COLUMN "sop_status",
ADD COLUMN     "sop_status" "SopStatus";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;
