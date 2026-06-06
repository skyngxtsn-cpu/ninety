import Link from "next/link";
import type { Match } from "../lib/types";
import { getTeam } from "../lib/data/teams";
import { relativeKickoff, formatKickoffJST, nowReference } from "../lib/data/matches";
import { BroadcastChipList } from "./BroadcastChip";

export async function MatchListCard({ match }: { match: Match }) {
  const [home, away, now] = await Promise.all([
    getTeam(match.homeTeamId),
    getTeam(match.awayTeamId),
    nowReference(),
  ]);
  if (!home || !away) return null;
  const finished = match.status === "finished";
  return (
    <Link
      href={`/matches/${match.id}`}
      className="block glass rounded-2xl p-4 hover:bg-white/[0.07] transition-colors"
    >
      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-3">
        <span className="tracking-wide">{match.stage}</span>
        <span className="font-mono">
          {finished ? `${formatKickoffJST(match.kickoffJST)} 終了` : formatKickoffJST(match.kickoffJST)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <TeamRow flag={home.flag} name={home.name} />
        <div className="px-3 text-center min-w-[80px]">
          {finished && match.result ? (
            <div className="text-[22px] font-bold tabular-nums leading-none">
              {match.result.home}
              <span className="mx-2 text-[var(--text-dim)]">-</span>
              {match.result.away}
            </div>
          ) : (
            <div className="text-[13px] font-semibold text-white/85">
              {relativeKickoff(match.kickoffJST, now)}
            </div>
          )}
        </div>
        <TeamRow flag={away.flag} name={away.name} reverse />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <BroadcastChipList ids={match.broadcasts.slice(0, 3)} size="sm" />
        </div>
        <p className="text-[11px] text-white/60 line-clamp-1 shrink-0 max-w-[55%]">
          🔥 {match.hook}
        </p>
      </div>
    </Link>
  );
}

function TeamRow({ flag, name, reverse }: { flag: string; name: string; reverse?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 flex-1 min-w-0 ${reverse ? "justify-end" : ""}`}
    >
      {!reverse && <span className="text-2xl">{flag}</span>}
      <span className="text-[13px] font-semibold tracking-tight truncate">
        {name}
      </span>
      {reverse && <span className="text-2xl">{flag}</span>}
    </div>
  );
}
