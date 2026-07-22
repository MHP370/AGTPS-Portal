import { api } from "./api";

export interface Site {
  id: string;
  code: string;
  name: string;
  description?: string;
  baseUrl?: string;
  ipRange?: string;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  logo?: string;
  image?: string;
  color?: string;
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
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  logo?: string;
  image?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const siteQueryKey = ["sites"];
export const portalSiteQueryKey = ["portal-sites"];
export const portalWeatherQueryKey = ["portal-weather"];
export const detectedPortalSiteQueryKey = ["portal-site-detection"];

export interface PortalSiteWeather {
  siteId: string;
  siteName: string;
  available: boolean;
  reason?: "missing_coordinates" | "provider_unavailable";
  observedAt?: string;
  temperature?: number;
  apparentTemperature?: number;
  humidity?: number;
  precipitation?: number;
  windSpeed?: number;
  weatherCode?: number;
  isDay?: boolean;
}

export function getSites() {
  return api.get<Site[]>("/sites");
}

export function getPortalSites() {
  return api.get<Site[]>("/portal/sites");
}

export function getPortalWeather() {
  return api.get<PortalSiteWeather[]>("/portal/sites/weather");
}

export function getDetectedPortalSite() {
  return api.get<{ site: Site | null }>("/portal/sites/detect");
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
