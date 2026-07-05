import { api } from "./api";

export interface PortalSettings {
  id: number;
  companyName: string;
  logo?: string;
  primaryColor?: string;
  portalBackgroundImageUrl?: string;
  portalBackgroundOverlayColor?: string;
  portalBackgroundOverlayOpacity?: number;
  footerText?: string;
}

export interface UpdatePortalSettingsDto {
  companyName: string;
  logo?: string;
  primaryColor?: string;
  portalBackgroundImageUrl?: string;
  portalBackgroundOverlayColor?: string;
  portalBackgroundOverlayOpacity?: number;
  footerText?: string;
}

export const settingsQueryKey = ["settings"];

export function getSettings() {
  return api.get<PortalSettings | null>("/settings");
}

export function updateSettings(dto: UpdatePortalSettingsDto) {
  return api.put<PortalSettings>("/settings", dto);
}
