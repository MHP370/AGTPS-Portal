import { api } from "./api";

export interface PortalModule {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  route?: string | null;
  permission?: string | null;
  isCore: boolean;
  isInstalled: boolean;
  isEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePortalModuleDto {
  title?: string;
  description?: string | null;
  icon?: string | null;
  route?: string | null;
  permission?: string | null;
  isInstalled?: boolean;
  isEnabled?: boolean;
  sortOrder?: number;
}

export const portalModulesQueryKey = ["portal-modules"];
export const adminPortalModulesQueryKey = ["portal-modules", "admin"];

export function getEnabledPortalModules() {
  return api.get<PortalModule[]>("/portal-modules");
}

export function getAdminPortalModules() {
  return api.get<PortalModule[]>("/portal-modules/admin/all");
}

export function updatePortalModule(
  key: string,
  dto: UpdatePortalModuleDto,
) {
  return api.put<PortalModule>(`/portal-modules/${key}`, dto);
}
