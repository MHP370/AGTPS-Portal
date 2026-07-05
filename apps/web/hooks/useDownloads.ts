"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createDownload,
  deleteDownload,
  downloadsQueryKey,
  getAdminDownloads,
  getDownloads,
  updateDownload,
  type CreateDownloadDto,
} from "@/lib/downloads";

export function useDownloads() {
  return useQuery({
    queryKey: downloadsQueryKey,
    queryFn: getDownloads,
  });
}

export function useAdminDownloads() {
  return useQuery({
    queryKey: [...downloadsQueryKey, "admin"],
    queryFn: getAdminDownloads,
  });
}

export function useCreateDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateDownloadDto) => createDownload(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: downloadsQueryKey });
    },
  });
}

export function useUpdateDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateDownloadDto>;
    }) => updateDownload(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: downloadsQueryKey });
    },
  });
}

export function useDeleteDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDownload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: downloadsQueryKey });
    },
  });
}
