CREATE TYPE "public"."BackupRestoreStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

CREATE TABLE "public"."BackupRestoreJob" (
    "id" TEXT NOT NULL,
    "backupId" TEXT NOT NULL,
    "emergencyBackupId" TEXT,
    "status" "public"."BackupRestoreStatus" NOT NULL DEFAULT 'PENDING',
    "restoreDatabase" BOOLEAN NOT NULL DEFAULT true,
    "restoreUploads" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupRestoreJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BackupRestoreJob_backupId_idx" ON "public"."BackupRestoreJob"("backupId");
CREATE INDEX "BackupRestoreJob_status_idx" ON "public"."BackupRestoreJob"("status");

ALTER TABLE "public"."BackupRestoreJob"
ADD CONSTRAINT "BackupRestoreJob_backupId_fkey"
FOREIGN KEY ("backupId")
REFERENCES "public"."BackupJob"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
