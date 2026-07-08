ALTER TABLE "PortalNotification" ADD COLUMN "reminderId" TEXT;
ALTER TABLE "PortalNotification" ADD COLUMN "taskId" TEXT;

CREATE INDEX "PortalNotification_reminderId_idx" ON "PortalNotification"("reminderId");
CREATE INDEX "PortalNotification_taskId_idx" ON "PortalNotification"("taskId");

ALTER TABLE "PortalNotification" ADD CONSTRAINT "PortalNotification_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "PortalReminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortalNotification" ADD CONSTRAINT "PortalNotification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PortalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
