ALTER TYPE "public"."AuditAction" ADD VALUE IF NOT EXISTS 'DIRECT_CONVERSATION_CREATED';
ALTER TYPE "public"."AuditAction" ADD VALUE IF NOT EXISTS 'DIRECT_CONVERSATION_OPENED';
ALTER TYPE "public"."AuditAction" ADD VALUE IF NOT EXISTS 'DIRECT_CONVERSATION_REPLIED';
ALTER TYPE "public"."AuditAction" ADD VALUE IF NOT EXISTS 'DIRECT_CONVERSATION_STATUS_CHANGED';

CREATE TYPE "public"."DirectCommunicationMode" AS ENUM ('NORMAL', 'CONFIDENTIAL', 'ANONYMOUS');
CREATE TYPE "public"."DirectCommunicationCategory" AS ENUM ('SUGGESTION', 'COMPLAINT', 'VIOLATION_REPORT', 'IMPROVEMENT_IDEA', 'REQUEST', 'CONFIDENTIAL_REPORT', 'GENERAL_MESSAGE');
CREATE TYPE "public"."DirectCommunicationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "public"."DirectCommunicationStatus" AS ENUM ('OPEN', 'RESOLVED', 'ARCHIVED', 'CLOSED');
CREATE TYPE "public"."DirectCommunicationSenderType" AS ENUM ('EMPLOYEE', 'MANAGER', 'SYSTEM');

CREATE TABLE "public"."DirectCommunicationConversation" (
  "id" TEXT NOT NULL,
  "managerId" TEXT NOT NULL,
  "mode" "public"."DirectCommunicationMode" NOT NULL DEFAULT 'NORMAL',
  "category" "public"."DirectCommunicationCategory" NOT NULL DEFAULT 'GENERAL_MESSAGE',
  "priority" "public"."DirectCommunicationPriority" NOT NULL DEFAULT 'NORMAL',
  "status" "public"."DirectCommunicationStatus" NOT NULL DEFAULT 'OPEN',
  "subject" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "anonymousTokenHash" TEXT,
  "senderUserId" TEXT,
  "senderDirectoryUserId" TEXT,
  "senderDisplayName" TEXT,
  "isReadByManager" BOOLEAN NOT NULL DEFAULT false,
  "lastMessageAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DirectCommunicationConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."DirectCommunicationMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderType" "public"."DirectCommunicationSenderType" NOT NULL,
  "senderUserId" TEXT,
  "senderDirectoryUserId" TEXT,
  "encryptedPayload" TEXT NOT NULL,
  "encryptionVersion" TEXT NOT NULL DEFAULT 'placeholder-v1',
  "attachments" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DirectCommunicationMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DirectCommunicationConversation_anonymousTokenHash_key" ON "public"."DirectCommunicationConversation"("anonymousTokenHash");
CREATE INDEX "DirectCommunicationConversation_managerId_idx" ON "public"."DirectCommunicationConversation"("managerId");
CREATE INDEX "DirectCommunicationConversation_mode_idx" ON "public"."DirectCommunicationConversation"("mode");
CREATE INDEX "DirectCommunicationConversation_category_idx" ON "public"."DirectCommunicationConversation"("category");
CREATE INDEX "DirectCommunicationConversation_priority_idx" ON "public"."DirectCommunicationConversation"("priority");
CREATE INDEX "DirectCommunicationConversation_status_idx" ON "public"."DirectCommunicationConversation"("status");
CREATE INDEX "DirectCommunicationConversation_createdAt_idx" ON "public"."DirectCommunicationConversation"("createdAt");
CREATE INDEX "DirectCommunicationMessage_conversationId_idx" ON "public"."DirectCommunicationMessage"("conversationId");
CREATE INDEX "DirectCommunicationMessage_senderType_idx" ON "public"."DirectCommunicationMessage"("senderType");
CREATE INDEX "DirectCommunicationMessage_createdAt_idx" ON "public"."DirectCommunicationMessage"("createdAt");

ALTER TABLE "public"."DirectCommunicationConversation"
ADD CONSTRAINT "DirectCommunicationConversation_managerId_fkey"
FOREIGN KEY ("managerId") REFERENCES "public"."DirectCommunicationManager"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."DirectCommunicationConversation"
ADD CONSTRAINT "DirectCommunicationConversation_senderUserId_fkey"
FOREIGN KEY ("senderUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."DirectCommunicationConversation"
ADD CONSTRAINT "DirectCommunicationConversation_senderDirectoryUserId_fkey"
FOREIGN KEY ("senderDirectoryUserId") REFERENCES "public"."DirectoryUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."DirectCommunicationMessage"
ADD CONSTRAINT "DirectCommunicationMessage_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "public"."DirectCommunicationConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."DirectCommunicationMessage"
ADD CONSTRAINT "DirectCommunicationMessage_senderUserId_fkey"
FOREIGN KEY ("senderUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."DirectCommunicationMessage"
ADD CONSTRAINT "DirectCommunicationMessage_senderDirectoryUserId_fkey"
FOREIGN KEY ("senderDirectoryUserId") REFERENCES "public"."DirectoryUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
