import { api } from "./api";

export type PollSurveyType = "POLL" | "SURVEY";
export type PollSurveyStatus =
  "DRAFT" | "SCHEDULED" | "RUNNING" | "CLOSED" | "ARCHIVED";
export type PollSurveyQuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "TEXT"
  | "PARAGRAPH"
  | "RATING"
  | "YES_NO"
  | "NUMBER"
  | "DATE"
  | "MATRIX";

export interface PollSurveyOption {
  id: string;
  questionId: string;
  label: string;
  value?: string | null;
  sortOrder: number;
}

export interface PollSurveyQuestion {
  id: string;
  pollSurveyId: string;
  type: PollSurveyQuestionType;
  title: string;
  description?: string | null;
  isRequired: boolean;
  sortOrder: number;
  settings?: Record<string, unknown> | null;
  conditionQuestionId?: string | null;
  conditionOperator?: string | null;
  conditionValue?: string | null;
  options: PollSurveyOption[];
}

export interface PollSurveyResponse {
  id: string;
  pollSurveyId: string;
  userId?: string | null;
  directoryUserId?: string | null;
  participantHash: string;
  isAnonymous: boolean;
  status: "DRAFT" | "SUBMITTED";
  submittedAt?: string | null;
}

export interface PollSurvey {
  id: string;
  type: PollSurveyType;
  title: string;
  description?: string | null;
  category?: string | null;
  tags: string[];
  allowMultipleSelection: boolean;
  anonymous: boolean;
  required: boolean;
  popupEnforced: boolean;
  allowVoteEditing: boolean;
  deadline?: string | null;
  publishDate?: string | null;
  status: PollSurveyStatus;
  targetUserIds: string[];
  targetDepartments: string[];
  targetAdGroupIds: string[];
  allowResultViewing: boolean;
  allowParticipantCount: boolean;
  allowLiveResults: boolean;
  participantVisibility: boolean;
  questions: PollSurveyQuestion[];
  responses?: PollSurveyResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePollSurveyDto {
  type: PollSurveyType;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  allowMultipleSelection?: boolean;
  anonymous?: boolean;
  required?: boolean;
  popupEnforced?: boolean;
  allowVoteEditing?: boolean;
  deadline?: string | null;
  publishDate?: string | null;
  status?: PollSurveyStatus;
  targetUserIds?: string[];
  targetDepartments?: string[];
  targetAdGroupIds?: string[];
  allowResultViewing?: boolean;
  allowParticipantCount?: boolean;
  allowLiveResults?: boolean;
  participantVisibility?: boolean;
  questions?: Array<{
    type: PollSurveyQuestionType;
    title: string;
    description?: string;
    isRequired?: boolean;
    sortOrder?: number;
    settings?: Record<string, unknown>;
    options?: Array<{
      label: string;
      value?: string;
      sortOrder?: number;
    }>;
  }>;
  options?: Array<{
    label: string;
    value?: string;
    sortOrder?: number;
  }>;
}

export interface SubmitPollSurveyResponseDto {
  participantKey: string;
  userId?: string;
  directoryUserId?: string;
  saveDraft?: boolean;
  timeSpentSeconds?: number;
  answers: Array<{
    questionId: string;
    optionId?: string;
    optionIds?: string[];
    textValue?: string;
    numberValue?: number;
    dateValue?: string;
    booleanValue?: boolean;
    matrixValue?: Record<string, unknown>;
  }>;
}

export interface PollSurveyResult {
  id: string;
  type: PollSurveyType;
  title: string;
  totalResponses: number;
  participationRate: number | null;
  questions: Array<{
    id: string;
    title: string;
    type: PollSurveyQuestionType;
    totalAnswers: number;
    options: Array<{
      id: string;
      label: string;
      count: number;
    }>;
    textAnswers: string[];
    average: number | null;
  }>;
}

export const pollSurveysQueryKey = ["poll-surveys"];

export function getPollSurveys(type?: PollSurveyType) {
  const query = type ? `?type=${type}` : "";
  return api.get<PollSurvey[]>(`/poll-surveys${query}`);
}

export function getAdminPollSurveys(type?: PollSurveyType) {
  const query = type ? `?type=${type}` : "";
  return api.get<PollSurvey[]>(`/poll-surveys/admin/all${query}`);
}

export function getPollSurvey(id: string) {
  return api.get<PollSurvey>(`/poll-surveys/${id}`);
}

export function getAdminPollSurvey(id: string) {
  return api.get<PollSurvey>(`/poll-surveys/admin/${id}`);
}

export function getPollSurveyResults(id: string) {
  return api.get<PollSurveyResult>(`/poll-surveys/${id}/results`);
}

export function getPublicPollSurveyResults(id: string) {
  return api.get<PollSurveyResult>(`/poll-surveys/${id}/public-results`);
}

export function createPollSurvey(dto: CreatePollSurveyDto) {
  return api.post<PollSurvey>("/poll-surveys", dto);
}

export function updatePollSurvey(
  id: string,
  dto: Partial<CreatePollSurveyDto>,
) {
  return api.put<PollSurvey>(`/poll-surveys/${id}`, dto);
}

export function deletePollSurvey(id: string) {
  return api.delete<PollSurvey>(`/poll-surveys/${id}`);
}

export function clonePollSurvey(id: string) {
  return api.post<PollSurvey>(`/poll-surveys/${id}/clone`);
}

export function submitPollSurveyResponse(
  id: string,
  dto: SubmitPollSurveyResponseDto,
) {
  return api.post<PollSurveyResponse>(`/poll-surveys/${id}/responses`, dto);
}
