"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  getPushConfig,
  getNotificationTargetUrl,
  subscribeToPushNotifications,
  type PortalNotification,
} from "@/lib/notifications";
import { getStoredAuthUser } from "@/lib/auth";

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

async function subscribeBrowserPushIfAvailable(isPushSupported: boolean) {
  if (!isPushSupported) return false;

  const config = await getPushConfig();
  if (!config.enabled || !config.publicKey) return false;

  const registration = await navigator.serviceWorker.register("/sw.js");
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.publicKey),
    }));
  const currentUser = getStoredAuthUser();

  await subscribeToPushNotifications(subscription.toJSON(), {
    recipientDirectoryUserId: currentUser?.directoryUser?.id,
    recipientEmail: currentUser?.email ?? undefined,
  });

  return true;
}

export function useBrowserNotifications(notifications: PortalNotification[]) {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const shownNotificationIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPermission(Notification.permission);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const syncPermission = () => setPermission(Notification.permission);
    window.addEventListener("focus", syncPermission);
    document.addEventListener("visibilitychange", syncPermission);

    return () => {
      window.removeEventListener("focus", syncPermission);
      document.removeEventListener("visibilitychange", syncPermission);
    };
  }, []);

  const isSupported = useMemo(
    () => typeof window !== "undefined" && "Notification" in window,
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
    if (Notification.permission === "denied") {
      setPermission("denied");
      return "denied" as NotificationPermission;
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);

    if (nextPermission === "granted") {
      const subscribed = await subscribeBrowserPushIfAvailable(isPushSupported);
      if (subscribed) {
        setPushEnabled(true);
        setIsPushSubscribed(true);
      }
    }

    return nextPermission;
  }

  useEffect(() => {
    if (!isPushSupported || permission !== "granted" || !pushEnabled) {
      return;
    }

    void subscribeBrowserPushIfAvailable(isPushSupported).then((subscribed) => {
      if (subscribed) {
        setPushEnabled(true);
        setIsPushSubscribed(true);
      }
    });
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
          window.location.assign(getNotificationTargetUrl(notification));
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
