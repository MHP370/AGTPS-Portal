ALTER TABLE "public"."User" ADD COLUMN "allowEmailChange" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "allowPasswordChange" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "allowProfileEdit" BOOLEAN NOT NULL DEFAULT true;
