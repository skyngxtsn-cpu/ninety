"use client";

import { useMemo, useState } from "react";
import { useFavoriteTeams } from "../lib/useFavoriteTeams";

type TeamMini = {
  id: string;
  shortName: string;
  name: string;
  flag: string;
  group: string;
};

type Props = {
  /** server から渡される48カ国の最小情報 */
  allTeams: TeamMini[];
};

const GROUP_KEYS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export function FavoriteTeamPicker({ allTeams }: Props) {
  const { teams, isFavorite, toggle, clear, hydrated } = useFavoriteTeams();
  const [activeGroup, setActiveGroup] = useState<string>("all");

  const byGroup = useMemo(() => {
    const m = new Map<string, TeamMini[]>();
    for (const t of allTeams) {
      const arr = m.get(t.group) ?? [];
      arr.push(t);
      m.set(t.group, arr);
    }
    return m;
  }, [allTeams]);

  const filtered =
    activeGroup === "all"
      ? allTeams
      : (byGroup.get(activeGroup) ?? []);

  const selectedSet = new Set(teams);
  const selectedTeams = allTeams.filter((t) => selectedSet.has(t.id));

  return (
    <div>
      {/* 現在の選択ステータス */}
      <div className="mb-3">
        {hydrated && selectedTeams.length === 0 ? (
          <p className="text-[12px] text-white/55 px-1">
            まだ推しチームが選ばれていません。下のリストから ❤️ をタップ。
          </p>
        ) : (
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-[10px] tracking-widest uppercase text-white/55">
              現在の推し ({selectedTeams.length})
            </p>
            {selectedTeams.length > 0 && (
              <button
                onClick={() => clear()}
                className="text-[10px] text-[#ff7a5b] hover:text-[#ff3b30] transition"
              >
                すべて解除
              </button>
            )}
          </div>
        )}
        {selectedTeams.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {selectedTeams.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-[11px] font-medium"
              >
                <span className="text-base leading-none">{t.flag}</span>
                {t.shortName}
              </span>
            ))}
          </div>
        )}
        {selectedTeams.length >= 4 && (
          <p className="text-[10px] text-amber-200/85 mt-2 px-1 leading-relaxed">
            ⚠ 集中して応援したい場合は 1〜3 チームがおすすめです。
          </p>
        )}
      </div>

      {/* グループ別タブ */}
      <div className="overflow-x-auto scrollbar-none -mx-4 px-4 mb-3">
        <div className="flex gap-1.5 pr-4">
          <TabBtn
            label="全て"
            active={activeGroup === "all"}
            onClick={() => setActiveGroup("all")}
          />
          {GROUP_KEYS.map((g) => (
            <TabBtn
              key={g}
              label={`グループ${g}`}
              active={activeGroup === g}
              onClick={() => setActiveGroup(g)}
            />
          ))}
        </div>
      </div>

      {/* チームグリッド */}
      <div className="grid grid-cols-4 gap-2">
        {filtered.map((t) => {
          const active = isFavorite(t.id);
          return (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              className={`relative flex flex-col items-center gap-1 py-2.5 rounded-xl transition ${
                active
                  ? "bg-gradient-to-b from-[#ff3b30]/20 to-[#ff3b30]/5 border border-[#ff3b30]/40"
                  : "border border-white/10 hover:bg-white/5"
              }`}
            >
              <span className="text-[26px] leading-none drop-shadow">{t.flag}</span>
              <span className="text-[10px] font-medium">{t.shortName}</span>
              {hydrated && active && (
                <span className="absolute top-1 right-1 text-[10px]">❤️</span>
              )}
              {activeGroup === "all" && (
                <span className="text-[8.5px] tracking-widest text-white/40">
                  グループ{t.group}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TabBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-tight transition ${
        active
          ? "bg-white text-black"
          : "bg-white/8 text-white/70 hover:bg-white/12"
      }`}
    >
      {label}
    </button>
  );
}
