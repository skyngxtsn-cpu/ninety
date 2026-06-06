import Link from "next/link";
import { AppHeader } from "../components/AppHeader";
import { SectionHeader } from "../components/SectionHeader";
import { TournamentProgress } from "../components/TournamentProgress";
import { FavoriteCountdownRow } from "../components/FavoriteCountdownRow";
import { CompactMatchCard } from "../components/CompactMatchCard";
import { CompactResultRow } from "../components/CompactResultRow";
import {
  getTournamentCountdown,
  getFavoriteNextMatch,
  getUpcomingByDate,
  getRecentResults,
} from "../lib/data";
import { getFavoriteTeamsFromCookie } from "../lib/getFavoritesFromCookie";

export default async function HomePage() {
  const favoriteIds = await getFavoriteTeamsFromCookie();
  const favoriteSet = new Set(favoriteIds);
  const [countdown, favNext, upcoming, recent] = await Promise.all([
    getTournamentCountdown(),
    getFavoriteNextMatch(favoriteIds),
    getUpcomingByDate(14),
    getRecentResults(5),
  ]);

  return (
    <>
      <AppHeader
        rightSlot={
          <Link
            href="/reminders"
            aria-label="リマインダー"
            className="w-9 h-9 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-white/85 hover:bg-white/10 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9a6 6 0 1 1 12 0c0 4 2 5 2 7H4c0-2 2-3 2-7Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M10 19a2 2 0 0 0 4 0"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          </Link>
        }
      />

      {/* W杯 全体カウントダウン */}
      <TournamentProgress countdown={countdown} />

      {/* 推しチームの次の試合（あれば） */}
      {favNext && <FavoriteCountdownRow match={favNext} />}

      {/* 試合日程：日付ごとにグループ表示 */}
      <SectionHeader kicker="Schedule" title="試合日程" />
      {upcoming.length === 0 ? (
        <p className="px-4 text-[12px] text-white/55">
          表示する試合がありません。
        </p>
      ) : (
        <div className="space-y-5">
          {upcoming.map((bucket) => (
            <section key={bucket.dateKey}>
              <h3 className="px-4 mb-2 flex items-baseline gap-2">
                <span className="text-[15px] font-bold tracking-tight">
                  {bucket.label}
                </span>
                <span className="text-[10.5px] text-white/45">
                  {bucket.matches.length}試合
                </span>
              </h3>
              <div className="px-4 space-y-2">
                {bucket.matches.map((m) => (
                  <CompactMatchCard
                    key={m.id}
                    match={m}
                    favoriteTeamIds={favoriteSet}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* 見逃した試合結果 */}
      {recent.length > 0 && (
        <>
          <SectionHeader kicker="Recap" title="見逃した試合結果" />
          <div className="mx-4 glass rounded-2xl px-2 py-1 divide-y divide-white/8">
            {recent.map((m) => (
              <CompactResultRow
                key={m.id}
                match={m}
                favoriteTeamIds={favoriteSet}
              />
            ))}
          </div>
        </>
      )}

      <div className="h-12" />
    </>
  );
}
