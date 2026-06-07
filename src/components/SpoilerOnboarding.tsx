"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useOnboardingDone,
  useSpoilerBlock,
} from "../lib/preferences";

/**
 * 初回起動時に1度だけ表示するオンボーディング。
 * Step 1: Welcome（機能紹介）
 * Step 2: ネタバレ防止モードの選択
 * Step 3: 推しチーム/通知/ホーム追加への誘導
 */
export function SpoilerOnboarding() {
  const { done, setDone, hydrated } = useOnboardingDone();
  const { setBlocked } = useSpoilerBlock();
  const [step, setStep] = useState(1);

  if (!hydrated || done) return null;

  const finish = (spoilerOn: boolean) => {
    setBlocked(spoilerOn);
    setStep(3);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-[420px] glass rounded-3xl p-6 space-y-4 border border-white/15 shadow-2xl">
        {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
        {step === 2 && (
          <StepSpoiler
            onChoose={(spoilerOn) => finish(spoilerOn)}
          />
        )}
        {step === 3 && <StepFinish onClose={() => setDone(true)} />}

        {/* ステップインジケータ */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1.5 rounded-full transition-all ${
                n === step
                  ? "w-6 bg-white"
                  : n < step
                    ? "w-1.5 bg-white/60"
                    : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <>
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff3b30] to-[#ffb020] mb-3 shadow-[0_8px_24px_-4px_rgba(255,59,48,0.6)]">
          <span className="text-[24px] font-black text-white leading-none">90</span>
        </div>
        <h2 className="text-[22px] font-bold tracking-tight">
          W杯の意味を、90秒で。
        </h2>
        <p className="text-[12px] text-white/65 mt-2 leading-relaxed">
          サッカーを知らなくても、W杯 2026 が楽しめる。
        </p>
      </div>
      <ul className="space-y-2.5 pt-1">
        <Feature emoji="⭐" title="お気に入り通知" desc="推しチームと観たい試合だけお知らせ" />
        <Feature emoji="📋" title="30秒で意味が分かる" desc="この試合がなぜ重要かをひと目で" />
        <Feature emoji="👀" title="ネタバレ防止モード" desc="録画で観たい人もスコアを隠せる" />
      </ul>
      <button
        onClick={onNext}
        className="w-full py-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 text-[14px] font-semibold text-white shadow-lg"
      >
        はじめる
      </button>
    </>
  );
}

function StepSpoiler({ onChoose }: { onChoose: (spoilerOn: boolean) => void }) {
  return (
    <>
      <div className="text-center">
        <div className="text-[44px] mb-1">👀</div>
        <h2 className="text-[20px] font-bold tracking-tight">
          ネタバレ防止モード
        </h2>
        <p className="text-[12px] text-white/65 mt-2 leading-relaxed">
          試合をリアルタイムで観られない人向け。
          <br />
          ONにするとスコア・勝敗がアプリ全体で隠れます。
          <br />
          <span className="text-white/50">後で設定からいつでも切り替え可能。</span>
        </p>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onChoose(false)}
          className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-[13px] font-semibold text-white/85"
        >
          スコアOK
        </button>
        <button
          onClick={() => onChoose(true)}
          className="flex-1 py-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 text-[13px] font-semibold text-white shadow-lg"
        >
          👀 ONにする
        </button>
      </div>
    </>
  );
}

function StepFinish({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="text-center">
        <div className="text-[44px] mb-1">🎉</div>
        <h2 className="text-[20px] font-bold tracking-tight">準備完了</h2>
        <p className="text-[12px] text-white/65 mt-2 leading-relaxed">
          あと 2 ステップで最大限楽しめます。
          <br />
          <span className="text-white/50">スキップしても OK、後からも設定できます。</span>
        </p>
      </div>
      <div className="space-y-2 pt-1">
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-[#ff3b30]/15 to-[#ffb020]/10 border border-[#ffb020]/30 hover:from-[#ff3b30]/25 hover:to-[#ffb020]/20 transition"
        >
          <span className="text-[22px]">⭐</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white">
              推しチームを選ぶ
            </p>
            <p className="text-[10.5px] text-white/60">
              推しの試合をホームに優先表示
            </p>
          </div>
          <span className="text-white/40">›</span>
        </Link>
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] transition"
        >
          <span className="text-[22px]">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white">
              通知を ON にする
            </p>
            <p className="text-[10.5px] text-white/60">
              試合開始前・推しの試合だけ通知
            </p>
          </div>
          <span className="text-white/40">›</span>
        </Link>
      </div>
      <button
        onClick={onClose}
        className="w-full py-2.5 text-[12px] text-white/55 hover:text-white/85 transition"
      >
        あとで設定する
      </button>
    </>
  );
}

function Feature({
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3 px-1">
      <span className="text-[20px] leading-none mt-0.5">{emoji}</span>
      <div>
        <p className="text-[13px] font-semibold text-white leading-tight">
          {title}
        </p>
        <p className="text-[11px] text-white/55 leading-relaxed mt-0.5">
          {desc}
        </p>
      </div>
    </li>
  );
}
