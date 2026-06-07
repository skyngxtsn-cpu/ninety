"use client";

import { useEffect } from "react";
import {
  useOnboardingDone,
  useSpoilerBlock,
} from "../lib/preferences";

/**
 * 初回起動時に1度だけ表示するネタバレ防止モードのオンボーディング。
 * - 「使う」→ blocked: true + onboardingDone: true
 * - 「スキップ」→ onboardingDone: true（blocked はデフォルト false のまま）
 */
export function SpoilerOnboarding() {
  const { done, setDone, hydrated } = useOnboardingDone();
  const { setBlocked } = useSpoilerBlock();

  // 初回ハイドレート後にバックグラウンドで auto-skip 判定をしないように
  useEffect(() => {
    // 開発でリセットしたい時はここに条件を足す
  }, []);

  if (!hydrated || done) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[420px] glass rounded-3xl p-6 space-y-4 border border-white/15">
        <div className="text-center">
          <div className="text-[44px] mb-1">🙈</div>
          <h2 className="text-[20px] font-bold tracking-tight">
            ネタバレ防止モード
          </h2>
          <p className="text-[12px] text-white/65 mt-2 leading-relaxed">
            録画で観たい、ハイライトで追いたい人向け。
            <br />
            ONにするとアプリ全体でスコア・勝敗が隠れます。
            <br />
            後で<strong className="text-white">設定</strong>からいつでも切り替え可能。
          </p>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => {
              setBlocked(false);
              setDone(true);
            }}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[13px] font-semibold text-white/85"
          >
            スコアOK
          </button>
          <button
            onClick={() => {
              setBlocked(true);
              setDone(true);
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 text-[13px] font-semibold text-white shadow-lg"
          >
            🙈 ONにする
          </button>
        </div>
      </div>
    </div>
  );
}
