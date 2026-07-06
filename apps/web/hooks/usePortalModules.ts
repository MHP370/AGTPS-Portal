"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  adminPortalModulesQueryKey,
  getAdminPortalModules,
  getEnabledPortalModules,
  portalModulesQueryKey,
  updatePortalModule,
  type UpdatePortalModuleDto,
} from "@/lib/portal-modules";

export function useEnabledPortalModules() {
  return useQuery({
    queryKey: portalModulesQueryKey,
    queryFn: getEnabledPortalModules,
  });
}

export function useAdminPortalModules() {
  return useQuery({
    queryKey: adminPortalModulesQueryKey,
    queryFn: getAdminPortalModules,
  });
}

export function useUpdatePortalModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      dto,
    }: {
      key: string;
      dto: UpdatePortalModuleDto;
    }) => updatePortalModule(key, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: portalModulesQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: adminPortalModulesQueryKey,
      });
    },
  });
}
