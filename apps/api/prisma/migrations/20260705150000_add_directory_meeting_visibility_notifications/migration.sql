CREATE TYPE "public"."MeetingVisibility" AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE "public"."NotificationType" AS ENUM ('MEETING_INVITE', 'MEETING_UPDATE', 'REMINDER', 'TASK');

CREATE TABLE "public"."DirectoryUser" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "email" TEXT,
  "department" TEXT,
  "title" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DirectoryUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."DirectoryGroup" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DirectoryGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."DirectoryGroupMember" (
  "groupId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,

  CONSTRAINT "DirectoryGroupMember_pkey" PRIMARY KEY ("groupId","userId")
);

CREATE TABLE "public"."PortalNotification" (
  "id" TEXT NOT NULL,
  "type" "public"."NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "recipientDirectoryUserId" TEXT,
  "recipientEmail" TEXT,
  "meetingId" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PortalNotification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."Meeting"
ADD COLUMN "visibility" "public"."MeetingVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "organizerDirectoryUserId" TEXT;

ALTER TABLE "public"."MeetingParticipant"
ADD COLUMN "directoryUserId" TEXT;

CREATE UNIQUE INDEX "DirectoryUser_username_key" ON "public"."DirectoryUser"("username");
CREATE UNIQUE INDEX "DirectoryGroup_name_key" ON "public"."DirectoryGroup"("name");

ALTER TABLE "public"."DirectoryGroupMember"
ADD CONSTRAINT "DirectoryGroupMember_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "public"."DirectoryGroup"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."DirectoryGroupMember"
ADD CONSTRAINT "DirectoryGroupMember_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."DirectoryUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."Meeting"
ADD CONSTRAINT "Meeting_organizerDirectoryUserId_fkey"
FOREIGN KEY ("organizerDirectoryUserId") REFERENCES "public"."DirectoryUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."MeetingParticipant"
ADD CONSTRAINT "MeetingParticipant_directoryUserId_fkey"
FOREIGN KEY ("directoryUserId") REFERENCES "public"."DirectoryUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."PortalNotification"
ADD CONSTRAINT "PortalNotification_recipientDirectoryUserId_fkey"
FOREIGN KEY ("recipientDirectoryUserId") REFERENCES "public"."DirectoryUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."PortalNotification"
ADD CONSTRAINT "PortalNotification_meetingId_fkey"
FOREIGN KEY ("meetingId") REFERENCES "public"."Meeting"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
