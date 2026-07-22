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
  "PLANNED" | "APPROVED" | "OPEN" | "CLOSED" | "IN_PROGRESS" | "CANCELLED" | "COMPLETED" | "ARCHIVED";

export type TrainingCertificateMode = "NONE" | "ONLINE_AUTO" | "ONLINE_APPROVAL" | "OFFLINE_UPLOAD";
export type TrainingCertificateNumberStrategy = "SEQUENTIAL" | "YEARLY_SEQUENTIAL" | "COURSE_SEQUENTIAL" | "RANDOM" | "CUSTOM_PATTERN";

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

export interface TrainingTreeNode {
  id: string;
  name: string;
  type: "folder" | "file";
  relativePath: string;
  fullPath: string;
  promotionPath?: string;
  file?: TrainingFile & { id: string };
  children: TrainingTreeNode[];
}

export interface TrainingFileTree {
  trainingId: string;
  sourceType: string;
  sourceName?: string | null;
  relativeRoot: string;
  fullRootPath: string;
  root: TrainingTreeNode;
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
  courseCode: string;
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
  notificationReminderMinutes: number[];
  certificateMode: TrainingCertificateMode;
  certificateTemplateId?: string | null;
  certificateTemplate?: TrainingCertificateTemplate | null;
  certificateNumberStrategy: TrainingCertificateNumberStrategy;
  certificateNumberStart: number;
  certificateNumberPattern: string;
  certificateValidationRegex?: string | null;
  certificateRequiresCompletion: boolean;
  certificateRequiresPass: boolean;
  lockedAt?: string | null;
  unlockedAt?: string | null;
  unlockReason?: string | null;
  participants: InPersonTrainingParticipant[];
  exam?: TrainingExam | null;
  _count?: { participants: number };
  auditEvents?: TrainingCourseAudit[];
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
  personnelCode?: string | null;
  attendanceStatus: InPersonAttendanceStatus;
  score?: number | null;
  result: InPersonTrainingResult;
  certificateNumber?: string | null;
  notes?: string | null;
  examAttempts?: TrainingExamAttempt[];
  certificates?: TrainingCertificate[];
  directoryUser?: { username: string; department?: string | null; title?: string | null } | null;
  training?: Pick<InPersonTraining, "id" | "title" | "startDate" | "status">;
  createdAt: string;
  updatedAt: string;
}

export interface EligibleTrainingParticipant {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  department?: string | null;
  title?: string | null;
  personnelCode?: string | null;
}

