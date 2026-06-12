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
  useDeveloperMode,
} from "../lib/preferences";
import type { NotificationPreferences } from "../lib/push/notification-types";

/**
 * 1カードに統合した通知設定。
 * - 未購読/拒否/未対応: その状態だけ表示
 * - 購読中: ON/OFF + テスト送信 + 通知の内訳 + 静寂時間
 */
export function NotificationCard() {
  const { state, subscribe, sync, unsubscribe } = usePushSubscription();
  const { matches } = useReminderMatches();
  const { teams: favoriteTeamIds } = useFavoriteTeams();
  const { prefs, setPrefs, hydrated: prefsHydrated } = useNotificationPreferences();
  const { blocked: spoilerBlock } = useSpoilerBlock();
  const { on: devMode } = useDeveloperMode();
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

  // 設定/推し/ベルの変更を即サーバーに反映
  useEffect(() => {
    if (state.status === "subscribed") {
      void sync(payload);
    }
  }, [payload, state.status, sync]);

  if (state.status === "loading" || !prefsHydrated) {
    return <div className="h-32 mx-4 mt-4 glass rounded-2xl animate-pulse" />;
  }

  if (state.status === "unsupported") {
    return (
      <section className="mx-4 mt-4 glass rounded-2xl p-4">
        <h2 className="text-[14px] font-bold mb-1">🔔 通知</h2>
        <p className="text-[12px] text-white/65 leading-relaxed">
          この端末・ブラウザはプッシュ通知に対応していません。
          iPhone の場合は <strong className="text-white">Safari でホーム画面に追加</strong>{" "}
          したアプリから開いてください。
        </p>
      </section>
    );
  }

  if (state.status === "denied") {
    return (
      <section className="mx-4 mt-4 glass rounded-2xl p-4">
        <h2 className="text-[14px] font-bold mb-1">🔔 通知</h2>
        <p className="text-[12px] text-amber-200/95 leading-relaxed">
          通知が拒否されています。
          <br />
          <span className="text-white/75">
            iPhone の <strong>設定 &gt; 通知 &gt; 90</strong> から「通知を許可」をONにしてください。
          </span>
        </p>
      </section>
    );
  }

  if (state.status === "default") {
    return (
      <section className="mx-4 mt-4 glass rounded-2xl p-4">
        <h2 className="text-[14px] font-bold mb-1">🔔 通知</h2>
        <p className="text-[12px] text-white/65 mb-3 leading-relaxed">
          推しチーム・お気に入り試合の通知が iPhone に届きます。
          詳しい通知タイミングはONにした後で調整できます。
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
      </section>
    );
  }

  // subscribed
  const sendTest = async (type?: string) => {
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
          type,
        }),
      });
      if (!res.ok) {
        alert("テスト通知の送信に失敗しました");
      }
    } finally {
      setBusy(false);
    }
  };

  // 各通知タイプのテスト用ラベル
  const testTypes: { id: string; label: string }[] = [
    { id: "pre-3h", label: "事前 3時間前" },
    { id: "pre-1h", label: "事前 1時間前" },
    { id: "pre-15m", label: "事前 15分前" },
    { id: "lineup", label: "📋 スタメン発表" },
    { id: "kickoff", label: "🟢 キックオフ" },
    { id: "goal", label: "⚽ 得点 (1-0)" },
    { id: "halftime", label: "⏸ ハーフタイム" },
    { id: "halftime-end", label: "▶️ 後半開始" },
    { id: "fulltime", label: "🏁 試合終了" },
    { id: "result", label: "📊 結果 (2-1)" },
    { id: "tournament", label: "🏆 次戦カード" },
    { id: "digest", label: "🌙 ダイジェスト" },
  ];

  const togglePref = (key: keyof NotificationPreferences) => () => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const setQuiet = (start: string, end: string) =>
    setPrefs((p) => ({ ...p, quiet: { start, end } }));
  const clearQuiet = () => setPrefs((p) => ({ ...p, quiet: null }));

  return (
    <section className="mx-4 mt-4 glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-[20px]">🔔</span>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-white">通知 ON</p>
          <p className="text-[11px] text-white/65 mt-0.5">
            推しチーム・お気に入り試合の通知が届きます
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

      {devMode && (
        <details className="rounded-lg bg-amber-500/8 border border-amber-400/30">
          <summary className="cursor-pointer px-3 py-2 text-[12px] font-medium text-amber-100 hover:bg-amber-500/12 select-none rounded-lg">
            🛠 [開発者] テスト通知を送る
          </summary>
          <div className="px-3 pb-3 pt-1 grid grid-cols-2 gap-1.5">
            {testTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => sendTest(t.id)}
                disabled={busy}
                className="px-2 py-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-[11px] text-left text-white/85 disabled:opacity-40 truncate"
                title={t.label}
              >
                {t.label}
              </button>
            ))}
          </div>
        </details>
      )}

      <div className="border-t border-white/10 pt-3 space-y-3">
        <p className="text-[10px] uppercase tracking-wider text-white/45">
          通知の内訳
        </p>
        <ToggleRow
          label="事前通知"
          hint="3時間前 / 1時間前 / 15分前"
          checked={prefs.pre}
          onToggle={togglePref("pre")}
        />
        <ToggleRow
          label="スタメン発表通知"
          hint="試合 1 時間前のスタメン発表をお知らせ"
          checked={prefs.lineup}
          onToggle={togglePref("lineup")}
        />
        <ToggleRow
          label="試合中通知（スコア無し）"
          hint="キックオフ / ハーフタイム / 終了の合図"
          checked={prefs.live}
          onToggle={togglePref("live")}
        />
        <ToggleRow
          label="1日の終わりダイジェスト"
          hint="その日の最終試合終了後に、📜 今日の振り返り（推し + 注目国）＋ 🔜 明日の推し試合を 1 通でお届け"
          checked={prefs.digest}
          onToggle={togglePref("digest")}
        />
      </div>

      <div className="border-t border-white/10 pt-3 space-y-3">
        <p className="text-[10px] uppercase tracking-wider text-white/45">
          ネタバレOK時のみ
        </p>
        <ToggleRow
          label="推しの次戦カード確定"
          hint={
            spoilerBlock
              ? "❌ ネタバレ防止モード ON のため無効中（届く＝推しが勝ち上がったことが分かるため）"
              : "決勝T で次の対戦相手が決まった時にお知らせ"
          }
          checked={!spoilerBlock && prefs.tournament}
          onToggle={togglePref("tournament")}
          disabled={spoilerBlock}
        />
        <ToggleRow
          label="試合結果通知（スコア付き）"
          hint={
            spoilerBlock
              ? "❌ ネタバレ防止モード ON のため無効中"
              : "「日本 2-1 オランダ」など試合結果を含む通知。ONの時は「試合終了（スコア無し）」は届きません"
          }
          checked={!spoilerBlock && prefs.result}
          onToggle={togglePref("result")}
          disabled={spoilerBlock}
        />
        <ToggleRow
          label="⚽ 得点通知（リアルタイム）"
          hint={
            spoilerBlock
              ? "❌ ネタバレ防止モード ON のため無効中"
              : "点が入るたびに「⚽ ゴール！日本 1-0 オランダ (33分・三笘)」のように即配信"
          }
          checked={!spoilerBlock && prefs.goal}
          onToggle={togglePref("goal")}
          disabled={spoilerBlock}
        />
      </div>

      <div className="border-t border-white/10 pt-3">
        <QuietHoursPicker
          quiet={prefs.quiet}
          onChange={setQuiet}
          onClear={clearQuiet}
        />
      </div>
    </section>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 ${disabled ? "opacity-55" : ""}`}>
      <div className="flex-1">
        <p className="text-[13px] font-semibold text-white">{label}</p>
        <p className="text-[11px] text-white/55 mt-0.5 leading-relaxed">
          {hint}
        </p>
      </div>
      <button
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition shadow-inner ${
          checked ? "bg-blue-500" : "bg-white/15"
        } disabled:cursor-not-allowed`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function QuietHoursPicker({
  quiet,
  onChange,
  onClear,
}: {
  quiet: NotificationPreferences["quiet"];
  onChange: (start: string, end: string) => void;
  onClear: () => void;
}) {
  const start = quiet?.start ?? "23:00";
  const end = quiet?.end ?? "07:00";
  const enabled = quiet !== null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-white">静かにしたい時間</p>
        <button
          onClick={enabled ? onClear : () => onChange(start, end)}
          role="switch"
          aria-checked={enabled}
          className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition shadow-inner ${
            enabled ? "bg-blue-500" : "bg-white/15"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
              enabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      {enabled && (
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={start}
            onChange={(e) => onChange(e.target.value, end)}
            className="bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-[13px] text-white"
          />
          <span className="text-[12px] text-white/55">〜</span>
          <input
            type="time"
            value={end}
            onChange={(e) => onChange(start, e.target.value)}
            className="bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-[13px] text-white"
          />
        </div>
      )}
      <p className="text-[10px] text-white/45 leading-relaxed">
        この時間帯の通知は音・バイブを鳴らさずに届きます（バッジは付きます）
      </p>
    </div>
  );
}
