import { api } from "./api";
import type { Meeting } from "./meetings";
import type { PortalReminder, PortalTask } from "./workspace";

export interface PortalNotification {
  id: string;
  type: string;
  title: string;
  body?: string;
  recipientEmail?: string;
  scheduledAt?: string | null;
  sentAt?: string | null;
  readAt?: string | null;
  meetingId?: string | null;
  reminderId?: string | null;
  taskId?: string | null;
  trainingId?: string | null;
  eventKey?: string | null;
  targetUrl?: string | null;
  meeting?: Meeting | null;
  reminder?: PortalReminder | null;
  task?: PortalTask | null;
  createdAt: string;
}

export interface PushConfig {
  enabled: boolean;
  publicKey: string | null;
}

export const notificationsQueryKey = ["notifications"];

export function getNotificationTargetDate(notification: PortalNotification) {
  if (notification.meeting?.startAt) {
    return notification.meeting.startAt;
  }

  if (notification.reminder?.remindAt) {
    return notification.reminder.remindAt;
  }

  if (notification.task?.dueDate) {
    return notification.task.dueDate;
  }

  return null;
}

export function getNotificationTargetUrl(notification: PortalNotification) {
  if (notification.targetUrl) return notification.targetUrl;

  if (notification.type === "DIRECT_MESSAGE") {
    return "/admin/direct-messages";
  }

  if (notification.meetingId) {
    return `/?notification=${notification.meetingId}&type=meeting`;
  }

  if (notification.reminderId) {
    return `/?notification=${notification.reminderId}&type=reminder`;
  }

  if (notification.taskId) {
    return `/?notification=${notification.taskId}&type=task`;
  }

  return "/";
}

export function getNotifications() {
  return api.get<PortalNotification[]>("/notifications");
}

export function markNotificationRead(id: string) {
  return api.put<PortalNotification>(`/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return api.put<{ ok: boolean }>("/notifications/read-all");
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
