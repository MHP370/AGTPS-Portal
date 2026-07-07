CREATE TYPE "TrainingProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE "TrainingProgress" (
    "id" TEXT NOT NULL,
    "trainingItemId" TEXT NOT NULL,
    "userId" TEXT,
    "directoryUserId" TEXT,
    "visitorKey" TEXT,
    "status" "TrainingProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "lastPositionSeconds" INTEGER,
    "durationSeconds" INTEGER,
    "lastFileUrl" TEXT,
    "completedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrainingProgress_trainingItemId_visitorKey_key" ON "TrainingProgress"("trainingItemId", "visitorKey");
CREATE INDEX "TrainingProgress_trainingItemId_idx" ON "TrainingProgress"("trainingItemId");
CREATE INDEX "TrainingProgress_userId_idx" ON "TrainingProgress"("userId");
CREATE INDEX "TrainingProgress_directoryUserId_idx" ON "TrainingProgress"("directoryUserId");

ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_trainingItemId_fkey" FOREIGN KEY ("trainingItemId") REFERENCES "TrainingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_directoryUserId_fkey" FOREIGN KEY ("directoryUserId") REFERENCES "DirectoryUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
