CREATE TYPE "TrainingContentType" AS ENUM ('VIDEO', 'PDF', 'DOCUMENT', 'SPREADSHEET', 'PRESENTATION', 'IMAGE', 'LINK', 'ATTACHMENT');

CREATE TYPE "TrainingPublishStatus" AS ENUM ('NEEDS_REVIEW', 'DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "TrainingCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "contentType" "TrainingContentType" NOT NULL DEFAULT 'VIDEO',
    "sourceType" TEXT NOT NULL DEFAULT 'PORTAL_UPLOAD',
    "sourcePath" TEXT,
    "fileUrl" TEXT,
    "externalUrl" TEXT,
    "thumbnail" TEXT,
    "instructor" TEXT,
    "department" TEXT,
    "level" TEXT,
    "durationMinutes" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "status" "TrainingPublishStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrainingCategory_slug_key" ON "TrainingCategory"("slug");

CREATE UNIQUE INDEX "TrainingItem_slug_key" ON "TrainingItem"("slug");

ALTER TABLE "TrainingItem" ADD CONSTRAINT "TrainingItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TrainingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
