ALTER TABLE "Setting"
ADD COLUMN IF NOT EXISTS "activeDirectorySyncIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS "activeDirectoryLastSyncedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "activeDirectoryLastSyncError" TEXT;

ALTER TABLE "Setting"
ADD CONSTRAINT "Setting_activeDirectorySyncIntervalMinutes_check"
CHECK ("activeDirectorySyncIntervalMinutes" BETWEEN 5 AND 10080);

