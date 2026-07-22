ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TRAINING';
ALTER TYPE "InPersonTrainingStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TABLE "InPersonTraining" ADD COLUMN "notificationReminderMinutes" INTEGER[] NOT NULL DEFAULT ARRAY[1440, 60]::INTEGER[];
ALTER TABLE "PortalNotification" ADD COLUMN "trainingId" TEXT;
ALTER TABLE "PortalNotification" ADD COLUMN "eventKey" TEXT;
ALTER TABLE "PortalNotification" ADD COLUMN "targetUrl" TEXT;
CREATE INDEX "PortalNotification_trainingId_eventKey_idx" ON "PortalNotification"("trainingId", "eventKey");
ALTER TABLE "PortalNotification" ADD CONSTRAINT "PortalNotification_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "InPersonTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;
