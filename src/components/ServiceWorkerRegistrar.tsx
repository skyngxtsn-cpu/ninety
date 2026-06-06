"use client";

import { useEffect } from "react";

/**
 * Service Worker をバックグラウンドで登録する。
 * 通知の購読開始（PushNotificationToggle）でも必要だが、
 * Push 以外のキャッシング機能を将来追加することも想定して、
 * 起動時に黙って登録しておく。
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // 登録失敗は無視（PWA未対応等）
    });
  }, []);
  return null;
}
