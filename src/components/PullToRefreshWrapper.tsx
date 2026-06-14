"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * ページ最上部から下にフリックで router.refresh() を呼ぶ。
 *
 * 仕様:
 *  - window.scrollY > 0 なら無視（内部スクロールと干渉しない）
 *  - 80px 引っ張ったら離した瞬間に更新
 *  - 「↓ 引っ張って更新」→「離して更新 ↻」→「🔄 更新中…」のインジケータ表示
 *  - 全ページに適用（layout.tsx でラップ）
 */
const THRESHOLD = 80;
const MAX_PULL = 120;
const PULL_RESISTANCE = 0.5; // 引っ張りの抵抗感（1 だと指の動きそのまま）

export function PullToRefreshWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pull, setPull] = useState(0);
  // タッチ追跡は再描画を起こさないため ref で管理
  const startYRef = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      if (e.touches.length !== 1) return;
      startYRef.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null) return;
      if (e.touches.length !== 1) return;
      const dy = e.touches[0].clientY - startYRef.current;
      // 上方向のスワイプはそのまま素通し
      if (dy <= 0) {
        if (pullRef.current !== 0) {
          pullRef.current = 0;
          setPull(0);
        }
        return;
      }
      const next = Math.min(dy * PULL_RESISTANCE, MAX_PULL);
      if (Math.abs(next - pullRef.current) > 1) {
        pullRef.current = next;
        setPull(next);
      }
    };

    const onTouchEnd = () => {
      if (startYRef.current === null) return;
      const shouldRefresh = pullRef.current >= THRESHOLD;
      startYRef.current = null;
      pullRef.current = 0;
      setPull(0);
      if (shouldRefresh) {
        // ハプティック（対応端末のみ）
        if ("vibrate" in navigator) {
          try {
            navigator.vibrate(20);
          } catch {
            // ignore
          }
        }
        startTransition(() => router.refresh());
      }
    };

    const onTouchCancel = () => {
      startYRef.current = null;
      pullRef.current = 0;
      setPull(0);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [router]);

  // 表示するインジケータ状態
  const showIndicator = pull > 0 || isPending;
  const reached = pull >= THRESHOLD;

  return (
    <>
      {showIndicator && (
        <div
          aria-hidden
          className="fixed left-0 right-0 z-50 pointer-events-none flex justify-center"
          style={{
            top: "env(safe-area-inset-top, 0px)",
            transform: `translateY(${isPending ? 12 : Math.max(0, pull - 8)}px)`,
            transition: isPending ? "transform 150ms ease-out" : "none",
          }}
        >
          <div className="px-3.5 py-1.5 rounded-full glass border border-white/15 text-[11.5px] font-medium text-white/90 shadow-lg backdrop-blur-md">
            {isPending
              ? "🔄 更新中…"
              : reached
                ? "離して更新 ↻"
                : "↓ 引っ張って更新"}
          </div>
        </div>
      )}
      {children}
    </>
  );
}
