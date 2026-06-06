import type { BracketMatch, BracketRound } from "../lib/data/bracket";
import type { Team } from "../lib/types";
import { BracketMatchCard } from "./BracketMatchCard";
import { ROUND_LABEL_JA } from "../lib/data/i18n";

type Props = {
  byRound: Record<BracketRound, BracketMatch[]>;
  teams: Map<string, Team>;
};

const COLUMN_ORDER: BracketRound[] = ["R32", "R16", "QF", "SF", "FINAL"];

export function BracketTree({ byRound, teams }: Props) {
  return (
    <div className="overflow-x-auto scrollbar-none -mx-4 px-4 pb-2">
      <div className="flex gap-3 min-w-min">
        {COLUMN_ORDER.map((round) => {
          const matches = byRound[round] ?? [];
          if (matches.length === 0) return null;
          return (
            <div key={round} className="shrink-0 w-[260px]">
              <div className="sticky top-0 z-10 pb-2">
                <p className="text-[10px] tracking-[0.18em] uppercase text-[var(--text-dim)]">
                  {round}
                </p>
                <h3 className="text-[14px] font-semibold tracking-tight text-gradient">
                  {ROUND_LABEL_JA[round]}
                </h3>
                <p className="text-[10px] text-white/40">{matches.length} 試合</p>
              </div>
              <div className="space-y-2.5">
                {matches.map((bm) => (
                  <BracketMatchCard key={bm.num} bm={bm} teams={teams} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-white/40 mt-3">
        ← → スワイプでラウンド間を移動
      </p>
    </div>
  );
}
