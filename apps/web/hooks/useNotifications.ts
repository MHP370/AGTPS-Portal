"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getNotifications,
  markNotificationRead,
  notificationsQueryKey,
} from "@/lib/notifications";

export function useNotifications() {
  return useQuery({
    queryKey: notificationsQueryKey,
    queryFn: getNotifications,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationsQueryKey,
      });
    },
  });
}
