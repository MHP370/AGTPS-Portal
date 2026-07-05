ALTER TABLE "public"."Setting"
ADD COLUMN "activeDirectoryEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "activeDirectoryUrl" TEXT,
ADD COLUMN "activeDirectoryDomain" TEXT,
ADD COLUMN "activeDirectoryBaseDn" TEXT,
ADD COLUMN "activeDirectoryBindDn" TEXT,
ADD COLUMN "activeDirectoryBindPassword" TEXT,
ADD COLUMN "activeDirectoryUserSearchBase" TEXT,
ADD COLUMN "activeDirectoryGroupSearchBase" TEXT,
ADD COLUMN "activeDirectoryLastStatus" TEXT,
ADD COLUMN "activeDirectoryLastError" TEXT,
ADD COLUMN "activeDirectoryLastCheckedAt" TIMESTAMP(3);
