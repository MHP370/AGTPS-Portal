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

  isActive: boolean;
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

export function hasAuthSession() {
  return Boolean(getAccessToken());
}

export async function login(
  dto: LoginDto,
): Promise<LoginResponse> {
  return api.post<LoginResponse>(
    "/auth/login",
    dto,
  );
}
