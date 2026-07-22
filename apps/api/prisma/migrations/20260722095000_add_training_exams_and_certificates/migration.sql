CREATE TYPE "TrainingExamQuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_TEXT');
CREATE TYPE "TrainingExamAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'EXPIRED');
CREATE TYPE "TrainingCertificateSource" AS ENUM ('GENERATED', 'MANUAL_UPLOAD');

CREATE TABLE "TrainingExam" (
  "id" TEXT NOT NULL,
  "trainingId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "passingScore" DOUBLE PRECISION NOT NULL DEFAULT 60,
  "durationMinutes" INTEGER,
  "maxAttempts" INTEGER NOT NULL DEFAULT 1,
  "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
  "showResultImmediately" BOOLEAN NOT NULL DEFAULT true,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingExam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingExamQuestion" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "type" "TrainingExamQuestionType" NOT NULL DEFAULT 'SINGLE_CHOICE',
  "title" TEXT NOT NULL,
  "description" TEXT,
  "options" JSONB,
  "correctAnswer" JSONB,
  "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingExamQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingExamAttempt" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "status" "TrainingExamAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "answers" JSONB,
  "score" DOUBLE PRECISION,
  "maxScore" DOUBLE PRECISION,
  "passed" BOOLEAN,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "gradedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingExamAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingCertificateTemplate" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "backgroundUrl" TEXT,
  "layout" JSONB NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingCertificateTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingCertificate" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "templateId" TEXT,
  "certificateNumber" TEXT NOT NULL,
  "title" TEXT,
  "source" "TrainingCertificateSource" NOT NULL DEFAULT 'GENERATED',
  "fileUrl" TEXT,
  "mimeType" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingCertificate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrainingExam_trainingId_key" ON "TrainingExam"("trainingId");
CREATE INDEX "TrainingExamQuestion_examId_sortOrder_idx" ON "TrainingExamQuestion"("examId", "sortOrder");
CREATE UNIQUE INDEX "TrainingExamAttempt_examId_participantId_attemptNumber_key" ON "TrainingExamAttempt"("examId", "participantId", "attemptNumber");
CREATE INDEX "TrainingExamAttempt_participantId_createdAt_idx" ON "TrainingExamAttempt"("participantId", "createdAt");
CREATE UNIQUE INDEX "TrainingCertificate_certificateNumber_key" ON "TrainingCertificate"("certificateNumber");
CREATE INDEX "TrainingCertificate_participantId_issuedAt_idx" ON "TrainingCertificate"("participantId", "issuedAt");
CREATE INDEX "TrainingCertificate_templateId_idx" ON "TrainingCertificate"("templateId");

ALTER TABLE "TrainingExam" ADD CONSTRAINT "TrainingExam_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "InPersonTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingExamQuestion" ADD CONSTRAINT "TrainingExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "TrainingExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingExamAttempt" ADD CONSTRAINT "TrainingExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "TrainingExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingExamAttempt" ADD CONSTRAINT "TrainingExamAttempt_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "InPersonTrainingParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingCertificate" ADD CONSTRAINT "TrainingCertificate_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "InPersonTrainingParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingCertificate" ADD CONSTRAINT "TrainingCertificate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TrainingCertificateTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "TrainingCertificateTemplate" ("id", "title", "description", "layout", "isDefault", "isActive", "createdAt", "updatedAt") VALUES
('training-certificate-classic', 'قالب کلاسیک سازمانی', 'قالب رسمی ساده برای دوره‌های سازمانی', '{"theme":"classic","primaryColor":"#0e7490","accentColor":"#d4af37","orientation":"landscape","showLogo":true,"showCertificateNumber":true}'::jsonb, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('training-certificate-modern', 'قالب مدرن', 'قالب مدرن با تمرکز بر عنوان دوره', '{"theme":"modern","primaryColor":"#0f172a","accentColor":"#22d3ee","orientation":"landscape","showLogo":true,"showCertificateNumber":true}'::jsonb, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('training-certificate-minimal', 'قالب مینیمال', 'قالب روشن و مینیمال', '{"theme":"minimal","primaryColor":"#334155","accentColor":"#10b981","orientation":"landscape","showLogo":true,"showCertificateNumber":true}'::jsonb, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
