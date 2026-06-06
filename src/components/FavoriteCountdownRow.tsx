import Link from "next/link";
import type { Match } from "../lib/types";
import { getTeamSync } from "../lib/data/teams";
import {
  relativeKickoff,
  nowReference,
  isLiveMatch,
  liveMinute,
} from "../lib/data/matches";

type Props = {
  match: Match;
};

/**
 * 推しチームの「次の試合」スリム1行カード。
 *   "推しの次の試合は あと9日 · 🇯🇵 日本 vs 🇳🇱 オランダ"
 * LIVE中なら "LIVE 67分 · 🇯🇵 日本 2-1 🇳🇱 オランダ" に切替。
 */
export async function FavoriteCountdownRow({ match }: Props) {
  const now = await nowReference();
  const home = getTeamSync(match.homeTeamId);
  const away = getTeamSync(match.awayTeamId);
  if (!home || !away) return null;
  const live = isLiveMatch(match, now);
  const minute = live ? liveMinute(match, now) : null;
  const rel = live ? null : relativeKickoff(match.kickoffJST, now);

  return (
    <Link
      href={`/matches/${match.id}`}
      className="mx-4 mt-3 relative block rounded-2xl overflow-hidden border border-[var(--accent-2)]/40"
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background: `linear-gradient(120deg, ${home.primary} 0%, ${away.primary} 100%)`,
        }}
      />
      <div className="relative px-4 py-3 flex items-center gap-3">
        <span className="text-xs tracking-widest uppercase text-[var(--accent-2)] font-semibold whitespace-nowrap">
          ❤️ 推しの次
        </span>
        <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
          {live ? (
            <>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/25 text-rose-200 text-[10px] font-bold tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 live-dot" />
                LIVE {minute}'
              </span>
              <SideInline flag={home.flag} name={home.name} />
              <span className="text-[14px] font-bold tabular-nums">
                {match.result ? match.result.home : 0}
                <span className="mx-1 text-white/40">-</span>
                {match.result ? match.result.away : 0}
              </span>
              <SideInline flag={away.flag} name={away.name} />
            </>
          ) : (
            <>
              <span className="text-[13px] font-semibold whitespace-nowrap">
                {rel}
              </span>
              <SideInline flag={home.flag} name={home.name} />
              <span className="text-white/50 text-[12px]">vs</span>
              <SideInline flag={away.flag} name={away.name} />
            </>
          )}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0 text-white/60"
        >
          <path
            d="M9 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Link>
  );
}

function SideInline({ flag, name }: { flag: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[13px] font-semibold whitespace-nowrap">
      <span className="text-[16px] leading-none">{flag}</span>
      <span>{name}</span>
    </span>
  );
}
