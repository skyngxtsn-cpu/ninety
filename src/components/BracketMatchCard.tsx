import Link from "next/link";
import { BracketSlotRow } from "./BracketSlotRow";
import type { BracketMatch } from "../lib/data/bracket";
import type { Team } from "../lib/types";
import { formatKickoffJST } from "../lib/data/matches";
import { SpoilerWrap } from "./SpoilerWrap";

type Props = {
  bm: BracketMatch;
  teams: Map<string, Team>;
};

export function BracketMatchCard({ bm, teams }: Props) {
  const bothResolved =
    bm.home.kind === "team" && bm.away.kind === "team";

  const finishedResult = bm.status === "finished" && bm.result;
  const homeWin = finishedResult ? bm.result!.home > bm.result!.away : false;
  const awayWin = finishedResult ? bm.result!.away > bm.result!.home : false;

  const card = (
    <div
      className={`block glass rounded-2xl p-4 transition-colors ${
        bothResolved ? "hover:bg-white/[0.07]" : ""
      } ${bm.involvesJapan ? "ring-1 ring-[var(--accent-2)]/30" : ""}`}
    >
      <div className="flex items-center justify-between text-[10px] text-white/55 mb-2">
        <span className="font-mono">#{bm.num}</span>
        <span className="font-mono">{formatKickoffJST(bm.kickoffJST)}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <BracketSlotRow
            slot={bm.home}
            teams={teams}
            isWinner={homeWin}
            isLoser={awayWin}
          />
          <BracketSlotRow
            slot={bm.away}
            teams={teams}
            isWinner={awayWin}
            isLoser={homeWin}
          />
        </div>
        {finishedResult && (
          <div className="shrink-0 text-center">
            <SpoilerWrap size="md">
              <div className="text-[20px] font-bold tabular-nums leading-none">
                {bm.result!.home}
                <span className="mx-1.5 text-white/40">-</span>
                {bm.result!.away}
              </div>
            </SpoilerWrap>
            <div className="text-[9px] text-white/45 mt-1">終了</div>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <p className="text-[10.5px] text-white/55 truncate">📍 {bm.venue}</p>
        {bm.involvesJapan && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-2)]/15 text-[var(--accent-2)] font-medium shrink-0 inline-flex items-center gap-1">
            ❤️
            {bm.favoriteTeamIdsInvolved.slice(0, 3).map((id) => (
              <span key={id} className="text-[12px] leading-none">
                {teams.get(id)?.flag ?? "·"}
              </span>
            ))}
            {bm.favoriteTeamIdsInvolved.length > 3 && (
              <span className="text-[9px] opacity-80">
                +{bm.favoriteTeamIdsInvolved.length - 3}
              </span>
            )}
            が来うる枠
          </span>
        )}
      </div>
    </div>
  );

  if (bothResolved) {
    return (
      <Link href={`/matches/${bm.id}`} className="block">
        {card}
      </Link>
    );
  }
  return card;
}
