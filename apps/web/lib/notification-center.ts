import { api } from "./api";

export type SmtpEncryption = "NONE" | "SSL" | "TLS" | "STARTTLS";
export type QueueStatus =
  | "PENDING"
  | "SENDING"
  | "SENT"
  | "FAILED"
  | "RETRY"
  | "CANCELLED";
export type TemplateStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type TemplateCategory =
  | "WELCOME"
  | "PASSWORD_RESET"
  | "ANNOUNCEMENTS"
  | "TRAINING"
  | "CALENDAR"
  | "MEETINGS"
  | "POLLS"
  | "SURVEYS"
  | "CEO_MESSAGES"
  | "ASSETS"
  | "MAINTENANCE"
  | "INVENTORY"
  | "LICENSES"
  | "WARRANTY"
  | "SYSTEM_ALERTS"
  | "BACKUPS"
  | "GENERAL";

export interface NotificationStats {
  smtpCount: number;
  templateCount: number;
  pending: number;
  sent: number;
  failed: number;
}

export interface SmtpServer {
  id: string;
  name: string;
  host: string;
  port: number;
  username?: string | null;
  password?: string | null;
  senderName?: string | null;
  senderEmail: string;
  replyTo?: string | null;
  encryption: SmtpEncryption;
  timeoutMs: number;
  maxRetry: number;
  priority: number;
  isActive: boolean;
  isPrimary: boolean;
  lastTestStatus?: string | null;
  lastTestError?: string | null;
  lastTestedAt?: string | null;
}

export interface CreateSmtpServerDto {
  name: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  senderName?: string;
  senderEmail: string;
  replyTo?: string;
  encryption?: SmtpEncryption;
  timeoutMs?: number;
  maxRetry?: number;
  priority?: number;
  isActive?: boolean;
  isPrimary?: boolean;
}

export interface NotificationTemplate {
  id: string;
  key: string;
  title: string;
  category: TemplateCategory;
  status: TemplateStatus;
  subject: string;
  htmlBody: string;
  textBody?: string | null;
}

export interface NotificationRule {
  id: string;
  eventKey: string;
  title: string;
  description?: string | null;
  moduleKey?: string | null;
  portalEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  teamsEnabled: boolean;
  emailTemplateId?: string | null;
  priority: number;
  isActive: boolean;
  emailTemplate?: NotificationTemplate | null;
}

export interface CreateNotificationTemplateDto {
  key: string;
  title: string;
  category: TemplateCategory;
  status?: TemplateStatus;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface EmailQueueItem {
  id: string;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  status: QueueStatus;
  retryCount: number;
  maxRetry: number;
  priority: number;
  sentAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
  template?: NotificationTemplate | null;
  smtpServer?: {
    id: string;
    name: string;
    host: string;
    senderEmail: string;
  } | null;
}

export interface QueueEmailDto {
  recipientEmail: string;
  recipientName?: string;
  templateId?: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  maxRetry?: number;
  priority?: number;
  variables?: Record<string, unknown>;
}

export interface UpdateNotificationRuleDto {
  title?: string;
  description?: string;
  moduleKey?: string;
  portalEnabled?: boolean;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  smsEnabled?: boolean;
  teamsEnabled?: boolean;
  emailTemplateId?: string | null;
  priority?: number;
  isActive?: boolean;
}

export const notificationCenterQueryKey = ["notification-center"];

export function getNotificationStats() {
  return api.get<NotificationStats>("/notifications/admin/stats");
}

export function getSmtpServers() {
  return api.get<SmtpServer[]>("/notifications/admin/smtp");
}

export function createSmtpServer(dto: CreateSmtpServerDto) {
  return api.post<SmtpServer>("/notifications/admin/smtp", dto);
}

export function updateSmtpServer(
  id: string,
  dto: Partial<CreateSmtpServerDto>,
) {
  return api.put<SmtpServer>(`/notifications/admin/smtp/${id}`, dto);
}

export function deleteSmtpServer(id: string) {
  return api.delete<void>(`/notifications/admin/smtp/${id}`);
}

export function testSmtpServer(
  id: string,
  dto: { recipientEmail?: string; subject?: string; body?: string },
) {
  return api.post<{ ok: boolean; error?: string; server: SmtpServer }>(
    `/notifications/admin/smtp/${id}/test`,
    dto,
  );
}

export function getNotificationTemplates() {
  return api.get<NotificationTemplate[]>("/notifications/admin/templates");
}

export function createNotificationTemplate(
  dto: CreateNotificationTemplateDto,
) {
  return api.post<NotificationTemplate>("/notifications/admin/templates", dto);
}

export function updateNotificationTemplate(
  id: string,
  dto: Partial<CreateNotificationTemplateDto>,
) {
  return api.put<NotificationTemplate>(
    `/notifications/admin/templates/${id}`,
    dto,
  );
}

export function deleteNotificationTemplate(id: string) {
  return api.delete<void>(`/notifications/admin/templates/${id}`);
}

export function getNotificationRules() {
  return api.get<NotificationRule[]>("/notifications/admin/rules");
}

export function updateNotificationRule(
  id: string,
  dto: UpdateNotificationRuleDto,
) {
  return api.put<NotificationRule>(`/notifications/admin/rules/${id}`, dto);
}

export function getEmailQueue() {
  return api.get<EmailQueueItem[]>("/notifications/admin/email-queue");
}

export function queueEmail(dto: QueueEmailDto) {
  return api.post<EmailQueueItem>("/notifications/admin/email-queue", dto);
}

export function processEmailQueue() {
  return api.post<{ processed: number }>(
    "/notifications/admin/email-queue/process",
  );
}

export function sendQueuedEmail(id: string) {
  return api.post<EmailQueueItem>(
    `/notifications/admin/email-queue/${id}/send`,
  );
}

export function cancelQueuedEmail(id: string) {
  return api.post<EmailQueueItem>(
    `/notifications/admin/email-queue/${id}/cancel`,
  );
}
