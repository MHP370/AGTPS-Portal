"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  applicationQueryKey,
  createApplication,
  createApplicationSite,
  deleteApplication,
  deleteApplicationSite,
  getApplications,
  getPortalApplications,
  portalApplicationQueryKey,
  updateApplication,
  updateApplicationSite,
  type CreateApplicationSiteDto,
  type CreateApplicationDto,
  type UpdateApplicationSiteDto,
} from "@/lib/applications";

export function useApplications() {
  return useQuery({
    queryKey: applicationQueryKey,
    queryFn: getApplications,
  });
}

export function usePortalApplications() {
  return useQuery({
    queryKey: portalApplicationQueryKey,
    queryFn: getPortalApplications,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateApplicationDto) =>
      createApplication(dto),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: applicationQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: portalApplicationQueryKey,
      });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateApplicationDto>;
    }) => updateApplication(id, dto),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: applicationQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: portalApplicationQueryKey,
      });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteApplication(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: applicationQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: portalApplicationQueryKey,
      });
    },
  });
}

export function useCreateApplicationSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateApplicationSiteDto) =>
      createApplicationSite(dto),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: applicationQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: portalApplicationQueryKey,
      });
    },
  });
}

export function useUpdateApplicationSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateApplicationSiteDto;
    }) => updateApplicationSite(id, dto),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: applicationQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: portalApplicationQueryKey,
      });
    },
  });
}

export function useDeleteApplicationSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteApplicationSite(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: applicationQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: portalApplicationQueryKey,
      });
    },
  });
}
