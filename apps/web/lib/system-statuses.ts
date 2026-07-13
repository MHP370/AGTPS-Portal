import { api } from "./api";

export type SystemHealthCheckType = "MANUAL" | "HTTP" | "TCP" | "PING" | "SMB";
export type SystemHealthState = "UNKNOWN" | "UP" | "DEGRADED" | "DOWN";

export interface SystemStatusItem {
  id: string;
  title: string;
  status: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  checkType: SystemHealthCheckType;
  target?: string | null;
  method: string;
  expectedStatusCodes: string;
  expectedKeyword?: string | null;
  intervalSeconds: number;
  timeoutMs: number;
  lastHealthState: SystemHealthState;
  lastCheckedAt?: string | null;
  lastResponseTimeMs?: number | null;
  lastError?: string | null;
  nextCheckAt?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSystemStatusDto {
  title: string;
  status?: string;
  description?: string;
  icon?: string;
  color?: string;
  checkType?: SystemHealthCheckType;
  target?: string;
  method?: string;
  expectedStatusCodes?: string;
  expectedKeyword?: string;
  intervalSeconds?: number;
  timeoutMs?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export const systemStatusesQueryKey = ["system-statuses"];

export function getSystemStatuses() {
  return api.get<SystemStatusItem[]>("/system-statuses");
}

export function getAdminSystemStatuses() {
  return api.get<SystemStatusItem[]>("/system-statuses/admin/all");
}

export function createSystemStatus(dto: CreateSystemStatusDto) {
  return api.post<SystemStatusItem>("/system-statuses", dto);
}

export function updateSystemStatus(
  id: string,
  dto: Partial<CreateSystemStatusDto>,
) {
  return api.put<SystemStatusItem>(`/system-statuses/${id}`, dto);
}

export function deleteSystemStatus(id: string) {
  return api.delete<void>(`/system-statuses/${id}`);
}

export function checkSystemStatus(id: string) {
  return api.post<SystemStatusItem>(`/system-statuses/${id}/check`);
}
