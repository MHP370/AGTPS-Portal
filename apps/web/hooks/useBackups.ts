"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  backupsQueryKey,
  createBackup,
  deleteBackup,
  getBackupRestoreJobs,
  getBackupSettings,
  getBackups,
  restoreBackup,
  updateBackupSettings,
  type BackupSettings,
  type CreateBackupDto,
  type RestoreBackupDto,
} from "@/lib/backups";

export function useBackups() {
  return useQuery({
    queryKey: backupsQueryKey,
    queryFn: getBackups,
  });
}

export function useBackupSettings() {
  return useQuery({
    queryKey: [...backupsQueryKey, "settings"],
    queryFn: getBackupSettings,
  });
}

export function useBackupRestoreJobs() {
  return useQuery({
    queryKey: [...backupsQueryKey, "restore-jobs"],
    queryFn: getBackupRestoreJobs,
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBackupDto) => createBackup(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupsQueryKey });
    },
  });
}

export function useDeleteBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupsQueryKey });
    },
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: RestoreBackupDto;
    }) => restoreBackup(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupsQueryKey });
    },
  });
}

export function useUpdateBackupSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: Partial<BackupSettings>) => updateBackupSettings(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupsQueryKey });
    },
  });
}
