self.addEventListener("push", (event) => {
  let payload = {
    title: "اعلان جدید",
    body: "اعلان جدید در پورتال",
    url: "/",
  };

  if (event.data) {
    try {
      payload = {
        ...payload,
        ...event.data.json(),
      };
    } catch {}
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/images/logo/apgt-logo.png",
      badge: "/images/logo/apgt-logo.png",
      tag: payload.notificationId,
      data: {
        url: payload.url || "/",
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clients) => {
        const existingClient = clients.find((client) =>
          client.url.endsWith(targetUrl),
        );

        if (existingClient) {
          return existingClient.focus();
        }

        return self.clients.openWindow(targetUrl);
      }),
  );
});
