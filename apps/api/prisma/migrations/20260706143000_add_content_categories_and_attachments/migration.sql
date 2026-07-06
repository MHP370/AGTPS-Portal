ALTER TABLE "public"."News"
ADD COLUMN "category" TEXT,
ADD COLUMN "attachmentUrl" TEXT;

ALTER TABLE "public"."Announcement"
ADD COLUMN "category" TEXT,
ADD COLUMN "attachmentUrl" TEXT;
