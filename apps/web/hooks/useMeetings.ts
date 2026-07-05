"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createMeeting,
  deleteMeeting,
  getAdminMeetings,
  getMeetings,
  meetingsQueryKey,
  updateMeeting,
  type CreateMeetingDto,
} from "@/lib/meetings";

export function useMeetings() {
  return useQuery({
    queryKey: meetingsQueryKey,
    queryFn: getMeetings,
  });
}

export function useAdminMeetings() {
  return useQuery({
    queryKey: [...meetingsQueryKey, "admin"],
    queryFn: getAdminMeetings,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMeetingDto) => createMeeting(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingsQueryKey });
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateMeetingDto>;
    }) => updateMeeting(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingsQueryKey });
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingsQueryKey });
    },
  });
}
