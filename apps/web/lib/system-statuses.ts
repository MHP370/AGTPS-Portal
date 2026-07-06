import { api } from "./api";

export interface SystemStatusItem {
  id: string;
  title: string;
  status: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSystemStatusDto {
  title: string;
  status: string;
  description?: string;
  icon?: string;
  color?: string;
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
