"use client";

import { useNotificationPreferences, useSpoilerBlock } from "../lib/preferences";

/**
 * ネタバレ防止モードの ON/OFF UI（/settings ページ用）。
 * ON にすると同時に result 通知も自動で OFF に。
 */
export function SpoilerToggle() {
  const { blocked, setBlocked, hydrated } = useSpoilerBlock();
  const { setPrefs } = useNotificationPreferences();
  if (!hydrated) {
    return <div className="mx-4 h-28 glass rounded-2xl animate-pulse mt-4" />;
  }
  const onChange = (next: boolean) => {
    setBlocked(next);
    if (next) {
      // ネタバレ防止モード ON にしたら結果通知も OFF
      setPrefs((p) => ({ ...p, result: false }));
    }
  };
  return (
    <section className="mx-4 mt-4 glass rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-[14px] font-bold text-white mb-1">
            🙈 ネタバレ防止モード
          </p>
          <p className="text-[11px] text-white/65 leading-relaxed">
            ONにすると、スコア・勝敗の表示が「●●●」で隠れます。
            タップで一時的に表示できます。
          </p>
        </div>
        <button
          onClick={() => onChange(!blocked)}
          role="switch"
          aria-checked={blocked}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition shadow-inner ${
            blocked ? "bg-blue-500" : "bg-white/15"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
              blocked ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      {blocked && (
        <p className="mt-2 text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-400/30 rounded-md px-2 py-1.5 leading-relaxed">
          ⚠️ ONの間、「試合結果通知（スコア付き）」は自動で無効になります
        </p>
      )}
    </section>
  );
}
