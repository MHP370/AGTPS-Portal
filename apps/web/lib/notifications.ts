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

export interface PushConfig {
  enabled: boolean;
  publicKey: string | null;
}

export const notificationsQueryKey = ["notifications"];

export function getNotifications() {
  return api.get<PortalNotification[]>("/notifications");
}

export function markNotificationRead(id: string) {
  return api.put<PortalNotification>(`/notifications/${id}/read`);
}

export function getPushConfig() {
  return api.get<PushConfig>("/notifications/push/config");
}

export function subscribeToPushNotifications(
  subscription: PushSubscriptionJSON,
  recipient?: {
    recipientDirectoryUserId?: string;
    recipientEmail?: string;
  },
) {
  return api.post("/notifications/push/subscribe", {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    ...recipient,
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  });
}
