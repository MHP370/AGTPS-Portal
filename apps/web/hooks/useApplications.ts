"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  applicationQueryKey,
  createApplication,
  deleteApplication,
  getApplications,
  updateApplication,
  type CreateApplicationDto,
} from "@/lib/applications";

export function useApplications() {
  return useQuery({
    queryKey: applicationQueryKey,
    queryFn: getApplications,
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
    },
  });
}
