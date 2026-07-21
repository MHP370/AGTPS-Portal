import { api } from "./api";

export type TrainingContentType =
  | "VIDEO"
  | "PDF"
  | "DOCUMENT"
  | "SPREADSHEET"
  | "PRESENTATION"
  | "IMAGE"
  | "LINK"
  | "ATTACHMENT";

export type TrainingPublishStatus =
  "NEEDS_REVIEW" | "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type TrainingProgressStatus =
  "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type InPersonTrainingStatus =
  "PLANNED" | "OPEN" | "CLOSED" | "CANCELLED" | "COMPLETED";

export type InPersonAttendanceStatus =
  "REGISTERED" | "ATTENDED" | "ABSENT" | "EXCUSED";

export type InPersonTrainingResult = "PASSED" | "FAILED" | "NO_EXAM";

export interface TrainingCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  contentType: TrainingContentType;
  sourceType: string;
  sourcePath?: string | null;
  standaloneSubfolders: string[];
  fileUrl?: string | null;
  externalUrl?: string | null;
  thumbnail?: string | null;
  instructor?: string | null;
  department?: string | null;
  level?: string | null;
  durationMinutes?: number | null;
  tags: string[];
  isRequired: boolean;
  status: TrainingPublishStatus;
  isActive: boolean;
  categoryId?: string | null;
  category?: TrainingCategory | null;
  files: TrainingFile[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingFile {
  id?: string;
  title: string;
  fileUrl: string;
  sourcePath?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface TrainingSource {
  id: string;
  name: string;
  type: string;
  basePath: string;
  authMode?: string;
  realm?: string;
  description?: string | null;
  username?: string | null;
  password?: string | null;
  syncIntervalMinutes: number;
  uploadDirectory: string;
  isActive: boolean;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
  lastSyncError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingProgress {
  id: string;
  trainingItemId: string;
  visitorKey?: string | null;
  status: TrainingProgressStatus;
  progressPercent: number;
  lastPositionSeconds?: number | null;
  durationSeconds?: number | null;
  lastFileUrl?: string | null;
  completedAt?: string | null;
  lastViewedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface InPersonTraining {
  id: string;
  title: string;
  description?: string | null;
  categoryId?: string | null;
  category?: TrainingCategory | null;
  instructorName?: string | null;
  organizerDepartment?: string | null;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  durationHours?: number | null;
  hasExam: boolean;
  hasCertificate: boolean;
  status: InPersonTrainingStatus;
  participants: InPersonTrainingParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface InPersonTrainingParticipant {
  id: string;
  trainingId: string;
  userId?: string | null;
  directoryUserId?: string | null;
  displayName: string;
  email?: string | null;
  attendanceStatus: InPersonAttendanceStatus;
  score?: number | null;
  result: InPersonTrainingResult;
  certificateNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainingCategoryDto {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateTrainingItemDto {
  title: string;
  slug: string;
  description?: string;
  contentType?: TrainingContentType;
  sourceType?: string;
  sourcePath?: string;
  standaloneSubfolders?: string[];
  fileUrl?: string;
  externalUrl?: string;
  thumbnail?: string;
  instructor?: string;
  department?: string;
  level?: string;
  durationMinutes?: number;
  tags?: string[];
  isRequired?: boolean;
  status?: TrainingPublishStatus;
  isActive?: boolean;
  categoryId?: string | null;
  files?: Array<Omit<TrainingFile, "id">>;
}

export interface CreateTrainingSourceDto {
  name: string;
  type?: string;
  basePath: string;
  description?: string;
  username?: string;
  password?: string;
  syncIntervalMinutes?: number;
  uploadDirectory?: string;
  isActive?: boolean;
}

export interface UpsertTrainingProgressDto {
  visitorKey: string;
  status?: TrainingProgressStatus;
  progressPercent?: number;
  lastPositionSeconds?: number;
  durationSeconds?: number;
  lastFileUrl?: string;
}

export interface CreateInPersonTrainingDto {
  title: string;
  description?: string;
  categoryId?: string | null;
  instructorName?: string;
  organizerDepartment?: string;
  location?: string;
  startDate: string;
  endDate?: string | null;
  durationHours?: number;
  hasExam?: boolean;
  hasCertificate?: boolean;
  status?: InPersonTrainingStatus;
}

export interface CreateInPersonParticipantDto {
  userId?: string | null;
  directoryUserId?: string | null;
  displayName: string;
  email?: string;
  attendanceStatus?: InPersonAttendanceStatus;
  score?: number;
  result?: InPersonTrainingResult;
  certificateNumber?: string;
  notes?: string;
}

export const trainingsQueryKey = ["trainings"];
export const trainingCategoriesQueryKey = ["training-categories"];
export const trainingSourcesQueryKey = ["training-sources"];
export const inPersonTrainingsQueryKey = ["trainings", "in-person"];

export function getPublishedTrainings() {
  return api.get<TrainingItem[]>("/trainings");
}

export function uploadTrainingSourceFile(
  sourceId: string,
  trainingSlug: string,
  file: File,
) {
  const form = new FormData();
  form.append("trainingSlug", trainingSlug);
  form.append("file", file);
  return api.upload<{ path: string; size: number }>(
    `/trainings/sources/${sourceId}/upload`,
    form,
  );
}

export function getTrainingProgress(
  trainingItemId: string,
  visitorKey: string,
) {
  return api.get<TrainingProgress | null>(
    `/trainings/${trainingItemId}/progress?visitorKey=${encodeURIComponent(visitorKey)}`,
  );
}

export function upsertTrainingProgress(
  trainingItemId: string,
  dto: UpsertTrainingProgressDto,
) {
  return api.put<TrainingProgress>(
    `/trainings/${trainingItemId}/progress`,
    dto,
  );
}

export function getAdminTrainings() {
  return api.get<TrainingItem[]>("/trainings/admin/items");
}

export function createTrainingItem(dto: CreateTrainingItemDto) {
  return api.post<TrainingItem>("/trainings/items", dto);
}

export function updateTrainingItem(
  id: string,
  dto: Partial<CreateTrainingItemDto>,
) {
  return api.put<TrainingItem>(`/trainings/items/${id}`, dto);
}

export function deleteTrainingItem(id: string) {
  return api.delete<void>(`/trainings/items/${id}`);
}

export function getAdminInPersonTrainings() {
  return api.get<InPersonTraining[]>("/trainings/admin/in-person");
}

export function createInPersonTraining(dto: CreateInPersonTrainingDto) {
  return api.post<InPersonTraining>("/trainings/in-person", dto);
}

export function updateInPersonTraining(
  id: string,
  dto: Partial<CreateInPersonTrainingDto>,
) {
  return api.put<InPersonTraining>(`/trainings/in-person/${id}`, dto);
}

export function deleteInPersonTraining(id: string) {
  return api.delete<void>(`/trainings/in-person/${id}`);
}

export function createInPersonParticipant(
  trainingId: string,
  dto: CreateInPersonParticipantDto,
) {
  return api.post<InPersonTrainingParticipant>(
    `/trainings/in-person/${trainingId}/participants`,
    dto,
  );
}

export function updateInPersonParticipant(
  id: string,
  dto: Partial<CreateInPersonParticipantDto>,
) {
  return api.put<InPersonTrainingParticipant>(
    `/trainings/in-person/participants/${id}`,
    dto,
  );
}

export function deleteInPersonParticipant(id: string) {
  return api.delete<void>(`/trainings/in-person/participants/${id}`);
}

export function getTrainingCategories() {
  return api.get<TrainingCategory[]>("/trainings/categories");
}

export function getAdminTrainingCategories() {
  return api.get<TrainingCategory[]>("/trainings/admin/categories");
}

export function getAdminTrainingSources() {
  return api.get<TrainingSource[]>("/trainings/admin/sources");
}

export function createTrainingCategory(dto: CreateTrainingCategoryDto) {
  return api.post<TrainingCategory>("/trainings/categories", dto);
}

export function updateTrainingCategory(
  id: string,
  dto: Partial<CreateTrainingCategoryDto>,
) {
  return api.put<TrainingCategory>(`/trainings/categories/${id}`, dto);
}

export function deleteTrainingCategory(id: string) {
  return api.delete<void>(`/trainings/categories/${id}`);
}

export function createTrainingSource(dto: CreateTrainingSourceDto) {
  return api.post<TrainingSource>("/trainings/sources", dto);
}

export function updateTrainingSource(
  id: string,
  dto: Partial<CreateTrainingSourceDto>,
) {
  return api.put<TrainingSource>(`/trainings/sources/${id}`, dto);
}

export function testTrainingSource(id: string) {
  return api.post<{ reachable: boolean; kerberosReady: boolean; message: string; checkedAt: string }>("/trainings/sources/" + id + "/test");
}

export function syncTrainingSource(id: string) {
  return api.post<{ created: number; updated: number; discovered: number; scannedFolders: number; checkedAt: string }>(`/trainings/sources/${id}/sync`);
}

export function deleteTrainingSource(id: string) {
  return api.delete<void>(`/trainings/sources/${id}`);
}
