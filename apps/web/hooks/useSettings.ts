"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getSettings,
  settingsQueryKey,
  testActiveDirectoryConnection,
  updateSettings,
  type UpdatePortalSettingsDto,
} from "@/lib/settings";

export function useSettings() {
  return useQuery({
    queryKey: settingsQueryKey,
    queryFn: getSettings,
  });
}

export function useTestActiveDirectoryConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: testActiveDirectoryConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settingsQueryKey,
      });
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdatePortalSettingsDto) =>
      updateSettings(dto),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settingsQueryKey,
      });
    },
  });
}
