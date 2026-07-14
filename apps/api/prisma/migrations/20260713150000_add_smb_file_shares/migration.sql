CREATE TYPE "public"."SmbFileAuditAction" AS ENUM ('LIST', 'PREVIEW', 'DOWNLOAD', 'UPLOAD', 'DELETE');

CREATE TABLE "public"."SmbShare" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "rootPath" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "allowDownload" BOOLEAN NOT NULL DEFAULT true,
    "allowUpload" BOOLEAN NOT NULL DEFAULT false,
    "allowDelete" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmbShare_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."SmbShareUserAccess" (
    "shareId" TEXT NOT NULL,
    "directoryUserId" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT true,
    "canDownload" BOOLEAN NOT NULL DEFAULT true,
    "canUpload" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SmbShareUserAccess_pkey" PRIMARY KEY ("shareId","directoryUserId")
);

CREATE TABLE "public"."SmbShareGroupAccess" (
    "shareId" TEXT NOT NULL,
    "directoryGroupId" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT true,
    "canDownload" BOOLEAN NOT NULL DEFAULT true,
    "canUpload" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SmbShareGroupAccess_pkey" PRIMARY KEY ("shareId","directoryGroupId")
);

CREATE TABLE "public"."SmbFileAudit" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "public"."SmbFileAuditAction" NOT NULL,
    "path" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmbFileAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SmbShare_key_key" ON "public"."SmbShare"("key");

ALTER TABLE "public"."SmbShareUserAccess" ADD CONSTRAINT "SmbShareUserAccess_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "public"."SmbShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."SmbShareUserAccess" ADD CONSTRAINT "SmbShareUserAccess_directoryUserId_fkey" FOREIGN KEY ("directoryUserId") REFERENCES "public"."DirectoryUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."SmbShareGroupAccess" ADD CONSTRAINT "SmbShareGroupAccess_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "public"."SmbShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."SmbShareGroupAccess" ADD CONSTRAINT "SmbShareGroupAccess_directoryGroupId_fkey" FOREIGN KEY ("directoryGroupId") REFERENCES "public"."DirectoryGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."SmbFileAudit" ADD CONSTRAINT "SmbFileAudit_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "public"."SmbShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."SmbFileAudit" ADD CONSTRAINT "SmbFileAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
