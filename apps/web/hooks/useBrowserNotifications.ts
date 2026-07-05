"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { PortalNotification } from "@/lib/notifications";

export function useBrowserNotifications(
  notifications: PortalNotification[],
) {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const shownNotificationIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    setPermission(Notification.permission);
  }, []);

  const isSupported = useMemo(
    () =>
      typeof window !== "undefined" &&
      "Notification" in window,
    [],
  );

  async function requestPermission() {
    if (!isSupported) return "denied" as NotificationPermission;

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    return nextPermission;
  }

  useEffect(() => {
    if (!isSupported || permission !== "granted") return;

    notifications
      .filter((notification) => !notification.readAt)
      .forEach((notification) => {
        if (shownNotificationIds.current.has(notification.id)) {
          return;
        }

        shownNotificationIds.current.add(notification.id);

        const browserNotification = new Notification(notification.title, {
          body: notification.body || "اعلان جدید در پورتال",
          tag: notification.id,
          icon: "/images/logo/apgt-logo.png",
        });

        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
        };
      });
  }, [isSupported, notifications, permission]);

  return {
    isSupported,
    permission,
    requestPermission,
  };
}
