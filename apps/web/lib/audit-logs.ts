import { api } from "./api";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "USER_UPDATED"
  | "PASSWORD_CHANGED"
  | "BACKUP_CREATED"
  | "BACKUP_DELETED"
  | "BACKUP_RESTORED"
  | "NOTIFICATION_RULE_UPDATED"
  | "DIRECT_MANAGER_CREATED"
  | "DIRECT_MANAGER_UPDATED"
  | "DIRECT_MANAGER_DELETED"
  | "FORBIDDEN_WORD_CREATED"
  | "FORBIDDEN_WORD_UPDATED"
  | "FORBIDDEN_WORD_DELETED";

export interface AuditLogItem {
  id: string;
  actorUserId?: string | null;
  actorUsername?: string | null;
  actorEmail?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export const auditLogsQueryKey = ["audit-logs"];

export function getAuditLogs() {
  return api.get<AuditLogItem[]>("/audit-logs");
}
