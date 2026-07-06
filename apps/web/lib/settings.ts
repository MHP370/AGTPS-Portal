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
