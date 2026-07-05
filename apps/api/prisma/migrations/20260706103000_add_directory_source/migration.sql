CREATE TYPE "public"."DirectorySource" AS ENUM ('INTERNAL', 'ACTIVE_DIRECTORY');

ALTER TABLE "public"."DirectoryUser"
ADD COLUMN "source" "public"."DirectorySource" NOT NULL DEFAULT 'INTERNAL';

ALTER TABLE "public"."DirectoryGroup"
ADD COLUMN "source" "public"."DirectorySource" NOT NULL DEFAULT 'INTERNAL';
