ALTER TABLE "SmbShare"
  ADD COLUMN "sharedUsername" TEXT,
  ADD COLUMN "sharedPassword" TEXT;

ALTER TABLE "TrainingSource"
  ADD COLUMN "syncIntervalMinutes" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "uploadDirectory" TEXT NOT NULL DEFAULT '_PortalUploads';

ALTER TABLE "TrainingItem"
  ADD COLUMN "standaloneSubfolders" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "TrainingFile"
  ADD COLUMN "sourcePath" TEXT;
