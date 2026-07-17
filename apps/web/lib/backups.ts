import { getAccessToken } from "./auth";
import { api } from "./api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";

export type BackupType = "DATABASE" | "FILES" | "FULL";
export type BackupStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "DELETED";
export type BackupScheduleFrequency = "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";
export type BackupRestoreStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

export interface BackupJob {
  id: string;
  type: BackupType;
  status: BackupStatus;
  fileName?: string | null;
  filePath?: string | null;
  fileSize?: string | number | null;
  includeDatabase: boolean;
  includeUploads: boolean;
  notifyEmail?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackupSettings {
  id: number;
  autoEnabled: boolean;
  frequency: BackupScheduleFrequency;
  scheduleTime: string;
  weeklyDayOfWeek: number;
  monthlyDayOfMonth: number;
  type: BackupType;
  includeDatabase: boolean;
  includeUploads: boolean;
  retentionCount: number;
  notifyEmails?: string | null;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
}

export interface BackupRestoreJob {
  id: string;
  backupId: string;
  emergencyBackupId?: string | null;
  status: BackupRestoreStatus;
  restoreDatabase: boolean;
  restoreUploads: boolean;
  startedAt?: string | null;
  finishedAt?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
  backup?: BackupJob;
}

export interface CreateBackupDto {
  type?: BackupType;
  includeDatabase?: boolean;
  includeUploads?: boolean;
  notifyEmail?: string;
}

export interface RestoreBackupDto {
  confirmation: string;
  restoreDatabase?: boolean;
  restoreUploads?: boolean;
}

export const backupsQueryKey = ["backups"];

export function getBackups() {
  return api.get<BackupJob[]>("/backups");
}

export function getBackupSettings() {
  return api.get<BackupSettings>("/backups/settings");
}

export function getBackupRestoreJobs() {
  return api.get<BackupRestoreJob[]>("/backups/restore-jobs");
}

export function updateBackupSettings(dto: Partial<BackupSettings>) {
  return api.put<BackupSettings>("/backups/settings", dto);
}

export function createBackup(dto: CreateBackupDto) {
  return api.post<BackupJob>("/backups", dto);
}

export function deleteBackup(id: string) {
  return api.delete<BackupJob>(`/backups/${id}`);
}

export function restoreBackup(id: string, dto: RestoreBackupDto) {
  return api.post<BackupRestoreJob>(`/backups/${id}/restore`, dto);
}

export async function downloadBackup(id: string) {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/backups/${id}/download`, {
    cache: "no-store",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(response.statusText || "Backup download failed.");
  }

  const disposition = response.headers.get("Content-Disposition") || "";
  const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/);
  const filename = filenameMatch
    ? decodeURIComponent(filenameMatch[1])
    : `agtps-backup-${id}.tar.gz`;

  return {
    blob: await response.blob(),
    filename,
  };
}
