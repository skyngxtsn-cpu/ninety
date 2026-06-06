import Link from "next/link";
import type { Match } from "../lib/types";
import { getTeam } from "../lib/data/teams";

type Props = {
  match: Match;
  favoriteTeamIds: Set<string>;
};

/**
 * スコア中心の見逃した試合行。
 * "🇯🇵 日本 2 - 1 オランダ 🇳🇱"
 * + 推しチームは ❤️
 */
export async function CompactResultRow({ match, favoriteTeamIds }: Props) {
  const [home, away] = await Promise.all([
    getTeam(match.homeTeamId),
    getTeam(match.awayTeamId),
  ]);
  if (!home || !away || !match.result) return null;
  const homeWin = match.result.home > match.result.away;
  const awayWin = match.result.away > match.result.home;
  const involvesFavorite =
    favoriteTeamIds.has(match.homeTeamId) ||
    favoriteTeamIds.has(match.awayTeamId);

  return (
    <Link
      href={`/matches/${match.id}`}
      className={`block py-3 px-2 rounded-xl transition-colors ${
        involvesFavorite
          ? "bg-[var(--accent-2)]/[0.06] hover:bg-[var(--accent-2)]/[0.10]"
          : "hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-[18px] leading-none drop-shadow shrink-0 ${
            awayWin ? "opacity-55" : ""
          }`}
        >
          {home.flag}
        </span>
        <span
          className={`text-[13px] tracking-tight flex-1 truncate ${
            homeWin ? "font-bold" : "font-medium"
          } ${awayWin ? "text-white/55" : "text-white/90"}`}
        >
          {home.name}
        </span>
        <span className="text-[16px] font-bold tabular-nums shrink-0">
          {match.result.home}
          <span className="mx-1.5 text-white/40">-</span>
          {match.result.away}
        </span>
        <span
          className={`text-[13px] tracking-tight flex-1 truncate text-right ${
            awayWin ? "font-bold" : "font-medium"
          } ${homeWin ? "text-white/55" : "text-white/90"}`}
        >
          {away.name}
        </span>
        <span
          className={`text-[18px] leading-none drop-shadow shrink-0 ${
            homeWin ? "opacity-55" : ""
          }`}
        >
          {away.flag}
        </span>
        {involvesFavorite && (
          <span className="text-[11px] shrink-0">❤️</span>
        )}
      </div>
    </Link>
  );
}
