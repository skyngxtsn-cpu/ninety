import Link from "next/link";
import type { BracketMatch, BracketSlot } from "../lib/data/bracket";
import type { Team } from "../lib/types";

type Props = {
  bm: BracketMatch;
  teams: Map<string, Team>;
  side: "left" | "right" | "center";
  /** 大きめサイズで描画する（決勝用） */
  big?: boolean;
};

export function BracketMiniCard({ bm, teams, side, big }: Props) {
  const bothResolved = bm.home.kind === "team" && bm.away.kind === "team";
  const finished = bm.status === "finished" && bm.result;
  const homeWin = finished ? bm.result!.home > bm.result!.away : false;
  const awayWin = finished ? bm.result!.away > bm.result!.home : false;

  const cardClasses = `
    relative rounded-lg overflow-hidden
    ${big ? "w-[140px] py-2.5 px-2.5" : "w-[110px] py-1.5 px-2"}
    bg-[var(--bg-2)]/95 backdrop-blur-md border
    ${bm.involvesJapan ? "border-[var(--accent-2)]/55 shadow-[0_0_0_1px_rgba(255,176,32,0.25)]" : "border-white/12"}
  `;

  const content = (
    <div className={cardClasses.trim()}>
      <div className="absolute top-0.5 right-1 text-[7.5px] font-mono text-white/35">
        #{bm.num}
      </div>
      {bm.involvesJapan && bm.favoriteTeamIdsInvolved.length > 0 && (
        <div className="absolute top-0.5 left-1 flex items-center gap-0.5">
          {bm.favoriteTeamIdsInvolved.slice(0, 3).map((id) => (
            <span key={id} className="text-[9px] leading-none">
              {teams.get(id)?.flag ?? "·"}
            </span>
          ))}
        </div>
      )}
      <SlotLine
        slot={bm.home}
        teams={teams}
        side={side}
        score={finished ? bm.result!.home : undefined}
        isWinner={homeWin}
        isLoser={awayWin}
        big={big}
      />
      <div className="h-px bg-white/8 my-0.5" />
      <SlotLine
        slot={bm.away}
        teams={teams}
        side={side}
        score={finished ? bm.result!.away : undefined}
        isWinner={awayWin}
        isLoser={homeWin}
        big={big}
      />
    </div>
  );

  if (bothResolved) {
    return (
      <Link href={`/matches/${bm.id}`} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

function SlotLine({
  slot,
  teams,
  side,
  score,
  isWinner,
  isLoser,
  big,
}: {
  slot: BracketSlot;
  teams: Map<string, Team>;
  side: "left" | "right" | "center";
  score?: number;
  isWinner?: boolean;
  isLoser?: boolean;
  big?: boolean;
}) {
  const { primary, label, flag } = slotDisplay(slot, teams);
  const isPlaceholder = slot.kind !== "team";
  const fontSize = big ? "text-[12px]" : "text-[10.5px]";
  const weight = isWinner ? "font-bold" : isPlaceholder ? "font-normal italic" : "font-semibold";
  const color = isPlaceholder ? "text-white/55" : isLoser ? "text-white/45" : "text-white";

  // 右側は文字を右寄せ
  if (side === "right") {
    return (
      <div className={`flex items-center gap-1.5 ${big ? "h-6" : "h-5"}`}>
        {score !== undefined && (
          <span className={`tabular-nums ${fontSize} ${weight} ${color} w-3 text-left`}>
            {score}
          </span>
        )}
        <span
          className={`flex-1 ${fontSize} ${weight} ${color} truncate text-right`}
          title={primary}
        >
          {label}
        </span>
        <span className={big ? "text-[16px]" : "text-[13px]"}>{flag}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${big ? "h-6" : "h-5"}`}>
      <span className={big ? "text-[16px]" : "text-[13px]"}>{flag}</span>
      <span
        className={`flex-1 ${fontSize} ${weight} ${color} truncate`}
        title={primary}
      >
        {label}
      </span>
      {score !== undefined && (
        <span className={`tabular-nums ${fontSize} ${weight} ${color} w-3 text-right`}>
          {score}
        </span>
      )}
    </div>
  );
}

function slotDisplay(
  slot: BracketSlot,
  teams: Map<string, Team>,
): { primary: string; label: string; flag: string } {
  if (slot.kind === "team") {
    const t = teams.get(slot.teamId);
    return {
      primary: t?.name ?? slot.teamId.toUpperCase(),
      label: t?.shortName ?? slot.teamId.toUpperCase(),
      flag: t?.flag ?? "❓",
    };
  }
  if (slot.kind === "group-rank") {
    return {
      primary: `${slot.group}組 ${slot.rank}位`,
      label: `${slot.group}組${slot.rank}位`,
      flag: "·",
    };
  }
  if (slot.kind === "group-rank-multi") {
    return {
      primary: `${slot.groups.join("/")}組 3位`,
      label: `${slot.groups.join("/")}組3位`,
      flag: "·",
    };
  }
  // winner-of / loser-of
  const verb = slot.kind === "winner-of" ? "勝" : "敗";
  return {
    primary: `Match #${slot.sourceMatchNum} ${verb}者`,
    label: `#${slot.sourceMatchNum}${verb}`,
    flag: "·",
  };
}
