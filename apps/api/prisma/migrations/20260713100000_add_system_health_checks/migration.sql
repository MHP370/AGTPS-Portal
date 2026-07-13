-- CreateEnum
CREATE TYPE "public"."SystemHealthCheckType" AS ENUM ('MANUAL', 'HTTP', 'TCP', 'PING', 'SMB');

-- CreateEnum
CREATE TYPE "public"."SystemHealthState" AS ENUM ('UNKNOWN', 'UP', 'DEGRADED', 'DOWN');

-- AlterTable
ALTER TABLE "public"."SystemStatus"
ADD COLUMN     "checkType" "public"."SystemHealthCheckType" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "expectedKeyword" TEXT,
ADD COLUMN     "expectedStatusCodes" TEXT NOT NULL DEFAULT '200-399',
ADD COLUMN     "intervalSeconds" INTEGER NOT NULL DEFAULT 300,
ADD COLUMN     "lastCheckedAt" TIMESTAMP(3),
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lastHealthState" "public"."SystemHealthState" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "lastResponseTimeMs" INTEGER,
ADD COLUMN     "method" TEXT NOT NULL DEFAULT 'GET',
ADD COLUMN     "nextCheckAt" TIMESTAMP(3),
ADD COLUMN     "target" TEXT,
ADD COLUMN     "timeoutMs" INTEGER NOT NULL DEFAULT 5000;

-- CreateIndex
CREATE INDEX "SystemStatus_checkType_isActive_nextCheckAt_idx" ON "public"."SystemStatus"("checkType", "isActive", "nextCheckAt");
