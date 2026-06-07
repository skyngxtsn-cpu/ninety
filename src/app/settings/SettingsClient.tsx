"use client";

import { SectionHeader } from "../../components/SectionHeader";
import { FavoriteTeamPicker } from "../../components/FavoriteTeamPicker";

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
  return (
    <>
      <SectionHeader kicker="App" title="その他" />
      <div className="mx-4 glass rounded-2xl overflow-hidden">
        <Row label="タイムゾーン" value="日本時間 (JST)" />
        <div className="border-t border-white/8" />
        <Row label="言語" value="日本語" />
        <div className="border-t border-white/8" />
        <Row label="バージョン" value="0.1.0 (MVP)" />
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
              document.cookie = "ninety_fav=; path=/; max-age=0";
              location.reload();
            }
          }}
          className="w-full text-left px-4 py-3.5 text-[14px] text-[#ff7a5b] hover:bg-white/[0.03] transition"
        >
          設定をリセット
        </button>
      </div>

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
