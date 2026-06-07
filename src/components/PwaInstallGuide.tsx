"use client";

import { useEffect, useState } from "react";

/**
 * iOS / Android で PWA をホーム画面に追加する手順を表示する小カード。
 * 既にスタンドアロンモードで起動している場合は非表示。
 */
export function PwaInstallGuide() {
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // すでにホーム画面から起動している場合
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari の独自プロパティ
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setPlatform("ios");
    else if (/Android/.test(ua)) setPlatform("android");
    else setPlatform("other");
  }, []);

  if (isStandalone === null) return null;
  if (isStandalone) {
    return (
      <div className="mx-4 mt-4 glass rounded-2xl p-3 flex items-center gap-3">
        <span className="text-[18px]">✅</span>
        <p className="text-[12px] text-white/75 leading-relaxed">
          ホーム画面アプリとして起動中。通知も受け取れます。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4 glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-[18px]">📱</span>
          <div>
            <p className="text-[14px] font-semibold text-white">
              ホーム画面に追加する
            </p>
            <p className="text-[11px] text-white/55 mt-0.5">
              通知を受け取るには PWA インストールが必要です
            </p>
          </div>
        </div>
        <span
          className={`text-white/45 text-[16px] transition-transform ${
            open ? "rotate-90" : ""
          }`}
        >
          ›
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
          {platform === "ios" && <IosSteps />}
          {platform === "android" && <AndroidSteps />}
          {platform === "other" && <OtherSteps />}
        </div>
      )}
    </div>
  );
}

function IosSteps() {
  return (
    <div className="space-y-2.5 text-[12.5px] leading-relaxed text-white/85">
      <p className="text-[11px] uppercase tracking-wider text-[var(--accent-2)]">
        iPhone / iPad（Safari）
      </p>
      <Step n={1}>
        画面下部の <ShareIcon /> 共有ボタンをタップ
      </Step>
      <Step n={2}>
        <strong className="text-white">「ホーム画面に追加」</strong> を選択
        <span className="text-white/55"> （下にスクロールすると出ます）</span>
      </Step>
      <Step n={3}>
        右上の <strong className="text-white">「追加」</strong> をタップ
      </Step>
      <Step n={4}>
        ホーム画面の <strong className="text-white">「90」</strong> アイコンから起動
      </Step>
      <p className="text-[11px] text-amber-200/85 pt-1">
        ⚠️ Chrome / その他のブラウザでは iOS の制限で通知が受け取れません。必ず Safari で開いてから追加してください。
      </p>
    </div>
  );
}

function AndroidSteps() {
  return (
    <div className="space-y-2.5 text-[12.5px] leading-relaxed text-white/85">
      <p className="text-[11px] uppercase tracking-wider text-[var(--accent-2)]">
        Android（Chrome）
      </p>
      <Step n={1}>右上の ⋮ メニューをタップ</Step>
      <Step n={2}>
        <strong className="text-white">「ホーム画面に追加」</strong> または
        <strong className="text-white">「アプリをインストール」</strong>
      </Step>
      <Step n={3}>確認画面で「追加」「インストール」</Step>
      <Step n={4}>ホーム画面の「90」アイコンから起動</Step>
    </div>
  );
}

function OtherSteps() {
  return (
    <p className="text-[12.5px] text-white/75 leading-relaxed">
      お使いのブラウザの「ホーム画面に追加」または「アプリをインストール」機能をご利用ください。
      <br />
      <span className="text-white/55">
        ※ プッシュ通知はブラウザによって対応状況が異なります。
      </span>
    </p>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="shrink-0 w-5 h-5 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <p className="flex-1">{children}</p>
    </div>
  );
}

function ShareIcon() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 mx-0.5 align-middle rounded-md bg-white/10 border border-white/15">
      <svg width="11" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
