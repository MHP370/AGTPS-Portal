import { api } from "./api";
import type { Role } from "./access";

export type DirectorySource = "INTERNAL" | "ACTIVE_DIRECTORY";

export interface DirectoryUser {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  department?: string;
  title?: string;
  source: DirectorySource;
  isActive: boolean;
  groupMemberships?: Array<{
    group: DirectoryGroup;
  }>;
}

export interface DirectoryGroup {
  id: string;
  name: string;
  title: string;
  description?: string;
  source: DirectorySource;
  isActive: boolean;
  members: Array<{
    user: DirectoryUser;
  }>;
  roles: Array<{
    role: Role;
  }>;
}

export interface CreateDirectoryUserDto {
  username: string;
  displayName: string;
  email?: string;
  department?: string;
  title?: string;
  source?: DirectorySource;
  isActive?: boolean;
  groupIds?: string[];
}

export interface CreateDirectoryGroupDto {
  name: string;
  title: string;
  description?: string;
  source?: DirectorySource;
  isActive?: boolean;
}

export const directoryUsersQueryKey = ["directory", "users"];
export const directoryGroupsQueryKey = ["directory", "groups"];

export function getDirectoryUsers() {
  return api.get<DirectoryUser[]>("/directory/users");
}

export function createDirectoryUser(dto: CreateDirectoryUserDto) {
  return api.post<DirectoryUser>("/directory/users", dto);
}

export function deleteDirectoryUser(id: string) {
  return api.delete<void>(`/directory/users/${id}`);
}

export function getDirectoryGroups() {
  return api.get<DirectoryGroup[]>("/directory/groups");
}

export function createDirectoryGroup(dto: CreateDirectoryGroupDto) {
  return api.post<DirectoryGroup>("/directory/groups", dto);
}

export function updateDirectoryGroupMembers(
  id: string,
  userIds: string[],
) {
  return api.put<DirectoryGroup>(`/directory/groups/${id}/members`, {
    userIds,
  });
}

export function updateDirectoryGroupRoles(
  id: string,
  roleIds: string[],
) {
  return api.put<DirectoryGroup>(`/directory/groups/${id}/roles`, {
    roleIds,
  });
}

export function deleteDirectoryGroup(id: string) {
  return api.delete<void>(`/directory/groups/${id}`);
}
