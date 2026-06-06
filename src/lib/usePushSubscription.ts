"use client";

import { useCallback, useEffect, useState } from "react";

type State =
  | { status: "loading" }
  | { status: "unsupported" }
  | { status: "denied" }
  | { status: "default" } // 未許可・購読なし
  | { status: "subscribed"; subscription: PushSubscription };

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; ++i) view[i] = raw.charCodeAt(i);
  return buf;
}

function subToStored(sub: PushSubscription) {
  const json = sub.toJSON();
  return {
    endpoint: json.endpoint!,
    keys: {
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
  };
}

/**
 * Web Push 購読の管理 + サーバーとの同期。
 *
 * - subscribe(matchIds): 通知許可を求めて購読、matchIds を初期同期
 * - sync(matchIds): 既に購読済みの場合、サーバー上の matchIds を最新化
 * - unsubscribe(): 購読解除
 */
export function usePushSubscription(): {
  state: State;
  subscribe: (matchIds: string[]) => Promise<boolean>;
  sync: (matchIds: string[]) => Promise<void>;
  unsubscribe: () => Promise<void>;
} {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState({ status: "unsupported" });
        return;
      }
      if (Notification.permission === "denied") {
        setState({ status: "denied" });
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        setState({ status: "subscribed", subscription: sub });
      } else {
        setState({ status: "default" });
      }
    })().catch(() => {
      setState({ status: "unsupported" });
    });
  }, []);

  const subscribe = useCallback(async (matchIds: string[]): Promise<boolean> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setState({ status: perm === "denied" ? "denied" : "default" });
      return false;
    }
    // SW 登録（既に登録済みなら使い回す）
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await navigator.serviceWorker.register("/sw.js");
    }
    await navigator.serviceWorker.ready;

    // VAPID 公開鍵を取得
    const keyRes = await fetch("/api/push/vapid-key");
    if (!keyRes.ok) return false;
    const { publicKey } = (await keyRes.json()) as { publicKey: string };

    // 購読
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    // サーバーに同期
    await fetch("/api/push/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: subToStored(sub),
        matchIds,
      }),
    });

    setState({ status: "subscribed", subscription: sub });
    return true;
  }, []);

  const sync = useCallback(
    async (matchIds: string[]) => {
      if (state.status !== "subscribed") return;
      await fetch("/api/push/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subToStored(state.subscription),
          matchIds,
        }),
      });
    },
    [state],
  );

  const unsubscribe = useCallback(async () => {
    if (state.status !== "subscribed") return;
    try {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: state.subscription.endpoint }),
      });
      await state.subscription.unsubscribe();
    } finally {
      setState({ status: "default" });
    }
  }, [state]);

  return { state, subscribe, sync, unsubscribe };
}
