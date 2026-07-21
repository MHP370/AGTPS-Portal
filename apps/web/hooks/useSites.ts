"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createSite,
  deleteSite,
  getPortalSites,
  getPortalWeather,
  getSites,
  portalSiteQueryKey,
  portalWeatherQueryKey,
  siteQueryKey,
  updateSite,
  type CreateSiteDto,
} from "@/lib/sites";

export function useSites(enabled = true) {
  return useQuery({
    queryKey: siteQueryKey,
    queryFn: getSites,
    enabled,
  });
}

export function usePortalSites(enabled = true) {
  return useQuery({
    queryKey: portalSiteQueryKey,
    queryFn: getPortalSites,
    enabled,
  });
}

export function usePortalWeather() {
  return useQuery({
    queryKey: portalWeatherQueryKey,
    queryFn: getPortalWeather,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateSiteDto) =>
      createSite(dto),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: siteQueryKey,
      });
      queryClient.invalidateQueries({ queryKey: portalSiteQueryKey });
      queryClient.invalidateQueries({ queryKey: portalWeatherQueryKey });
    },
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateSiteDto>;
    }) => updateSite(id, dto),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: siteQueryKey,
      });
      queryClient.invalidateQueries({ queryKey: portalSiteQueryKey });
      queryClient.invalidateQueries({ queryKey: portalWeatherQueryKey });
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteSite(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: siteQueryKey,
      });
      queryClient.invalidateQueries({ queryKey: portalSiteQueryKey });
      queryClient.invalidateQueries({ queryKey: portalWeatherQueryKey });
    },
  });
}
