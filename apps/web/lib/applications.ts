import { api } from "./api";

export interface Site {
  id: string;
  code: string;
  name: string;
}

export interface ApplicationSite {
  id: string;
  url: string;
  isActive: boolean;
  site: Site;
}

export interface CreateApplicationSiteDto {
  applicationId: string;
  siteId: string;
  url: string;
  isActive?: boolean;
}

export type UpdateApplicationSiteDto =
  Partial<CreateApplicationSiteDto>;

export interface Category {
  id: string;
  name: string;
  slug?: string;
  isActive?: boolean;
}

export interface Application {
  id: string;

  key: string;
  slug: string;

  title: string;
  description?: string;

  icon?: string;
  color?: string;

  status: string;
  networkType: string;

  version?: string;
  owner?: string;
  supportDepartment?: string;
  guideUrl?: string;

  isFeatured: boolean;
  isNew: boolean;
  openInNewTab: boolean;

  sortOrder: number;
  isActive: boolean;

  category: Category;

  sites: ApplicationSite[];

  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationDto {
  key: string;
  slug: string;

  title: string;
  description?: string;

  categoryId: string;

  icon?: string;
  color?: string;

  status?: string;
  networkType?: string;

  version?: string;
  owner?: string;
  supportDepartment?: string;
  guideUrl?: string;

  isFeatured?: boolean;
  isNew?: boolean;
  openInNewTab?: boolean;

  sortOrder?: number;
  isActive?: boolean;
}

export async function getApplications() {
  return api.get<Application[]>("/applications");
}

export async function getPortalApplications() {
  return api.get<Application[]>("/portal/applications");
}

export async function getApplication(id: string) {
  return api.get<Application>(`/applications/${id}`);
}

export async function createApplication(
  dto: CreateApplicationDto,
) {
  return api.post<Application>("/applications", dto);
}

export async function updateApplication(
  id: string,
  dto: Partial<CreateApplicationDto>,
) {
  return api.put<Application>(
    `/applications/${id}`,
    dto,
  );
}

export async function deleteApplication(id: string) {
  return api.delete<void>(
    `/applications/${id}`,
  );
}

export async function createApplicationSite(
  dto: CreateApplicationSiteDto,
) {
  return api.post<ApplicationSite>(
    "/applications/sites",
    dto,
  );
}

export async function updateApplicationSite(
  id: string,
  dto: UpdateApplicationSiteDto,
) {
  return api.put<ApplicationSite>(
    `/applications/sites/${id}`,
    dto,
  );
}

export async function deleteApplicationSite(id: string) {
  return api.delete<void>(
    `/applications/sites/${id}`,
  );
}

export const applicationQueryKey = [
  "applications",
];

export const portalApplicationQueryKey = [
  "portal-applications",
];
