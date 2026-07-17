CREATE TABLE "public"."NotificationRule" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "moduleKey" TEXT,
    "portalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "teamsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailTemplateId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationRule_eventKey_key" ON "public"."NotificationRule"("eventKey");

ALTER TABLE "public"."NotificationRule"
ADD CONSTRAINT "NotificationRule_emailTemplateId_fkey"
FOREIGN KEY ("emailTemplateId")
REFERENCES "public"."NotificationTemplate"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

INSERT INTO "public"."NotificationRule" (
  "id",
  "eventKey",
  "title",
  "description",
  "moduleKey",
  "portalEnabled",
  "emailEnabled",
  "emailTemplateId",
  "priority",
  "isActive",
  "updatedAt"
)
VALUES
(
  'rule_announcement_published',
  'announcement.published',
  'انتشار اطلاعیه',
  'هنگام انتشار اطلاعیه جدید',
  'announcements',
  true,
  false,
  (SELECT "id" FROM "public"."NotificationTemplate" WHERE "key" = 'announcement-published' LIMIT 1),
  50,
  true,
  CURRENT_TIMESTAMP
),
(
  'rule_meeting_invite',
  'meeting.invite',
  'دعوت به جلسه',
  'هنگام ایجاد جلسه و دعوت اعضا',
  'meetings',
  true,
  true,
  (SELECT "id" FROM "public"."NotificationTemplate" WHERE "key" = 'meeting-invite' LIMIT 1),
  20,
  true,
  CURRENT_TIMESTAMP
),
(
  'rule_meeting_update',
  'meeting.update',
  'به‌روزرسانی جلسه',
  'هنگام ویرایش اعضا یا اطلاعات جلسه',
  'meetings',
  true,
  true,
  (SELECT "id" FROM "public"."NotificationTemplate" WHERE "key" = 'meeting-invite' LIMIT 1),
  30,
  true,
  CURRENT_TIMESTAMP
),
(
  'rule_workspace_reminder',
  'workspace.reminder',
  'یادآوری شخصی',
  'هنگام رسیدن زمان یادآوری کاربر',
  'workspace',
  true,
  false,
  (SELECT "id" FROM "public"."NotificationTemplate" WHERE "key" = 'general-message' LIMIT 1),
  40,
  true,
  CURRENT_TIMESTAMP
),
(
  'rule_workspace_task',
  'workspace.task',
  'یادآوری تسک',
  'هنگام رسیدن موعد تسک کاربر',
  'workspace',
  true,
  false,
  (SELECT "id" FROM "public"."NotificationTemplate" WHERE "key" = 'general-message' LIMIT 1),
  40,
  true,
  CURRENT_TIMESTAMP
),
(
  'rule_backup_result',
  'backup.result',
  'نتیجه بکاپ',
  'هنگام موفق یا ناموفق شدن بکاپ دستی و خودکار',
  'backup-center',
  false,
  true,
  (SELECT "id" FROM "public"."NotificationTemplate" WHERE "key" = 'backup-success' LIMIT 1),
  15,
  true,
  CURRENT_TIMESTAMP
);
