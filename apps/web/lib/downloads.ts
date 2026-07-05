import { api } from "./api";

export interface PortalDownloadItem {
  id: string;
  title: string;
  description?: string | null;
  version?: string | null;
  fileUrl: string;
  category?: string | null;
  icon?: string | null;
  color?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDownloadDto {
  title: string;
  description?: string;
  version?: string;
  fileUrl: string;
  category?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const downloadsQueryKey = ["downloads"];

export function getDownloads() {
  return api.get<PortalDownloadItem[]>("/downloads");
}

export function getAdminDownloads() {
  return api.get<PortalDownloadItem[]>("/downloads/admin/all");
}

export function createDownload(dto: CreateDownloadDto) {
  return api.post<PortalDownloadItem>("/downloads", dto);
}

export function updateDownload(
  id: string,
  dto: Partial<CreateDownloadDto>,
) {
  return api.put<PortalDownloadItem>(`/downloads/${id}`, dto);
}

export function deleteDownload(id: string) {
  return api.delete<void>(`/downloads/${id}`);
}
