"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  getPushConfig,
  subscribeToPushNotifications,
  type PortalNotification,
} from "@/lib/notifications";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`
    .replaceAll("-", "+")
    .replaceAll("_", "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export function useBrowserNotifications(
  notifications: PortalNotification[],
) {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
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

  const isPushSupported = useMemo(
    () =>
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window,
    [],
  );

  useEffect(() => {
    if (!isPushSupported) return;

    getPushConfig()
      .then((config) => {
        setPushEnabled(config.enabled && Boolean(config.publicKey));
      })
      .catch(() => {
        setPushEnabled(false);
      });
  }, [isPushSupported]);

  async function requestPermission() {
    if (!isSupported) return "denied" as NotificationPermission;

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);

    if (nextPermission === "granted") {
      await subscribeToBrowserPush();
    }

    return nextPermission;
  }

  async function subscribeToBrowserPush() {
    if (!isPushSupported) return;

    const config = await getPushConfig();
    if (!config.enabled || !config.publicKey) return;

    const registration = await navigator.serviceWorker.register(
      "/sw.js",
    );
    const existingSubscription =
      await registration.pushManager.getSubscription();
    const subscription =
      existingSubscription ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          config.publicKey,
        ),
      }));

    await subscribeToPushNotifications(subscription.toJSON());
    setPushEnabled(true);
    setIsPushSubscribed(true);
  }

  useEffect(() => {
    if (
      !isPushSupported ||
      permission !== "granted" ||
      !pushEnabled
    ) {
      return;
    }

    void subscribeToBrowserPush();
  }, [isPushSupported, permission, pushEnabled]);

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
    isPushSupported,
    pushEnabled,
    isPushSubscribed,
    permission,
    requestPermission,
  };
}
