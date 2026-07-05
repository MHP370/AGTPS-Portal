import { getStoredAuthUser } from "@/lib/auth";

export interface UserSession {
  id: string;
  fullName: string;
  username: string;
  roles: string[];
  permissions: string[];
  directoryUserId?: string;
  site?: string;
}

export function getCurrentUser(): UserSession | null {
  const user = getStoredAuthUser();
  if (!user) return null;

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.directoryUser?.displayName ||
    user.username;

  return {
    id: user.id,
    fullName,
    username: user.username,
    roles: user.roles,
    permissions: user.permissions,
    directoryUserId: user.directoryUser?.id,
  };
}
