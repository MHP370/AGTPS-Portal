"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  announcementsQueryKey,
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  type CreateAnnouncementDto,
} from "@/lib/announcements";

export function useAnnouncements() {
  return useQuery({
    queryKey: announcementsQueryKey,
    queryFn: getAnnouncements,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateAnnouncementDto) =>
      createAnnouncement(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: announcementsQueryKey,
      });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateAnnouncementDto>;
    }) => updateAnnouncement(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: announcementsQueryKey,
      });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: announcementsQueryKey,
      });
    },
  });
}
