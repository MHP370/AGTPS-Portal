import { api } from "./api";

export interface PortalNotification {
  id: string;
  type: string;
  title: string;
  body?: string;
  recipientEmail?: string;
  scheduledAt?: string | null;
  sentAt?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export const notificationsQueryKey = ["notifications"];

export function getNotifications() {
  return api.get<PortalNotification[]>("/notifications");
}

export function markNotificationRead(id: string) {
  return api.put<PortalNotification>(`/notifications/${id}/read`);
}
