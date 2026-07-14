-- CreateEnum
CREATE TYPE "public"."TopbarUserDisplayMode" AS ENUM ('FULL_NAME', 'PERSONNEL_CODE', 'USERNAME');

-- AlterTable
ALTER TABLE "public"."User"
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "personnelCode" TEXT;

-- AlterTable
ALTER TABLE "public"."Setting"
ADD COLUMN     "requireUserBirthDate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requireUserPersonnelCode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "topbarUserDisplayMode" "public"."TopbarUserDisplayMode" NOT NULL DEFAULT 'FULL_NAME';

-- CreateIndex
CREATE INDEX "User_personnelCode_idx" ON "public"."User"("personnelCode");
