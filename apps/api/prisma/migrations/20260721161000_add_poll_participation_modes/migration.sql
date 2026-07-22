CREATE TYPE "PollSurveyParticipationMode" AS ENUM ('IDENTIFIED', 'ANONYMOUS_TRACKED', 'ANONYMOUS_FULL');

ALTER TABLE "PollSurvey"
ADD COLUMN "participationMode" "PollSurveyParticipationMode" NOT NULL DEFAULT 'IDENTIFIED';

UPDATE "PollSurvey"
SET "participationMode" = CASE
  WHEN "anonymous" = TRUE AND "participantVisibility" = TRUE THEN 'ANONYMOUS_TRACKED'::"PollSurveyParticipationMode"
  WHEN "anonymous" = TRUE THEN 'ANONYMOUS_FULL'::"PollSurveyParticipationMode"
  ELSE 'IDENTIFIED'::"PollSurveyParticipationMode"
END;

CREATE TABLE "PollSurveyParticipation" (
  "id" TEXT NOT NULL,
  "pollSurveyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "directoryUserId" TEXT,
  "participatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PollSurveyParticipation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PollSurveyParticipation_pollSurveyId_userId_key" ON "PollSurveyParticipation"("pollSurveyId", "userId");
CREATE INDEX "PollSurveyParticipation_pollSurveyId_idx" ON "PollSurveyParticipation"("pollSurveyId");
CREATE INDEX "PollSurveyParticipation_directoryUserId_idx" ON "PollSurveyParticipation"("directoryUserId");

ALTER TABLE "PollSurveyParticipation" ADD CONSTRAINT "PollSurveyParticipation_pollSurveyId_fkey" FOREIGN KEY ("pollSurveyId") REFERENCES "PollSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PollSurveyParticipation" ADD CONSTRAINT "PollSurveyParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PollSurveyParticipation" ADD CONSTRAINT "PollSurveyParticipation_directoryUserId_fkey" FOREIGN KEY ("directoryUserId") REFERENCES "DirectoryUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
