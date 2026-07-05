"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createDirectoryGroup,
  createDirectoryUser,
  deleteDirectoryGroup,
  deleteDirectoryUser,
  directoryGroupsQueryKey,
  directoryUsersQueryKey,
  getDirectoryGroups,
  getDirectoryUsers,
  updateDirectoryGroupMembers,
  type CreateDirectoryGroupDto,
  type CreateDirectoryUserDto,
} from "@/lib/directory";

export function useDirectoryUsers() {
  return useQuery({
    queryKey: directoryUsersQueryKey,
    queryFn: getDirectoryUsers,
  });
}

export function useDirectoryGroups() {
  return useQuery({
    queryKey: directoryGroupsQueryKey,
    queryFn: getDirectoryGroups,
  });
}

export function useCreateDirectoryUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateDirectoryUserDto) =>
      createDirectoryUser(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: directoryUsersQueryKey,
      });
    },
  });
}

export function useDeleteDirectoryUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDirectoryUser,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: directoryUsersQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: directoryGroupsQueryKey,
      });
    },
  });
}

export function useCreateDirectoryGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateDirectoryGroupDto) =>
      createDirectoryGroup(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: directoryGroupsQueryKey,
      });
    },
  });
}

export function useUpdateDirectoryGroupMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      userIds,
    }: {
      id: string;
      userIds: string[];
    }) => updateDirectoryGroupMembers(id, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: directoryGroupsQueryKey,
      });
    },
  });
}

export function useDeleteDirectoryGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDirectoryGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: directoryGroupsQueryKey,
      });
    },
  });
}
