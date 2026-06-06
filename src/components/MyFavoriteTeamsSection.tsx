"use client";

import Link from "next/link";
import { useFavoriteTeams } from "../lib/useFavoriteTeams";
import { SectionHeader } from "./SectionHeader";

type TeamMini = {
  id: string;
  name: string;
  shortName: string;
  flag: string;
  primary: string;
  secondary: string;
  group: string;
};

type Props = {
  allTeams: TeamMini[];
};

export function MyFavoriteTeamsSection({ allTeams }: Props) {
  const { teams, hydrated } = useFavoriteTeams();
  if (!hydrated) return null;
  const favTeams = allTeams.filter((t) => teams.includes(t.id));
  if (favTeams.length === 0) {
    return (
      <>
        <SectionHeader kicker="My ❤️" title="あなたの推しチーム" />
        <Link
          href="/settings"
          className="mx-4 block glass rounded-2xl p-5 text-center"
        >
          <p className="text-[14px] font-semibold mb-1">
            推しチームを選んでみよう
          </p>
          <p className="text-[11px] text-white/55">
            設定からチームを選ぶと、Hero やトーナメントで優先表示されます。
          </p>
        </Link>
      </>
    );
  }
  return (
    <>
      <SectionHeader kicker="My ❤️" title="あなたの推しチーム" />
      <div className="mx-4 grid grid-cols-2 gap-3">
        {favTeams.map((t) => (
          <Link
            key={t.id}
            href={`/teams/${t.id}`}
            className="h-[170px] relative rounded-2xl overflow-hidden border border-[var(--border-strong)] block"
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(160deg, ${t.primary} 0%, ${t.secondary} 100%)`,
                opacity: 0.7,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 top-3 flex justify-center">
              <span className="text-[56px] leading-none drop-shadow-[0_8px_18px_rgba(0,0,0,0.6)]">
                {t.flag}
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="text-[10px] tracking-widest uppercase text-white/70">
                グループ{t.group}
              </p>
              <p className="text-[14px] font-bold tracking-tight">{t.name}</p>
              <p className="text-[10px] text-white/65">{t.shortName}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
