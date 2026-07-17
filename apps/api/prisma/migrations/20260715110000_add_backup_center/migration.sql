-- CreateEnum
CREATE TYPE "public"."BackupType" AS ENUM ('DATABASE', 'FILES', 'FULL');

-- CreateEnum
CREATE TYPE "public"."BackupStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'DELETED');

-- CreateTable
CREATE TABLE "public"."BackupJob" (
    "id" TEXT NOT NULL,
    "type" "public"."BackupType" NOT NULL DEFAULT 'FULL',
    "status" "public"."BackupStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT,
    "filePath" TEXT,
    "fileSize" BIGINT,
    "includeDatabase" BOOLEAN NOT NULL DEFAULT true,
    "includeUploads" BOOLEAN NOT NULL DEFAULT true,
    "requestedByUserId" TEXT,
    "notifyEmail" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackupJob_status_createdAt_idx" ON "public"."BackupJob"("status", "createdAt");

INSERT INTO "public"."Permission" ("id", "name", "title")
VALUES
  ('perm_backup_view', 'backup.view', 'View Backups'),
  ('perm_backup_manage', 'backup.manage', 'Manage Backups')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "public"."RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "public"."Role" r
CROSS JOIN "public"."Permission" p
WHERE r."name" = 'admin'
  AND p."name" IN ('backup.view', 'backup.manage')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "public"."PortalModule" (
  "id",
  "key",
  "title",
  "description",
  "icon",
  "route",
  "permission",
  "isCore",
  "isInstalled",
  "isEnabled",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
VALUES (
  'module_backup_center',
  'backup-center',
  'مرکز بکاپ',
  'بکاپ دستی دیتابیس و فایل‌های مهم، دانلود امن و اعلان نتیجه بکاپ',
  'DatabaseBackup',
  '/admin/backups',
  'backup.view',
  false,
  true,
  true,
  96,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "route" = EXCLUDED."route",
  "permission" = EXCLUDED."permission",
  "updatedAt" = CURRENT_TIMESTAMP;
