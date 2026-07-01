export interface UserSession {
  id: string;
  fullName: string;
  username: string;
  role: string;
  site: string;
}

export function getCurrentUser(): UserSession | null {
  // بعداً از JWT یا Cookie خوانده می‌شود
  return null;
}
