import { api } from "./api";
import type { PortalWidgetSetting } from "./portal-widgets";

export interface PortalSettings {
  id: number;
  companyName: string;
  logo?: string;
  primaryColor?: string;
  portalBackgroundImageUrl?: string;
  portalBackgroundOverlayColor?: string;
  portalBackgroundOverlayOpacity?: number;
  portalWidgets?: PortalWidgetSetting[] | null;
  footerText?: string;
  activeDirectoryEnabled?: boolean;
  activeDirectoryUrl?: string;
  activeDirectoryDomain?: string;
  activeDirectoryBaseDn?: string;
  activeDirectoryBindDn?: string;
  activeDirectoryBindPassword?: string | null;
  activeDirectoryUserSearchBase?: string;
  activeDirectoryGroupSearchBase?: string;
  activeDirectoryLastStatus?: string | null;
  activeDirectoryLastError?: string | null;
  activeDirectoryLastCheckedAt?: string | null;
  trainingMaxUploadSizeMb?: number;
  trainingAllowedFileExtensions?: string;
  requireUserPersonnelCode?: boolean;
  requireUserBirthDate?: boolean;
  topbarUserDisplayMode?: "FULL_NAME" | "PERSONNEL_CODE" | "USERNAME";
}

export interface UpdatePortalSettingsDto {
  companyName: string;
  logo?: string;
  primaryColor?: string;
  portalBackgroundImageUrl?: string;
  portalBackgroundOverlayColor?: string;
  portalBackgroundOverlayOpacity?: number;
  portalWidgets?: PortalWidgetSetting[];
  footerText?: string;
  activeDirectoryEnabled?: boolean;
  activeDirectoryUrl?: string;
  activeDirectoryDomain?: string;
  activeDirectoryBaseDn?: string;
  activeDirectoryBindDn?: string;
  activeDirectoryBindPassword?: string;
  activeDirectoryUserSearchBase?: string;
  activeDirectoryGroupSearchBase?: string;
  trainingMaxUploadSizeMb?: number;
  trainingAllowedFileExtensions?: string;
  requireUserPersonnelCode?: boolean;
  requireUserBirthDate?: boolean;
  topbarUserDisplayMode?: "FULL_NAME" | "PERSONNEL_CODE" | "USERNAME";
}

export const settingsQueryKey = ["settings"];

export function getSettings() {
  return api.get<PortalSettings | null>("/settings");
}

export function updateSettings(dto: UpdatePortalSettingsDto) {
  return api.put<PortalSettings>("/settings", dto);
}

export function testActiveDirectoryConnection() {
  return api.post<PortalSettings>("/settings/active-directory/test");
}
