"use client";

import { useMemo } from "react";
import { SectionHeader } from "../../components/SectionHeader";
import { FavoriteTeamPicker } from "../../components/FavoriteTeamPicker";
import { usePersistedState } from "../../lib/usePersistedState";
import { useFavoriteTeams } from "../../lib/useFavoriteTeams";

const NOTIFICATION_TYPES = [
  { id: "24h", label: "24時間前", desc: "見る予定を立てるための事前通知" },
  { id: "3h", label: "3時間前", desc: "「今夜は何戦？」を思い出させる" },
  { id: "1h", label: "1時間前", desc: "ABEMAやNHKを開く準備に" },
  { id: "lineup", label: "スタメン発表", desc: "誰が出るか確定したら" },
  { id: "kickoff", label: "試合開始", desc: "キックオフの瞬間に" },
  { id: "final", label: "試合終了", desc: "結果＋30秒要約で見逃しゼロ" },
  { id: "next", label: "次戦確定", desc: "トーナメントの相手が決まったら" },
] as const;

const DEFAULT_NOTIFICATIONS: Record<string, boolean> = {
  "24h": true,
  "3h": true,
  "1h": true,
  lineup: false,
  kickoff: true,
  final: true,
  next: true,
};

type TeamMini = {
  id: string;
  shortName: string;
  name: string;
  flag: string;
  group: string;
};

export function SettingsClient({ allTeams }: { allTeams: TeamMini[] }) {
  const [enabled, setEnabled] = usePersistedState<Record<string, boolean>>(
    "ninety.notifications",
    DEFAULT_NOTIFICATIONS,
  );
  const [hookOnly, setHookOnly] = usePersistedState<boolean>(
    "ninety.hookOnly",
    true,
  );
  const { teams: favoriteTeams } = useFavoriteTeams();
  const teamMap = useMemo(
    () => Object.fromEntries(allTeams.map((t) => [t.id, t])),
    [allTeams],
  );
  // 通知プレビューは先頭の推しチーム（無ければ日本）
  const previewTeamId = favoriteTeams[0] ?? "jpn";
  const previewTeam = teamMap[previewTeamId] ?? teamMap.jpn;

  return (
    <>
      <SectionHeader kicker="Favorite" title="推しチーム" />
      <div className="mx-4 glass rounded-2xl p-3">
        <FavoriteTeamPicker allTeams={allTeams} />
        <p className="text-[11px] text-white/55 mt-3 px-1 leading-relaxed">
          推しチームの試合はホームの Hero に優先表示、トーナメント表で金リング、順位表でシナリオが出ます。
        </p>
      </div>

      <SectionHeader kicker="Notifications" title="通知のタイミング" />
      <div className="mx-4 glass rounded-2xl overflow-hidden">
        <ToggleRow
          title="「見る理由」だけ通知する"
          desc="試合開始通知ではなく、勝てば何が起きるかを伝える"
          checked={hookOnly}
          onChange={setHookOnly}
          primary
        />
        <div className="border-t border-white/8" />
        {NOTIFICATION_TYPES.map((n, i) => (
          <div key={n.id}>
            {i > 0 && <div className="border-t border-white/8" />}
            <ToggleRow
              title={n.label}
              desc={n.desc}
              checked={enabled[n.id] ?? false}
              onChange={(v) => setEnabled({ ...enabled, [n.id]: v })}
            />
          </div>
        ))}
      </div>

      <SectionHeader kicker="Preview" title="こんな通知が届きます" />
      <div className="mx-4 glass-strong rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#ff3b30] to-[#ffb020] flex items-center justify-center text-[14px]">
            {previewTeam?.flag ?? "⚽"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold">90 / W杯</span>
              <span className="text-[10px] text-white/45">now</span>
            </div>
            <p className="text-[13px] font-semibold mt-0.5">
              {previewTeam?.name ?? "日本"}戦まであと1時間
            </p>
            <p className="text-[12px] text-white/80 leading-snug mt-0.5">
              📺 NHK・ABEMA
              <br />
              🔥 勝てば突破に大きく前進
              <br />
              ⭐ 注目選手
            </p>
          </div>
        </div>
      </div>

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

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
  primary,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-white/[0.03] transition"
    >
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] ${primary ? "font-semibold" : "font-medium"}`}>
          {title}
        </p>
        <p className="text-[11px] text-white/55 mt-0.5">{desc}</p>
      </div>
      <Switch on={checked} />
    </button>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={`shrink-0 w-11 h-7 rounded-full p-0.5 transition-colors ${
        on ? "bg-gradient-to-r from-[#ff3b30] to-[#ff7a45]" : "bg-white/15"
      }`}
    >
      <span
        className={`block w-6 h-6 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </span>
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
