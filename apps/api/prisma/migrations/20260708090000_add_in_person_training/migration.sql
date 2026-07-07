-- CreateEnum
CREATE TYPE "InPersonTrainingStatus" AS ENUM ('PLANNED', 'OPEN', 'CLOSED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InPersonAttendanceStatus" AS ENUM ('REGISTERED', 'ATTENDED', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "InPersonTrainingResult" AS ENUM ('PASSED', 'FAILED', 'NO_EXAM');

-- CreateTable
CREATE TABLE "InPersonTraining" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT,
    "instructorName" TEXT,
    "organizerDepartment" TEXT,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "durationHours" DOUBLE PRECISION,
    "hasExam" BOOLEAN NOT NULL DEFAULT false,
    "hasCertificate" BOOLEAN NOT NULL DEFAULT false,
    "status" "InPersonTrainingStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InPersonTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InPersonTrainingParticipant" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "userId" TEXT,
    "directoryUserId" TEXT,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "attendanceStatus" "InPersonAttendanceStatus" NOT NULL DEFAULT 'REGISTERED',
    "score" DOUBLE PRECISION,
    "result" "InPersonTrainingResult" NOT NULL DEFAULT 'NO_EXAM',
    "certificateNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InPersonTrainingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InPersonTraining_categoryId_idx" ON "InPersonTraining"("categoryId");

-- CreateIndex
CREATE INDEX "InPersonTraining_startDate_idx" ON "InPersonTraining"("startDate");

-- CreateIndex
CREATE INDEX "InPersonTraining_status_idx" ON "InPersonTraining"("status");

-- CreateIndex
CREATE INDEX "InPersonTrainingParticipant_trainingId_idx" ON "InPersonTrainingParticipant"("trainingId");

-- CreateIndex
CREATE INDEX "InPersonTrainingParticipant_userId_idx" ON "InPersonTrainingParticipant"("userId");

-- CreateIndex
CREATE INDEX "InPersonTrainingParticipant_directoryUserId_idx" ON "InPersonTrainingParticipant"("directoryUserId");

-- CreateIndex
CREATE INDEX "InPersonTrainingParticipant_attendanceStatus_idx" ON "InPersonTrainingParticipant"("attendanceStatus");

-- CreateIndex
CREATE INDEX "InPersonTrainingParticipant_result_idx" ON "InPersonTrainingParticipant"("result");

-- AddForeignKey
ALTER TABLE "InPersonTraining" ADD CONSTRAINT "InPersonTraining_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TrainingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InPersonTrainingParticipant" ADD CONSTRAINT "InPersonTrainingParticipant_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "InPersonTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InPersonTrainingParticipant" ADD CONSTRAINT "InPersonTrainingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InPersonTrainingParticipant" ADD CONSTRAINT "InPersonTrainingParticipant_directoryUserId_fkey" FOREIGN KEY ("directoryUserId") REFERENCES "DirectoryUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
