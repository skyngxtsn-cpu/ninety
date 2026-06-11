import { AppHeader } from "../../components/AppHeader";
import { SectionHeader } from "../../components/SectionHeader";
import { CompactResultRow } from "../../components/CompactResultRow";
import { getFinishedByDate } from "../../lib/data";
import { getFavoriteTeamsFromCookie } from "../../lib/getFavoritesFromCookie";

export const metadata = {
  title: "試合結果｜90",
  description: "W杯 2026 の終了した試合の結果一覧",
};

export default async function ResultsPage() {
  const [favoriteIds, buckets] = await Promise.all([
    getFavoriteTeamsFromCookie(),
    getFinishedByDate(),
  ]);
  const favoriteSet = new Set(favoriteIds);

  return (
    <>
      <AppHeader back="/" title="試合結果" subtitle="終了した試合まとめ" />

      <div className="px-4 pt-3">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--text-dim)]">
          Results
        </p>
        <h1 className="pt-1 text-[22px] font-bold tracking-tight leading-tight text-gradient">
          W杯 2026 のここまで
        </h1>
        <p className="text-[12px] text-white/55 mt-1">
          {buckets.reduce((acc, b) => acc + b.matches.length, 0)} 試合
        </p>
      </div>

      {buckets.length === 0 ? (
        <div className="mx-4 mt-8 glass rounded-2xl p-8 text-center">
          <div className="text-[44px] mb-2">⚽</div>
          <p className="text-[14px] font-semibold text-white mb-1">
            まだ終了した試合はありません
          </p>
          <p className="text-[11.5px] text-white/55">
            開幕後、試合が終わるとここにまとまります。
          </p>
        </div>
      ) : (
        <div className="space-y-5 mt-5">
          {buckets.map((bucket) => (
            <section key={bucket.dateKey}>
              <SectionHeader kicker="Day" title={bucket.label} />
              <div className="mx-4 glass rounded-2xl px-2 py-1 divide-y divide-white/8">
                {bucket.matches.map((m) => (
                  <CompactResultRow
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

      <div className="h-12" />
    </>
  );
}
