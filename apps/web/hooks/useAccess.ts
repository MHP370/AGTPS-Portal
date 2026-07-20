"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  assignPermissionToRole,
  createRole,
  getPermissions,
  getRoles,
  permissionsQueryKey,
  removePermissionFromRole,
  rolesQueryKey,
} from "@/lib/access";

export function useRoles() {
  return useQuery({
    queryKey: rolesQueryKey,
    queryFn: getRoles,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: permissionsQueryKey,
    queryFn: getPermissions,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesQueryKey }),
  });
}

export function useToggleRolePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleId,
      permissionId,
      enabled,
    }: {
      roleId: string;
      permissionId: string;
      enabled: boolean;
    }) =>
      enabled
        ? assignPermissionToRole(roleId, permissionId)
        : removePermissionFromRole(roleId, permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    },
  });
}
