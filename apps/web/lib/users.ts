import { api } from "./api";
import type { DirectoryUser } from "./directory";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  personnelCode?: string | null;
  birthDate?: string | null;
  allowEmailChange: boolean;
  allowPasswordChange: boolean;
  allowProfileEdit: boolean;
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

export interface UpdateAdminUserProfileDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  personnelCode?: string;
  birthDate?: string;
  isActive?: boolean;
  allowEmailChange?: boolean;
  allowPasswordChange?: boolean;
  allowProfileEdit?: boolean;
  newPassword?: string;
}

export function getUsers() {
  return api.get<AdminUser[]>("/users");
}

export function updateAdminUserProfile(
  id: string,
  dto: UpdateAdminUserProfileDto,
) {
  return api.put<AdminUser[]>(`/users/${id}/profile`, dto);
}

export function changeUserPassword(id: string, password: string) {
  return api.put<{ ok: boolean }>(`/users/${id}/password`, {
    password,
  });
}
