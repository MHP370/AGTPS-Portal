-- CreateEnum
CREATE TYPE "public"."NotificationSmtpEncryption" AS ENUM ('NONE', 'SSL', 'TLS', 'STARTTLS');

-- CreateEnum
CREATE TYPE "public"."NotificationQueueStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED', 'RETRY', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."NotificationTemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."NotificationTemplateCategory" AS ENUM ('WELCOME', 'PASSWORD_RESET', 'ANNOUNCEMENTS', 'TRAINING', 'CALENDAR', 'MEETINGS', 'POLLS', 'SURVEYS', 'CEO_MESSAGES', 'ASSETS', 'MAINTENANCE', 'INVENTORY', 'LICENSES', 'WARRANTY', 'SYSTEM_ALERTS', 'BACKUPS', 'GENERAL');

-- CreateTable
CREATE TABLE "public"."NotificationSmtpServer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "senderName" TEXT,
    "senderEmail" TEXT NOT NULL,
    "replyTo" TEXT,
    "encryption" "public"."NotificationSmtpEncryption" NOT NULL DEFAULT 'STARTTLS',
    "timeoutMs" INTEGER NOT NULL DEFAULT 10000,
    "maxRetry" INTEGER NOT NULL DEFAULT 3,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "lastTestStatus" TEXT,
    "lastTestError" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSmtpServer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "public"."NotificationTemplateCategory" NOT NULL,
    "status" "public"."NotificationTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "variables" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationEmailQueue" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "templateId" TEXT,
    "smtpServerId" TEXT,
    "status" "public"."NotificationQueueStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetry" INTEGER NOT NULL DEFAULT 3,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "scheduledAt" TIMESTAMP(3),
    "sendingAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "messageId" TEXT,
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationEmailQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_key_key" ON "public"."NotificationTemplate"("key");

-- CreateIndex
CREATE INDEX "NotificationEmailQueue_status_scheduledAt_priority_idx" ON "public"."NotificationEmailQueue"("status", "scheduledAt", "priority");

-- AddForeignKey
ALTER TABLE "public"."NotificationEmailQueue" ADD CONSTRAINT "NotificationEmailQueue_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationEmailQueue" ADD CONSTRAINT "NotificationEmailQueue_smtpServerId_fkey" FOREIGN KEY ("smtpServerId") REFERENCES "public"."NotificationSmtpServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "public"."Permission" ("id", "name", "title")
VALUES
  ('perm_notification_view', 'notification.view', 'View Notification Center'),
  ('perm_notification_manage', 'notification.manage', 'Manage Notification Center'),
  ('perm_notification_templates_manage', 'notification.templates.manage', 'Manage Notification Templates'),
  ('perm_notification_smtp_manage', 'notification.smtp.manage', 'Manage Notification SMTP'),
  ('perm_notification_reports_view', 'notification.reports.view', 'View Notification Reports')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "public"."RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "public"."Role" r
CROSS JOIN "public"."Permission" p
WHERE r."name" = 'admin'
  AND p."name" IN (
    'notification.view',
    'notification.manage',
    'notification.templates.manage',
    'notification.smtp.manage',
    'notification.reports.view'
  )
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
  'module_notification_center',
  'notification-center',
  'مرکز اعلان‌ها',
  'مدیریت SMTP، صف ارسال ایمیل، قالب‌ها و تاریخچه اعلان‌ها',
  'BellRing',
  '/admin/notifications',
  'notification.view',
  false,
  true,
  true,
  95,
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
