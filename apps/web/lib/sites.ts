import { api } from "./api";

export interface Site {
  id: string;
  code: string;
  name: string;
  description?: string;
  baseUrl?: string;
  ipRange?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteDto {
  code: string;
  name: string;
  description?: string;
  baseUrl?: string;
  ipRange?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const siteQueryKey = ["sites"];

export function getSites() {
  return api.get<Site[]>("/sites");
}

export function createSite(dto: CreateSiteDto) {
  return api.post<Site>("/sites", dto);
}

export function updateSite(
  id: string,
  dto: Partial<CreateSiteDto>,
) {
  return api.put<Site>(`/sites/${id}`, dto);
}

export function deleteSite(id: string) {
  return api.delete<void>(`/sites/${id}`);
}
