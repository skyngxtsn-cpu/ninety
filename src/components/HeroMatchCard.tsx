import Link from "next/link";
import type { Match } from "../lib/types";
import { getTeam } from "../lib/data/teams";
import { relativeKickoff, formatKickoffJST, nowReference } from "../lib/data/matches";
import { BroadcastChipList } from "./BroadcastChip";

export async function HeroMatchCard({ match }: { match: Match }) {
  const [home, away, now] = await Promise.all([
    getTeam(match.homeTeamId),
    getTeam(match.awayTeamId),
    nowReference(),
  ]);
  if (!home || !away) return null;
  const rel = relativeKickoff(match.kickoffJST, now);
  const time = formatKickoffJST(match.kickoffJST);

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block mx-4 mt-3 relative overflow-hidden rounded-3xl border border-[var(--border-strong)] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] glow-ring"
    >
      {/* Flag-tinted gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${home.primary} 0%, ${home.secondary} 45%, ${away.primary} 55%, ${away.secondary} 100%)`,
          opacity: 0.55,
        }}
      />
      <div className="absolute inset-0 hero-shade" />

      <div className="relative p-5 pt-6 min-h-[280px] flex flex-col">
        <div className="flex items-center justify-between text-[11px] text-white/80">
          <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-md font-medium tracking-wide">
            {match.stage}
          </span>
          <span className="font-mono">{time}</span>
        </div>

        <div className="flex items-center justify-between mt-7">
          <TeamSide flag={home.flag} name={home.name} />
          <div className="flex flex-col items-center px-2 shrink-0">
            <span className="text-[10px] tracking-[0.25em] text-white/60 mb-1">
              VS
            </span>
            <span className="text-[22px] font-bold tabular-nums leading-none whitespace-nowrap">
              {rel}
            </span>
          </div>
          <TeamSide flag={away.flag} name={away.name} reverse />
        </div>

        <div className="mt-auto pt-6">
          {match.broadcasts.length > 0 && (
            <div className="mb-3">
              <BroadcastChipList ids={match.broadcasts} size="md" />
            </div>
          )}
          <p className="text-[17px] font-semibold tracking-tight leading-snug">
            🔥 {match.hook}
          </p>
          <div className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-white/90">
            詳しく見る
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

function TeamSide({
  flag,
  name,
  reverse,
}: {
  flag: string;
  name: string;
  reverse?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center gap-2 shrink-0"
      style={{ minWidth: 80 }}
    >
      <div className="text-[44px] leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        {flag}
      </div>
      <div className="text-[13px] font-semibold tracking-tight">{name}</div>
    </div>
  );
}
