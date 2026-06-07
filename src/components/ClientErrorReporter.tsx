"use client";

import { useEffect } from "react";

/**
 * クライアント側で発生した未捕捉エラー / Promise rejection を /api/log-error に送る。
 * - 同一エラー (message+1st stackline) は 30 秒以内 1 回だけ
 * - dev では送らない（ノイズ防止）
 * - 自分自身のレポート fetch が失敗してもループしない
 */
export function ClientErrorReporter() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;

    const recent = new Map<string, number>();
    const DEDUPE_MS = 30_000;
    let reportingNow = false;

    const send = (
      message: string,
      stack: string | undefined,
      origin: string,
    ) => {
      if (reportingNow) return;
      const key = message + "|" + (stack?.split("\n")[1] ?? "");
      const now = Date.now();
      const last = recent.get(key) ?? 0;
      if (now - last < DEDUPE_MS) return;
      recent.set(key, now);

      let userId = "";
      try {
        userId = window.localStorage.getItem("ninety.userId") ?? "";
      } catch {
        // ignore
      }

      reportingNow = true;
      void fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[${origin}] ${message}`,
          stack,
          url: window.location.pathname + window.location.search,
          userAgent: window.navigator.userAgent,
          userId: userId || undefined,
        }),
        keepalive: true,
      })
        .catch(() => {
          /* never throw from reporter */
        })
        .finally(() => {
          reportingNow = false;
        });
    };

    const onError = (e: ErrorEvent) => {
      if (!e?.message) return;
      // Next.js / 自身が出した /api/log-error fetch のエラーは無視
      if (String(e.message).includes("/api/log-error")) return;
      send(e.message, e.error?.stack, "window.error");
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e?.reason;
      const message =
        typeof reason === "string"
          ? reason
          : reason?.message ?? String(reason ?? "unknown rejection");
      const stack =
        typeof reason === "object" && reason !== null
          ? (reason as { stack?: string }).stack
          : undefined;
      send(message, stack, "unhandledrejection");
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
