"use client";

import { useEffect, useState } from "react";
import { usePushSubscription } from "../lib/usePushSubscription";
import { useReminderMatches } from "../lib/useReminderMatches";

/**
 * Web Push 通知の ON/OFF UI。
 * /reminders ページに置く前提。
 *
 * - 初回: 「試合15分前に通知」ボタン → 許可ダイアログ → サーバーに購読登録
 * - 購読中: 「通知ON」表示 + ベル変更時に自動同期
 * - 拒否済み: iOS設定への案内
 */
export function PushNotificationToggle() {
  const { state, subscribe, sync, unsubscribe } = usePushSubscription();
  const { matches } = useReminderMatches();
  const [busy, setBusy] = useState(false);

  // ベルの変更を自動でサーバー側にも反映
  useEffect(() => {
    if (state.status === "subscribed") {
      void sync(matches);
    }
  }, [matches, state.status, sync]);

  if (state.status === "loading") {
    return <div className="h-12 mx-4 mt-4 glass rounded-xl animate-pulse" />;
  }

  if (state.status === "unsupported") {
    return (
      <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-white/4 border border-white/8 text-[12px] text-white/65 leading-relaxed">
        この端末・ブラウザはプッシュ通知に対応していません。
        iPhoneの場合は <strong className="text-white">Safari でホーム画面に追加</strong> したアプリから開いてください。
      </div>
    );
  }

  if (state.status === "denied") {
    return (
      <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-400/30 text-[12px] text-amber-100/90 leading-relaxed">
        通知が拒否されています。<br />
        <span className="text-white/75">
          iPhone の<strong>設定 &gt; 通知 &gt; 90</strong> から「通知を許可」をONにしてください。
        </span>
      </div>
    );
  }

  if (state.status === "subscribed") {
    return (
      <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-blue-500/12 border border-blue-400/40 flex items-center gap-3">
        <span className="text-[20px]">🔔</span>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-white">通知ON</p>
          <p className="text-[11px] text-white/65 mt-0.5">
            ベルでマークした試合の15分前に通知が届きます
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
    );
  }

  // default — 未許可
  return (
    <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-blue-500/8 border border-blue-400/30">
      <p className="text-[13px] font-semibold text-white mb-1">
        🔔 試合の15分前に通知
      </p>
      <p className="text-[11px] text-white/65 mb-2.5 leading-relaxed">
        ベルでマークした試合がもうすぐ始まる時に、iPhoneにバナー通知を送ります。
      </p>
      <button
        onClick={async () => {
          setBusy(true);
          try {
            await subscribe(matches);
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
