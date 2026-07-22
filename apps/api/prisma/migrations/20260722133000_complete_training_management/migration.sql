ALTER TYPE "InPersonTrainingStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "InPersonTrainingStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

CREATE TYPE "TrainingCertificateMode" AS ENUM ('NONE', 'ONLINE_AUTO', 'ONLINE_APPROVAL', 'OFFLINE_UPLOAD');
CREATE TYPE "TrainingCertificateNumberStrategy" AS ENUM ('SEQUENTIAL', 'YEARLY_SEQUENTIAL', 'COURSE_SEQUENTIAL', 'RANDOM', 'CUSTOM_PATTERN');

ALTER TABLE "InPersonTraining"
  ADD COLUMN "certificateMode" "TrainingCertificateMode" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "certificateTemplateId" TEXT,
  ADD COLUMN "certificateNumberStrategy" "TrainingCertificateNumberStrategy" NOT NULL DEFAULT 'SEQUENTIAL',
  ADD COLUMN "certificateNumberStart" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "certificateNumberPattern" TEXT NOT NULL DEFAULT 'AGTPS-{YEAR}-{COURSE}-{SEQ:5}',
  ADD COLUMN "certificateValidationRegex" TEXT,
  ADD COLUMN "certificateRequiresCompletion" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "certificateRequiresPass" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "lockedAt" TIMESTAMP(3),
  ADD COLUMN "unlockedAt" TIMESTAMP(3),
  ADD COLUMN "unlockReason" TEXT,
  ADD COLUMN "unlockedByUserId" TEXT;

ALTER TABLE "InPersonTrainingParticipant" ADD COLUMN "personnelCode" TEXT;
ALTER TABLE "TrainingExam" ADD COLUMN "publishedAt" TIMESTAMP(3), ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "TrainingCertificate" ADD COLUMN "snapshot" JSONB;

CREATE TABLE "TrainingCertificateSignatory" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "jobTitle" TEXT NOT NULL,
  "signatureUrl" TEXT,
  "stampUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingCertificateSignatory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingCertificateTemplateSignatory" (
  "templateId" TEXT NOT NULL,
  "signatoryId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "position" JSONB,
  CONSTRAINT "TrainingCertificateTemplateSignatory_pkey" PRIMARY KEY ("templateId", "signatoryId")
);

CREATE TABLE "TrainingCourseAudit" (
  "id" TEXT NOT NULL,
  "trainingId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "reason" TEXT,
  "changes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrainingCourseAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TrainingCourseAudit_trainingId_createdAt_idx" ON "TrainingCourseAudit"("trainingId", "createdAt");
ALTER TABLE "InPersonTraining" ADD CONSTRAINT "InPersonTraining_certificateTemplateId_fkey" FOREIGN KEY ("certificateTemplateId") REFERENCES "TrainingCertificateTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InPersonTraining" ADD CONSTRAINT "InPersonTraining_unlockedByUserId_fkey" FOREIGN KEY ("unlockedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainingCertificateTemplateSignatory" ADD CONSTRAINT "TrainingCertificateTemplateSignatory_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TrainingCertificateTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingCertificateTemplateSignatory" ADD CONSTRAINT "TrainingCertificateTemplateSignatory_signatoryId_fkey" FOREIGN KEY ("signatoryId") REFERENCES "TrainingCertificateSignatory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingCourseAudit" ADD CONSTRAINT "TrainingCourseAudit_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "InPersonTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingCourseAudit" ADD CONSTRAINT "TrainingCourseAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Permission" ("id", "name", "title")
VALUES ('permission_training_course_override', 'training.course.override', 'بازکردن قفل و ویرایش اضطراری دوره آموزش')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "Role" r CROSS JOIN "Permission" p
WHERE p."name" = 'training.course.override'
  AND (LOWER(r."name") IN ('admin', 'superadmin', 'super-admin') OR r."title" IN ('مدیر سیستم', 'مدیر ارشد'))
ON CONFLICT DO NOTHING;
