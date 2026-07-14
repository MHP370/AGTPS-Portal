import { api } from "./api";

export const ACCESS_TOKEN_KEY = "access_token";
export const AUTH_USER_KEY = "user";

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 8;

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;

  firstName: string | null;
  lastName: string | null;
  personnelCode?: string | null;
  birthDate?: string | null;
  allowEmailChange?: boolean;
  allowPasswordChange?: boolean;
  allowProfileEdit?: boolean;
  fullName?: string | null;

  isActive: boolean;
  authSource?: "INTERNAL" | "ACTIVE_DIRECTORY";
  roles: string[];
  roleDetails?: Array<{
    id: string;
    name: string;
    title: string;
  }>;
  permissions: string[];
  profileCompletionRequired?: boolean;
  missingProfileFields?: Array<"personnelCode" | "birthDate">;
  profileRequirements?: {
    personnelCode: boolean;
    birthDate: boolean;
  };
  directoryUser?: {
    id: string;
    username: string;
    displayName: string;
    email?: string | null;
    department?: string | null;
    title?: string | null;
    isActive: boolean;
  } | null;
  directoryGroups?: Array<{
    id: string;
    name: string;
    title: string;
    source: "INTERNAL" | "ACTIVE_DIRECTORY";
    isActive: boolean;
  }>;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1] ?? null
  );
}

export function setAuthSession(session: LoginResponse) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));

  document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(
    session.access_token,
  )}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function setStoredAuthUser(user: AuthUser) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? getCookie(ACCESS_TOKEN_KEY);
}

export function getStoredAuthUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const value = localStorage.getItem(AUTH_USER_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    return null;
  }
}

export function hasAuthSession() {
  return Boolean(getAccessToken());
}

export async function login(dto: LoginDto): Promise<LoginResponse> {
  return api.post<LoginResponse>("/auth/login", dto);
}

export function getMe() {
  return api.get<AuthUser>("/auth/me");
}

export interface UpdateProfileDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  personnelCode?: string;
  birthDate?: string;
}

export function updateProfile(dto: UpdateProfileDto) {
  return api.put<AuthUser>("/auth/profile", dto);
}

export interface ChangeOwnPasswordDto {
  currentPassword: string;
  newPassword: string;
}

export function changeOwnPassword(dto: ChangeOwnPasswordDto) {
  return api.put<{ ok: boolean }>("/auth/password", dto);
}
