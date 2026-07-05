ALTER TABLE "public"."PortalReminder"
ADD COLUMN "notifyBeforeMinutes" INTEGER;

ALTER TABLE "public"."PortalTask"
ADD COLUMN "notifyBeforeMinutes" INTEGER;
