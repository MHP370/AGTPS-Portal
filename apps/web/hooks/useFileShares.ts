"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createFileShare,
  deleteFileShare,
  fileSharesQueryKey,
  getAdminFileShares,
  getFileShareAudit,
  getFileShareItems,
  getFileShares,
  updateFileShare,
  type CreateFileShareDto,
} from "@/lib/file-shares";

export function useFileShares() {
  return useQuery({
    queryKey: fileSharesQueryKey,
    queryFn: getFileShares,
  });
}

export function useAdminFileShares() {
  return useQuery({
    queryKey: [...fileSharesQueryKey, "admin"],
    queryFn: getAdminFileShares,
  });
}

export function useFileShareAudit() {
  return useQuery({
    queryKey: [...fileSharesQueryKey, "audit"],
    queryFn: getFileShareAudit,
  });
}

export function useFileShareItems(shareId?: string, path = "") {
  return useQuery({
    queryKey: [...fileSharesQueryKey, shareId, "items", path],
    queryFn: () => getFileShareItems(shareId!, path),
    enabled: Boolean(shareId),
  });
}

export function useCreateFileShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateFileShareDto) => createFileShare(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileSharesQueryKey });
    },
  });
}

export function useUpdateFileShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateFileShareDto>;
    }) => updateFileShare(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileSharesQueryKey });
    },
  });
}

export function useDeleteFileShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFileShare,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileSharesQueryKey });
    },
  });
}
