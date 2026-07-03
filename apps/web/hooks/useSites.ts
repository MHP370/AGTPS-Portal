"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createSite,
  deleteSite,
  getSites,
  siteQueryKey,
  updateSite,
  type CreateSiteDto,
} from "@/lib/sites";

export function useSites() {
  return useQuery({
    queryKey: siteQueryKey,
    queryFn: getSites,
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
    },
  });
}
