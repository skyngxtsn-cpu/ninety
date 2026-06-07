"use client";

import { useNotificationPreferences, useSpoilerBlock } from "../lib/preferences";
import type { NotificationPreferences } from "../lib/push/notification-types";

/**
 * /settings ページに置く通知設定セクション。
 * 各グループのトグル + 静寂時間ピッカー。
 */
export function NotificationSettings() {
  const { prefs, setPrefs, hydrated } = useNotificationPreferences();
  const { blocked: spoilerBlock } = useSpoilerBlock();

  if (!hydrated) {
    return <div className="mx-4 h-40 glass rounded-2xl animate-pulse" />;
  }

  const toggle = (key: keyof NotificationPreferences) => () => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const setQuiet = (start: string, end: string) => {
    setPrefs((p) => ({ ...p, quiet: { start, end } }));
  };
  const clearQuiet = () => {
    setPrefs((p) => ({ ...p, quiet: null }));
  };

  return (
    <section className="mx-4 mt-4 glass rounded-2xl p-4 space-y-3">
      <h2 className="text-[14px] font-bold mb-1">通知の内訳</h2>
      <p className="text-[11px] text-white/55 leading-relaxed">
        Webプッシュ通知の中身を細かく調整できます。
      </p>

      <ToggleRow
        label="事前通知"
        hint="3時間前 / 1時間前 / 15分前"
        checked={prefs.pre}
        onToggle={toggle("pre")}
      />
      <ToggleRow
        label="試合中通知（スコア無し）"
        hint="キックオフ / ハーフタイム / 終了の合図"
        checked={prefs.live}
        onToggle={toggle("live")}
      />
      <ToggleRow
        label="1日の終わりダイジェスト"
        hint="その日の最終試合終了後に、推しチームの「明日の試合」をまとめてお知らせ"
        checked={prefs.digest}
        onToggle={toggle("digest")}
      />
      <ToggleRow
        label="トーナメント進出通知"
        hint="⚠️ 通知が届く = 推しが勝ち抜けたバレ可能"
        checked={prefs.tournament}
        onToggle={toggle("tournament")}
      />

      <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-white/45">
          ネタバレOK時のみ
        </p>
        <ToggleRow
          label="試合結果通知（スコア付き）"
          hint={
            spoilerBlock
              ? "❌ ネタバレ防止モード ON のため無効中"
              : "「日本 2-1 オランダ」など試合結果を含む通知"
          }
          checked={!spoilerBlock && prefs.result}
          onToggle={toggle("result")}
          disabled={spoilerBlock}
        />
      </div>

      <div className="border-t border-white/10 pt-3 mt-3">
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
        <p className="text-[11px] text-white/55 mt-0.5 leading-relaxed">{hint}</p>
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
