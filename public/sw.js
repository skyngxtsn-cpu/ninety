// Service Worker for 90 — handles Web Push notifications

self.addEventListener("install", (event) => {
  // 即座にアクティブに
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // すべてのクライアントを直ちに掌握
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "90", body: event.data ? event.data.text() : "通知" };
  }

  const title = data.title || "90 — 試合がまもなく始まります";
  const options = {
    body: data.body || "ベルでマークした試合がもうすぐキックオフです",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: data.tag || "match-reminder",
    data: {
      url: data.url || "/",
      matchId: data.matchId,
    },
    requireInteraction: false,
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // 既にアプリが開いていたらそのタブを使う
      for (const client of allClients) {
        if (client.url.endsWith(url) && "focus" in client) {
          return client.focus();
        }
      }
      // なければ新しいウィンドウを開く
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })(),
  );
});
