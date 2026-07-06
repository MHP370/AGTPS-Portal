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
  | "NEEDS_REVIEW"
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

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
  description?: string | null;
  username?: string | null;
  password?: string | null;
  isActive: boolean;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
  lastSyncError?: string | null;
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
  isActive?: boolean;
}

export const trainingsQueryKey = ["trainings"];
export const trainingCategoriesQueryKey = ["training-categories"];
export const trainingSourcesQueryKey = ["training-sources"];

export function getPublishedTrainings() {
  return api.get<TrainingItem[]>("/trainings");
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

export function deleteTrainingSource(id: string) {
  return api.delete<void>(`/trainings/sources/${id}`);
}
