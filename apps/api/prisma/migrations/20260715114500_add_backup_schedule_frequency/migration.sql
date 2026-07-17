CREATE TYPE "public"."BackupScheduleFrequency" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY');

ALTER TABLE "public"."BackupSetting"
ADD COLUMN "frequency" "public"."BackupScheduleFrequency" NOT NULL DEFAULT 'DAILY',
ADD COLUMN "weeklyDayOfWeek" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN "monthlyDayOfMonth" INTEGER NOT NULL DEFAULT 1;
