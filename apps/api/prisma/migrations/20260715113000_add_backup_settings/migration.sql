CREATE TABLE "public"."BackupSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "autoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleTime" TEXT NOT NULL DEFAULT '02:00',
    "type" "public"."BackupType" NOT NULL DEFAULT 'FULL',
    "includeDatabase" BOOLEAN NOT NULL DEFAULT true,
    "includeUploads" BOOLEAN NOT NULL DEFAULT true,
    "retentionCount" INTEGER NOT NULL DEFAULT 10,
    "notifyEmails" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSetting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "public"."BackupSetting" (
  "id",
  "autoEnabled",
  "scheduleTime",
  "type",
  "includeDatabase",
  "includeUploads",
  "retentionCount",
  "createdAt",
  "updatedAt"
)
VALUES (
  1,
  false,
  '02:00',
  'FULL',
  true,
  true,
  10,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
