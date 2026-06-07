"use client";

import { useEffect, useMemo, useState } from "react";
import {
  usePushSubscription,
  type SyncPayload,
} from "../lib/usePushSubscription";
import { useReminderMatches } from "../lib/useReminderMatches";
import { useFavoriteTeams } from "../lib/useFavoriteTeams";
import {
  useNotificationPreferences,
  useSpoilerBlock,
} from "../lib/preferences";

/**
 * Web Push 通知の ON/OFF UI + サーバー同期。
 * preferences・推しチーム・ベルの変更を全部サーバーに反映する。
 */
export function PushNotificationToggle() {
  const { state, subscribe, sync, unsubscribe } = usePushSubscription();
  const { matches } = useReminderMatches();
  const { teams: favoriteTeamIds } = useFavoriteTeams();
  const { prefs } = useNotificationPreferences();
  const { blocked: spoilerBlock } = useSpoilerBlock();
  const [busy, setBusy] = useState(false);

  const payload: SyncPayload = useMemo(
    () => ({
      matchIds: matches,
      favoriteTeamIds,
      preferences: prefs,
      spoilerBlock,
    }),
    [matches, favoriteTeamIds, prefs, spoilerBlock],
  );

  // 状態の変更をサーバーに即同期
  useEffect(() => {
    if (state.status === "subscribed") {
      void sync(payload);
    }
  }, [payload, state.status, sync]);

  if (state.status === "loading") {
    return <div className="h-12 mx-4 mt-4 glass rounded-xl animate-pulse" />;
  }

  if (state.status === "unsupported") {
    return (
      <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-white/4 border border-white/8 text-[12px] text-white/65 leading-relaxed">
        この端末・ブラウザはプッシュ通知に対応していません。
        iPhoneの場合は <strong className="text-white">Safari でホーム画面に追加</strong>{" "}
        したアプリから開いてください。
      </div>
    );
  }

  if (state.status === "denied") {
    return (
      <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-400/30 text-[12px] text-amber-100/90 leading-relaxed">
        通知が拒否されています。
        <br />
        <span className="text-white/75">
          iPhone の<strong>設定 &gt; 通知 &gt; 90</strong> から「通知を許可」をONにしてください。
        </span>
      </div>
    );
  }

  if (state.status === "subscribed") {
    const sendTest = async () => {
      setBusy(true);
      try {
        const j = state.subscription.toJSON();
        const res = await fetch("/api/push/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: {
              endpoint: j.endpoint,
              keys: { p256dh: j.keys?.p256dh, auth: j.keys?.auth },
            },
          }),
        });
        if (!res.ok) {
          alert("テスト通知の送信に失敗しました");
        }
      } finally {
        setBusy(false);
      }
    };
    return (
      <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-blue-500/12 border border-blue-400/40">
        <div className="flex items-center gap-3">
          <span className="text-[20px]">🔔</span>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white">通知ON</p>
            <p className="text-[11px] text-white/65 mt-0.5">
              推しチーム・ベルマーク試合の通知が届きます
            </p>
          </div>
          <button
            onClick={async () => {
              setBusy(true);
              try {
                await unsubscribe();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-[11px] font-semibold text-white/85 hover:bg-white/15 disabled:opacity-50"
          >
            OFF
          </button>
        </div>
        <button
          onClick={sendTest}
          disabled={busy}
          className="mt-2.5 w-full py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-[12px] font-medium text-white/85 disabled:opacity-50"
        >
          {busy ? "送信中…" : "📨 テスト通知を送る"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-blue-500/8 border border-blue-400/30">
      <p className="text-[13px] font-semibold text-white mb-1">
        🔔 試合の通知を受け取る
      </p>
      <p className="text-[11px] text-white/65 mb-2.5 leading-relaxed">
        推しチームの試合・ベルでマークした試合の事前通知が iPhone に届きます。
        詳しい通知タイミングは設定から調整できます。
      </p>
      <button
        onClick={async () => {
          setBusy(true);
          try {
            await subscribe(payload);
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy}
        className="w-full py-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 text-[13px] font-semibold text-white shadow-lg disabled:opacity-50"
      >
        {busy ? "設定中…" : "通知を有効にする"}
      </button>
    </div>
  );
}