export interface EligibleTrainingParticipantsPage {
  items: EligibleTrainingParticipant[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MyCourseParticipation extends InPersonTrainingParticipant {
  training: Omit<InPersonTraining, "participants"> & { exam?: { id: string; title: string; isPublished: boolean } | null };
  examAttempts: TrainingExamAttempt[];
  certificates: TrainingCertificate[];
}

export type TrainingExamQuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_TEXT";

export interface TrainingExamQuestion {
  id?: string;
  type: TrainingExamQuestionType;
  title: string;
  description?: string | null;
  options?: Array<{ id: string; label: string }> | null;
  correctAnswer?: unknown;
  points: number;
  sortOrder: number;
  isRequired: boolean;
}

export interface TrainingExam {
  id: string;
  trainingId: string;
  title: string;
  description?: string | null;
  passingScore: number;
  durationMinutes?: number | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  showResultImmediately: boolean;
  isPublished: boolean;
  questions: TrainingExamQuestion[];
  attempts?: TrainingExamAttempt[];
  remainingAttempts?: number;
  _count?: { questions: number; attempts: number };
}

export interface TrainingExamAttempt {
  id: string;
  examId: string;
  participantId: string;
  attemptNumber: number;
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "EXPIRED";
  score?: number | null;
  maxScore?: number | null;
  passed?: boolean | null;
  startedAt: string;
  submittedAt?: string | null;
}

export interface TrainingCertificateTemplate {
  id: string;
  title: string;
  description?: string | null;
  backgroundUrl?: string | null;
  layout: Record<string, unknown>;
  isDefault: boolean;
  isActive: boolean;
  signatories?: Array<{ signatoryId: string; sortOrder: number; position?: Record<string, unknown> | null; signatory: TrainingCertificateSignatory }>;
  _count?: { certificates: number; trainings: number };
}

export interface TrainingCertificateSignatory {
  id: string;
  fullName: string;
  jobTitle: string;
  signatureUrl?: string | null;
  stampUrl?: string | null;
  isActive: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  sortOrder: number;
}

export interface TrainingCourseAudit {
  id: string;
  action: string;
  reason?: string | null;
  changes?: Record<string, unknown> | null;
  createdAt: string;
  actor?: { username: string; firstName?: string | null; lastName?: string | null } | null;
}

export interface TrainingCourseReports {
  totals: { courses: number; participants: number; passed: number; failed: number; certificates: number; attempts: number };
  recentCourses: InPersonTraining[];
}

export interface TrainingUsersPage {
  items: Array<{ id: string; displayName: string; personnelCode?: string | null; email?: string | null; username?: string | null; department?: string | null; history: InPersonTrainingParticipant[] }>;
  total: number; page: number; pageSize: number;
}

export interface TrainingCertificate {
  id: string;
  certificateNumber: string;
  title?: string | null;
  source: "GENERATED" | "MANUAL_UPLOAD";
  fileUrl?: string | null;
  mimeType?: string | null;
  issuedAt: string;
  expiresAt?: string | null;
  template?: TrainingCertificateTemplate | null;
  snapshot?: {
    participant?: { displayName?: string; personnelCode?: string | null; email?: string | null };
    training?: { title?: string; courseCode?: string; durationHours?: number | null; instructorName?: string | null; organizerDepartment?: string | null; location?: string | null; startDate?: string; endDate?: string | null };
    result?: { score?: number | null; result?: string };
    template?: { layout?: Record<string, unknown>; backgroundUrl?: string | null } | null;
    signatories?: Array<{ fullName: string; jobTitle: string; signatureUrl?: string | null; stampUrl?: string | null }>;
  } | null;
}

export interface MyTrainingCertificate extends TrainingCertificate {
  participant: InPersonTrainingParticipant & { training: Omit<InPersonTraining, "participants"> };
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
  courseCode: string;
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
  notificationReminderMinutes?: number[];
  directoryUserIds?: string[];
  certificateMode?: TrainingCertificateMode;
  certificateTemplateId?: string | null;
  certificateNumberStrategy?: TrainingCertificateNumberStrategy;
  certificateNumberStart?: number;
  certificateNumberPattern?: string;
  certificateValidationRegex?: string | null;
  certificateRequiresCompletion?: boolean;
  certificateRequiresPass?: boolean;
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
export const eligibleTrainingParticipantsQueryKey = [
  "trainings",
  "eligible-participants",
];
export const myCoursesQueryKey = ["trainings", "my-courses"];

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

export function getAdminTrainingTree(id: string) {
  return api.get<TrainingFileTree>(`/trainings/admin/items/${id}/tree`);
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

export function getInPersonTrainingDetail(id: string) { return api.get<InPersonTraining>(`/trainings/admin/in-person/${id}/detail`); }
export function getCourseReports() { return api.get<TrainingCourseReports>("/trainings/admin/course-reports"); }
export function getTrainingUsers(search: string, page: number, pageSize = 15) {
  const params = new URLSearchParams({ search, page: String(page), pageSize: String(pageSize) });
  return api.get<TrainingUsersPage>(`/trainings/admin/training-users?${params}`);
}
export function unlockInPersonTraining(id: string, reason: string) { return api.post<InPersonTraining>(`/trainings/in-person/${id}/unlock`, { reason }); }

export function getEligibleTrainingParticipants(
  search: string,
  page: number,
  pageSize = 12,
) {
  const params = new URLSearchParams({
    search,
    page: String(page),
    pageSize: String(pageSize),
  });
  return api.get<EligibleTrainingParticipantsPage>(
    `/trainings/admin/eligible-participants?${params}`,
  );
}

export function enrollDirectoryUsers(
  trainingId: string,
  directoryUserIds: string[],
) {
  return api.post<{ added: number; skipped: number }>(
    `/trainings/in-person/${trainingId}/participants/batch`,
    { directoryUserIds },
  );
}

export function getMyCourses() {
  return api.get<MyCourseParticipation[]>("/trainings/my/courses");
}

export function getAdminTrainingExam(trainingId: string) {
  return api.get<TrainingExam | null>(`/trainings/admin/in-person/${trainingId}/exam`);
}
export function getAdminTrainingExams() { return api.get<Array<TrainingExam & { training: Pick<InPersonTraining, "id" | "title" | "status" | "startDate">; _count: { questions: number; attempts: number } }>>("/trainings/admin/exams"); }

export function saveTrainingExam(trainingId: string, dto: Omit<TrainingExam, "id" | "trainingId">) {
  return api.put<TrainingExam>(`/trainings/admin/in-person/${trainingId}/exam`, dto);
}

export function getMyTrainingExam(trainingId: string) {
  return api.get<TrainingExam>(`/trainings/my/courses/${trainingId}/exam`);
}

export function startTrainingExam(trainingId: string) {
  return api.post<TrainingExamAttempt>(`/trainings/my/courses/${trainingId}/exam/start`, {});
}

export function submitTrainingExam(attemptId: string, answers: Array<{ questionId: string; value: unknown }>) {
  return api.post<TrainingExamAttempt>(`/trainings/my/exam-attempts/${attemptId}/submit`, { answers });
}

export function getCertificateTemplates() {
  return api.get<TrainingCertificateTemplate[]>("/trainings/admin/certificate-templates");
}
export function getCertificateSignatories() { return api.get<TrainingCertificateSignatory[]>("/trainings/admin/certificate-signatories"); }
export function createCertificateSignatory(dto: Omit<TrainingCertificateSignatory, "id">) { return api.post<TrainingCertificateSignatory>("/trainings/admin/certificate-signatories", dto); }
export function updateCertificateSignatory(id: string, dto: Omit<TrainingCertificateSignatory, "id">) { return api.put<TrainingCertificateSignatory>(`/trainings/admin/certificate-signatories/${id}`, dto); }
export function generateCourseCertificates(id: string, participantIds?: string[]) { return api.post<{ issued: number; skipped: number }>(`/trainings/admin/in-person/${id}/certificates/generate`, { participantIds }); }

export function createCertificateTemplate(dto: Omit<TrainingCertificateTemplate, "id">) {
  return api.post<TrainingCertificateTemplate>("/trainings/admin/certificate-templates", {
    ...dto,
    signatories: dto.signatories?.map(({ signatoryId, sortOrder, position }) => ({ signatoryId, sortOrder, position })),
  });
}

export function updateCertificateTemplate(id: string, dto: Omit<TrainingCertificateTemplate, "id">) {
  return api.put<TrainingCertificateTemplate>(`/trainings/admin/certificate-templates/${id}`, {
    ...dto,
    signatories: dto.signatories?.map(({ signatoryId, sortOrder, position }) => ({ signatoryId, sortOrder, position })),
  });
}

export function issueTrainingCertificate(dto: { participantId: string; templateId?: string; certificateNumber: string; title?: string; fileUrl?: string; mimeType?: string; expiresAt?: string; notes?: string }) {
  return api.post<TrainingCertificate>("/trainings/admin/certificates", dto);
}

export function verifyTrainingCertificate(certificateNumber: string) {
  return api.get<{ certificateNumber: string; issuedAt: string; expiresAt?: string | null; title: string; participantName: string; courseCode: string; courseTitle: string; valid: boolean }>("/trainings/certificates/verify/" + encodeURIComponent(certificateNumber));
}

export function getMyTrainingCertificate(id: string) {
  return api.get<MyTrainingCertificate>(`/trainings/my/certificates/${id}`);
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
