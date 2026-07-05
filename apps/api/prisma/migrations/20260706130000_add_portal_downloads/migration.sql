CREATE TABLE "public"."PortalDownload" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "version" TEXT,
  "fileUrl" TEXT NOT NULL,
  "category" TEXT,
  "icon" TEXT,
  "color" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PortalDownload_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."PortalDownload"
ADD CONSTRAINT "PortalDownload_ownerId_fkey"
FOREIGN KEY ("ownerId")
REFERENCES "public"."User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
