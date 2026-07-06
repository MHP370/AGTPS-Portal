CREATE TABLE "TrainingFile" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SMB',
    "basePath" TEXT NOT NULL,
    "description" TEXT,
    "username" TEXT,
    "password" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSource_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TrainingFile" ADD CONSTRAINT "TrainingFile_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "TrainingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
