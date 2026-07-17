CREATE TYPE "public"."AuditAction" AS ENUM (
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'USER_UPDATED',
  'PASSWORD_CHANGED',
  'BACKUP_CREATED',
  'BACKUP_DELETED',
  'BACKUP_RESTORED',
  'NOTIFICATION_RULE_UPDATED',
  'DIRECT_MANAGER_CREATED',
  'DIRECT_MANAGER_UPDATED',
  'DIRECT_MANAGER_DELETED',
  'FORBIDDEN_WORD_CREATED',
  'FORBIDDEN_WORD_UPDATED',
  'FORBIDDEN_WORD_DELETED'
);

CREATE TABLE "public"."AuditLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorUsername" TEXT,
  "actorEmail" TEXT,
  "action" "public"."AuditAction" NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "summary" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."DirectCommunicationManager" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "department" TEXT,
  "description" TEXT,
  "isCeo" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "portalUserId" TEXT,
  "directoryUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DirectCommunicationManager_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."DirectCommunicationForbiddenWord" (
  "id" TEXT NOT NULL,
  "word" TEXT NOT NULL,
  "normalizedWord" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DirectCommunicationForbiddenWord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_action_idx" ON "public"."AuditLog"("action");
CREATE INDEX "AuditLog_entityType_idx" ON "public"."AuditLog"("entityType");
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");
CREATE INDEX "DirectCommunicationManager_isCeo_idx" ON "public"."DirectCommunicationManager"("isCeo");
CREATE INDEX "DirectCommunicationManager_isActive_idx" ON "public"."DirectCommunicationManager"("isActive");
CREATE UNIQUE INDEX "DirectCommunicationForbiddenWord_normalizedWord_key" ON "public"."DirectCommunicationForbiddenWord"("normalizedWord");
CREATE INDEX "DirectCommunicationForbiddenWord_isActive_idx" ON "public"."DirectCommunicationForbiddenWord"("isActive");

ALTER TABLE "public"."AuditLog"
ADD CONSTRAINT "AuditLog_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."DirectCommunicationManager"
ADD CONSTRAINT "DirectCommunicationManager_portalUserId_fkey"
FOREIGN KEY ("portalUserId") REFERENCES "public"."User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."DirectCommunicationManager"
ADD CONSTRAINT "DirectCommunicationManager_directoryUserId_fkey"
FOREIGN KEY ("directoryUserId") REFERENCES "public"."DirectoryUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "public"."Permission" ("id", "name", "title")
VALUES
  ('perm_audit_view', 'audit.view', 'View Audit Logs'),
  ('perm_ceo_messages_view', 'ceo.messages.view', 'View Direct Communication'),
  ('perm_ceo_messages_reply', 'ceo.messages.reply', 'Reply Direct Communication'),
  ('perm_ceo_messages_manage', 'ceo.messages.manage', 'Manage Direct Communication'),
  ('perm_ceo_settings_manage', 'ceo.settings.manage', 'Manage Direct Communication Settings')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "public"."RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "public"."Role" r
CROSS JOIN "public"."Permission" p
WHERE r."name" = 'admin'
  AND p."name" IN (
    'audit.view',
    'ceo.messages.view',
    'ceo.messages.reply',
    'ceo.messages.manage',
    'ceo.settings.manage'
  )
ON CONFLICT DO NOTHING;

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
  "updatedAt"
)
VALUES
(
  'module_direct_communication',
  'direct-communication',
  'ارتباط مستقیم مدیران',
  'تعریف مدیرعامل و مدیران بخش‌ها برای ارتباط مستقیم سازمانی',
  'MessageSquareLock',
  '/admin/direct-communication',
  'ceo.settings.manage',
  false,
  true,
  true,
  950,
  CURRENT_TIMESTAMP
),
(
  'module_audit_logs',
  'audit-logs',
  'گزارش رویدادها',
  'ثبت عملیات حساس مدیریتی و امنیتی بدون محتوای محرمانه',
  'ScrollText',
  '/admin/audit-logs',
  'audit.view',
  false,
  true,
  true,
  980,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "route" = EXCLUDED."route",
  "permission" = EXCLUDED."permission",
  "isInstalled" = true,
  "updatedAt" = CURRENT_TIMESTAMP;
