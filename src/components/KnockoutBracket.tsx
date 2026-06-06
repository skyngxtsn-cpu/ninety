import type { BracketRound } from "../lib/data/bracket";
import {
  getBracketByRoundForFavorites,
  getSplitBracketForFavorites,
} from "../lib/data/bracket";
import { getAllTeams } from "../lib/data/teams";
import { getFavoriteTeamsFromCookie } from "../lib/getFavoritesFromCookie";
import { BracketTabs } from "./BracketTabs";
import { BracketViewToggle } from "./BracketViewToggle";
import { BracketMatchCard } from "./BracketMatchCard";
import { BracketKnockoutTree } from "./BracketKnockoutTree";

type Props = {
  initialRound: BracketRound;
  view: "tabs" | "tree";
  basePath: string;
};

export async function KnockoutBracket({
  initialRound,
  view,
  basePath,
}: Props) {
  const favoriteIds = await getFavoriteTeamsFromCookie();
  const [byRound, teams, split] = await Promise.all([
    getBracketByRoundForFavorites(favoriteIds),
    getAllTeams(),
    getSplitBracketForFavorites(favoriteIds),
  ]);
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <div className="pt-2">
      <div className="px-4 mb-3 flex items-center justify-between gap-2">
        <BracketViewToggle view={view} round={initialRound} basePath={basePath} />
        <p className="text-[10.5px] text-white/45">
          {view === "tabs" ? "ラウンド別の一覧" : "横スワイプで全体俯瞰"}
        </p>
      </div>

      {view === "tree" ? (
        <BracketKnockoutTree split={split} teams={teamMap} />
      ) : (
        <>
          <BracketTabs active={initialRound} view={view} basePath={basePath} />
          <div className="px-4 space-y-3">
            {(byRound[initialRound] ?? []).length === 0 ? (
              <p className="text-[12px] text-white/50 text-center py-8">
                このラウンドの試合データはまだありません。
              </p>
            ) : (
              byRound[initialRound].map((bm) => (
                <BracketMatchCard key={bm.num} bm={bm} teams={teamMap} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
