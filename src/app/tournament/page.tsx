import { AppHeader } from "../../components/AppHeader";
import { KnockoutBracket } from "../../components/KnockoutBracket";
import type { BracketRound } from "../../lib/data/bracket";
import { getFavoriteTeamsFromCookie } from "../../lib/getFavoritesFromCookie";
import { getAllTeams } from "../../lib/data/teams";

const ROUND_KEYS: BracketRound[] = ["R32", "R16", "QF", "SF", "FINAL", "THIRD"];

export default async function TournamentPage(
  props: PageProps<"/tournament">,
) {
  const sp = await props.searchParams;
  const round = Array.isArray(sp.round) ? sp.round[0] : sp.round;
  const view = Array.isArray(sp.view) ? sp.view[0] : sp.view;
  const initialRound: BracketRound = ROUND_KEYS.includes(round as BracketRound)
    ? (round as BracketRound)
    : "R32";
  const v: "tabs" | "tree" = view === "tree" ? "tree" : "tabs";

  // 推しチームの旗を説明文に
  const [favoriteIds, allTeams] = await Promise.all([
    getFavoriteTeamsFromCookie(),
    getAllTeams(),
  ]);
  const teamMap = Object.fromEntries(allTeams.map((t) => [t.id, t]));
  const favFlags = favoriteIds
    .map((id) => teamMap[id]?.flag)
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");

  return (
    <>
      <AppHeader back="/" title="決勝トーナメント" subtitle="W杯 2026" />
      <div className="px-4 pt-3">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--text-dim)]">
          Knockout
        </p>
        <h1 className="pt-1 text-[24px] font-bold tracking-tight leading-tight text-gradient">
          勝ち上がりを、先に見る。
        </h1>
        <p className="text-[11.5px] text-white/55 mt-1.5 leading-relaxed">
          試合結果に応じて自動で対戦カードが確定。
          {favFlags
            ? `あなたの推し ${favFlags} が来うる枠は金リングで強調。`
            : "推しチームを選ぶと、来うる枠が金リングで強調されます。"}
        </p>
      </div>
      <KnockoutBracket
        initialRound={initialRound}
        view={v}
        basePath="/tournament"
      />
      <div className="h-12" />
    </>
  );
}
