import { api } from "./api";
import type { DirectoryUser } from "./directory";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;
  roles: Array<{
    id: string;
    name: string;
    title: string;
  }>;
  directoryUser?: DirectoryUser | null;
  canChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export const usersQueryKey = ["users"];

export function getUsers() {
  return api.get<AdminUser[]>("/users");
}

export function changeUserPassword(id: string, password: string) {
  return api.put<{ ok: boolean }>(`/users/${id}/password`, {
    password,
  });
}
