/*
  Warnings:

  - You are about to drop the column `siteId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Application` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categoryId` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'OFFLINE', 'DISABLED');

-- CreateEnum
CREATE TYPE "public"."NetworkType" AS ENUM ('INTERNET', 'INTRANET', 'VPN');

-- DropForeignKey
ALTER TABLE "public"."Application" DROP CONSTRAINT "Application_siteId_fkey";

-- AlterTable
ALTER TABLE "public"."Application" DROP COLUMN "siteId",
DROP COLUMN "url",
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "guideUrl" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isNew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "networkType" "public"."NetworkType" NOT NULL DEFAULT 'INTRANET',
ADD COLUMN     "openInNewTab" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "owner" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "supportDepartment" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" TEXT;

-- CreateTable
CREATE TABLE "public"."ApplicationCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApplicationSite" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationSite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationCategory_slug_key" ON "public"."ApplicationCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationSite_applicationId_siteId_key" ON "public"."ApplicationSite"("applicationId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_key_key" ON "public"."Application"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Application_slug_key" ON "public"."Application"("slug");

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ApplicationCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApplicationSite" ADD CONSTRAINT "ApplicationSite_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApplicationSite" ADD CONSTRAINT "ApplicationSite_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
