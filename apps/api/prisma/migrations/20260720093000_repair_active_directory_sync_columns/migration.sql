ALTER TABLE "DirectoryUser"
ADD COLUMN IF NOT EXISTS "externalId" TEXT,
ADD COLUMN IF NOT EXISTS "distinguishedName" TEXT,
ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP(3);

ALTER TABLE "DirectoryGroup"
ADD COLUMN IF NOT EXISTS "externalId" TEXT,
ADD COLUMN IF NOT EXISTS "distinguishedName" TEXT,
ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "DirectoryUser_externalId_key"
ON "DirectoryUser"("externalId");

CREATE UNIQUE INDEX IF NOT EXISTS "DirectoryGroup_externalId_key"
ON "DirectoryGroup"("externalId");

CREATE INDEX IF NOT EXISTS "DirectoryUser_source_isActive_idx"
ON "DirectoryUser"("source", "isActive");

CREATE INDEX IF NOT EXISTS "DirectoryGroup_source_isActive_idx"
ON "DirectoryGroup"("source", "isActive");
