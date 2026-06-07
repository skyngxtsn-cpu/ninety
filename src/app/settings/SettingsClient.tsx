"use client";

import { useState } from "react";
import { SectionHeader } from "../../components/SectionHeader";
import { FavoriteTeamPicker } from "../../components/FavoriteTeamPicker";
import { useDeveloperMode } from "../../lib/preferences";

type TeamMini = {
  id: string;
  shortName: string;
  name: string;
  flag: string;
  group: string;
};

export function SettingsClient({ allTeams }: { allTeams: TeamMini[] }) {
  return (
    <>
      <SectionHeader kicker="Favorite" title="推しチーム" />
      <div className="mx-4 glass rounded-2xl p-3">
        <FavoriteTeamPicker allTeams={allTeams} />
        <p className="text-[11px] text-white/55 mt-3 px-1 leading-relaxed">
          推しチームの試合はホームの Hero に優先表示、トーナメント表で金リング、順位表でシナリオが出ます。
        </p>
      </div>
    </>
  );
}

// 「その他」セクションは設定ページ末尾に別表示
export function OtherSettings() {
  const { on: devMode, setOn: setDevMode } = useDeveloperMode();
  const [versionTaps, setVersionTaps] = useState(0);
  const [tapToast, setTapToast] = useState<string | null>(null);

  const onVersionTap = () => {
    if (devMode) return; // 既に ON なら何もしない
    const next = versionTaps + 1;
    setVersionTaps(next);
    if (next >= 5) {
      setDevMode(true);
      setVersionTaps(0);
      setTapToast("🛠 開発者モード ON");
      setTimeout(() => setTapToast(null), 2000);
    } else if (next >= 3) {
      setTapToast(`あと ${5 - next} 回...`);
      setTimeout(() => setTapToast(null), 1500);
    }
  };

  return (
    <>
      <SectionHeader kicker="App" title="その他" />
      <div className="mx-4 glass rounded-2xl overflow-hidden">
        <a
          href="/feedback"
          className="block px-4 py-3.5 text-[14px] hover:bg-white/[0.04] transition flex items-center justify-between"
        >
          <span>💌 フィードバックを送る</span>
          <span className="text-white/40">›</span>
        </a>
        <div className="border-t border-white/8" />
        <a
          href="/privacy"
          className="block px-4 py-3.5 text-[14px] hover:bg-white/[0.04] transition flex items-center justify-between"
        >
          <span>📄 プライバシーポリシー</span>
          <span className="text-white/40">›</span>
        </a>
        <div className="border-t border-white/8" />
        <a
          href="/terms"
          className="block px-4 py-3.5 text-[14px] hover:bg-white/[0.04] transition flex items-center justify-between"
        >
          <span>📄 利用規約</span>
          <span className="text-white/40">›</span>
        </a>
        <div className="border-t border-white/8" />
        <Row label="タイムゾーン" value="日本時間 (JST)" />
        <div className="border-t border-white/8" />
        <Row label="言語" value="日本語" />
        <div className="border-t border-white/8" />
        <button
          onClick={onVersionTap}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/[0.02] transition"
        >
          <span className="text-[14px]">バージョン</span>
          <span className="text-[12px] text-white/60">0.1.0 (MVP)</span>
        </button>
        {devMode && (
          <>
            <div className="border-t border-white/8" />
            <div className="flex items-center justify-between px-4 py-3.5 bg-amber-500/8">
              <span className="text-[14px] text-amber-100">
                🛠 開発者モード
              </span>
              <button
                onClick={() => setDevMode(false)}
                className="px-3 py-1 rounded-md bg-amber-500/20 text-[11px] font-semibold text-amber-100 hover:bg-amber-500/30"
              >
                OFF にする
              </button>
            </div>
          </>
        )}
        <div className="border-t border-white/8" />
        <button
          onClick={() => {
            if (confirm("設定をすべてリセットしますか？")) {
              localStorage.removeItem("ninety.favoriteTeam");
              localStorage.removeItem("ninety.favoriteTeams");
              localStorage.removeItem("ninety.notifications");
              localStorage.removeItem("ninety.hookOnly");
              localStorage.removeItem("ninety.notificationPrefs");
              localStorage.removeItem("ninety.spoilerBlock");
              localStorage.removeItem("ninety.onboardingDone");
              localStorage.removeItem("ninety.reminderMatches");
              localStorage.removeItem("ninety.developerMode");
              document.cookie = "ninety_fav=; path=/; max-age=0";
              location.reload();
            }
          }}
          className="w-full text-left px-4 py-3.5 text-[14px] text-[#ff7a5b] hover:bg-white/[0.03] transition"
        >
          設定をリセット
        </button>
      </div>

      {tapToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/85 text-white px-4 py-2.5 rounded-xl border border-white/15 text-[13px] font-medium backdrop-blur-md shadow-2xl pointer-events-none">
          {tapToast}
        </div>
      )}

      <p className="text-center text-[10px] text-white/30 mt-8 pb-4">
        90 · W杯の意味を、90秒で。
      </p>

      <div className="h-12" />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-[14px]">{label}</span>
      <span className="text-[12px] text-white/60">{value}</span>
    </div>
  );
}
