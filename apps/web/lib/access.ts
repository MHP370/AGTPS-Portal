import { api } from "./api";

export interface Permission {
  id: string;
  name: string;
  title: string;
}

export interface Role {
  id: string;
  name: string;
  title: string;
  permissions: Array<{
    permission: Permission;
  }>;
}

export const rolesQueryKey = ["roles"];
export const permissionsQueryKey = ["permissions"];

export function getRoles() {
  return api.get<Role[]>("/roles");
}

export function getPermissions() {
  return api.get<Permission[]>("/permissions");
}

export function assignPermissionToRole(
  roleId: string,
  permissionId: string,
) {
  return api.post(`/roles/${roleId}/permissions`, {
    permissionId,
  });
}

export function removePermissionFromRole(
  roleId: string,
  permissionId: string,
) {
  return api.delete(`/roles/${roleId}/permissions/${permissionId}`);
}
