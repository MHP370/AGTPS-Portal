"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  checkSystemStatus,
  createSystemStatus,
  deleteSystemStatus,
  getAdminSystemStatuses,
  getSystemStatuses,
  systemStatusesQueryKey,
  updateSystemStatus,
  type CreateSystemStatusDto,
} from "@/lib/system-statuses";

export function useSystemStatuses(enabled = true) {
  return useQuery({
    queryKey: systemStatusesQueryKey,
    queryFn: getSystemStatuses,
    enabled,
  });
}

export function useAdminSystemStatuses() {
  return useQuery({
    queryKey: [...systemStatusesQueryKey, "admin"],
    queryFn: getAdminSystemStatuses,
  });
}

export function useCreateSystemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateSystemStatusDto) => createSystemStatus(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemStatusesQueryKey });
    },
  });
}

export function useUpdateSystemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateSystemStatusDto>;
    }) => updateSystemStatus(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemStatusesQueryKey });
    },
  });
}

export function useDeleteSystemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSystemStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemStatusesQueryKey });
    },
  });
}

export function useCheckSystemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkSystemStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemStatusesQueryKey });
    },
  });
}
