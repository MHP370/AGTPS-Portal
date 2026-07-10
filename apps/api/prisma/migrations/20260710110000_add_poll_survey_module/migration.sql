-- CreateEnum
CREATE TYPE "PollSurveyType" AS ENUM ('POLL', 'SURVEY');

-- CreateEnum
CREATE TYPE "PollSurveyStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'RUNNING', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PollSurveyQuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT', 'PARAGRAPH', 'RATING', 'YES_NO', 'NUMBER', 'DATE', 'MATRIX');

-- CreateEnum
CREATE TYPE "PollSurveyResponseStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateTable
CREATE TABLE "PollSurvey" (
    "id" TEXT NOT NULL,
    "type" "PollSurveyType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowMultipleSelection" BOOLEAN NOT NULL DEFAULT false,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "popupEnforced" BOOLEAN NOT NULL DEFAULT false,
    "allowVoteEditing" BOOLEAN NOT NULL DEFAULT false,
    "deadline" TIMESTAMP(3),
    "publishDate" TIMESTAMP(3),
    "status" "PollSurveyStatus" NOT NULL DEFAULT 'DRAFT',
    "targetUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetDepartments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetAdGroupIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowResultViewing" BOOLEAN NOT NULL DEFAULT false,
    "allowParticipantCount" BOOLEAN NOT NULL DEFAULT true,
    "allowLiveResults" BOOLEAN NOT NULL DEFAULT false,
    "participantVisibility" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PollSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollSurveyQuestion" (
    "id" TEXT NOT NULL,
    "pollSurveyId" TEXT NOT NULL,
    "type" "PollSurveyQuestionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "settings" JSONB,
    "conditionQuestionId" TEXT,
    "conditionOperator" TEXT,
    "conditionValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PollSurveyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollSurveyOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PollSurveyOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollSurveyResponse" (
    "id" TEXT NOT NULL,
    "pollSurveyId" TEXT NOT NULL,
    "userId" TEXT,
    "directoryUserId" TEXT,
    "participantHash" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "PollSurveyResponseStatus" NOT NULL DEFAULT 'SUBMITTED',
    "draftData" JSONB,
    "timeSpentSeconds" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PollSurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollSurveyAnswer" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT,
    "optionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "textValue" TEXT,
    "numberValue" DOUBLE PRECISION,
    "dateValue" TIMESTAMP(3),
    "booleanValue" BOOLEAN,
    "matrixValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PollSurveyAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PollSurvey_type_idx" ON "PollSurvey"("type");

-- CreateIndex
CREATE INDEX "PollSurvey_status_idx" ON "PollSurvey"("status");

-- CreateIndex
CREATE INDEX "PollSurvey_deadline_idx" ON "PollSurvey"("deadline");

-- CreateIndex
CREATE INDEX "PollSurvey_publishDate_idx" ON "PollSurvey"("publishDate");

-- CreateIndex
CREATE INDEX "PollSurveyQuestion_pollSurveyId_idx" ON "PollSurveyQuestion"("pollSurveyId");

-- CreateIndex
CREATE INDEX "PollSurveyQuestion_type_idx" ON "PollSurveyQuestion"("type");

-- CreateIndex
CREATE INDEX "PollSurveyOption_questionId_idx" ON "PollSurveyOption"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "PollSurveyResponse_pollSurveyId_participantHash_key" ON "PollSurveyResponse"("pollSurveyId", "participantHash");

-- CreateIndex
CREATE INDEX "PollSurveyResponse_pollSurveyId_idx" ON "PollSurveyResponse"("pollSurveyId");

-- CreateIndex
CREATE INDEX "PollSurveyResponse_userId_idx" ON "PollSurveyResponse"("userId");

-- CreateIndex
CREATE INDEX "PollSurveyResponse_directoryUserId_idx" ON "PollSurveyResponse"("directoryUserId");

-- CreateIndex
CREATE INDEX "PollSurveyResponse_status_idx" ON "PollSurveyResponse"("status");

-- CreateIndex
CREATE INDEX "PollSurveyAnswer_responseId_idx" ON "PollSurveyAnswer"("responseId");

-- CreateIndex
CREATE INDEX "PollSurveyAnswer_questionId_idx" ON "PollSurveyAnswer"("questionId");

-- CreateIndex
CREATE INDEX "PollSurveyAnswer_optionId_idx" ON "PollSurveyAnswer"("optionId");

-- AddForeignKey
ALTER TABLE "PollSurvey" ADD CONSTRAINT "PollSurvey_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollSurveyQuestion" ADD CONSTRAINT "PollSurveyQuestion_pollSurveyId_fkey" FOREIGN KEY ("pollSurveyId") REFERENCES "PollSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollSurveyOption" ADD CONSTRAINT "PollSurveyOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PollSurveyQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollSurveyResponse" ADD CONSTRAINT "PollSurveyResponse_pollSurveyId_fkey" FOREIGN KEY ("pollSurveyId") REFERENCES "PollSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollSurveyResponse" ADD CONSTRAINT "PollSurveyResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollSurveyResponse" ADD CONSTRAINT "PollSurveyResponse_directoryUserId_fkey" FOREIGN KEY ("directoryUserId") REFERENCES "DirectoryUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollSurveyAnswer" ADD CONSTRAINT "PollSurveyAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "PollSurveyResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollSurveyAnswer" ADD CONSTRAINT "PollSurveyAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PollSurveyQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollSurveyAnswer" ADD CONSTRAINT "PollSurveyAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PollSurveyOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
