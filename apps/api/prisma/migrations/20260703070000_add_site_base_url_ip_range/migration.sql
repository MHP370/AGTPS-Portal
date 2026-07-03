-- Add site network fields for multi-site application routing
ALTER TABLE "Site" ADD COLUMN "baseUrl" TEXT;
ALTER TABLE "Site" ADD COLUMN "ipRange" TEXT;
