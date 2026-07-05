CREATE TYPE "public"."MeetingStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'DONE');
CREATE TYPE "public"."TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

CREATE TABLE "public"."Meeting" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "location" TEXT,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3),
  "status" "public"."MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "organizerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."MeetingParticipant" (
  "id" TEXT NOT NULL,
  "meetingId" TEXT NOT NULL,
  "userId" TEXT,
  "displayName" TEXT NOT NULL,
  "email" TEXT,
  "notificationSent" BOOLEAN NOT NULL DEFAULT false,
  "responseStatus" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."PortalNote" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "color" TEXT,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PortalNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."PortalReminder" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "remindAt" TIMESTAMP(3) NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PortalReminder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."PortalTask" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" TIMESTAMP(3),
  "status" "public"."TaskStatus" NOT NULL DEFAULT 'TODO',
  "priority" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PortalTask_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."Meeting"
ADD CONSTRAINT "Meeting_organizerId_fkey"
FOREIGN KEY ("organizerId") REFERENCES "public"."User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."MeetingParticipant"
ADD CONSTRAINT "MeetingParticipant_meetingId_fkey"
FOREIGN KEY ("meetingId") REFERENCES "public"."Meeting"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."MeetingParticipant"
ADD CONSTRAINT "MeetingParticipant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."PortalNote"
ADD CONSTRAINT "PortalNote_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."PortalReminder"
ADD CONSTRAINT "PortalReminder_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."PortalTask"
ADD CONSTRAINT "PortalTask_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
