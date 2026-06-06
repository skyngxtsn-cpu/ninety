import Link from "next/link";
import type { BracketSlot } from "../lib/data/bracket";
import type { Team } from "../lib/types";

type Props = {
  slot: BracketSlot;
  teams: Map<string, Team>;
  /** 試合終了時に勝者を強調するフラグ */
  isWinner?: boolean;
  /** 試合終了時に敗者を弱める */
  isLoser?: boolean;
};

export function BracketSlotRow({ slot, teams, isWinner, isLoser }: Props) {
  if (slot.kind === "team") {
    const team = teams.get(slot.teamId);
    if (!team) {
      return (
        <Row
          flag="❓"
          name={slot.teamId.toUpperCase()}
          isWinner={isWinner}
          isLoser={isLoser}
        />
      );
    }
    return (
      <Link href={`/teams/${team.id}`} className="block">
        <Row
          flag={team.flag}
          name={team.name}
          isWinner={isWinner}
          isLoser={isLoser}
        />
      </Link>
    );
  }

  if (slot.kind === "group-rank") {
    return (
      <Placeholder
        primaryLabel={`${slot.group}組 ${slot.rank}位`}
        subLabel="グループ未消化"
      />
    );
  }

  if (slot.kind === "group-rank-multi") {
    return (
      <Placeholder
        primaryLabel={`${slot.groups.join("/")}組 3位`}
        subLabel="3位qualifier"
      />
    );
  }

  // winner-of / loser-of
  const verb = slot.kind === "winner-of" ? "の勝者" : "の敗者";
  if (slot.deep) {
    return (
      <DeepMatchup
        home={slot.deep.home}
        away={slot.deep.away}
        verb={verb}
        teams={teams}
      />
    );
  }
  return (
    <Placeholder
      primaryLabel={slot.kind === "winner-of" ? "前段勝者" : "前段敗者"}
      subLabel={`Match #${slot.sourceMatchNum}`}
    />
  );
}

function Row({
  flag,
  name,
  isWinner,
  isLoser,
}: {
  flag: string;
  name: string;
  isWinner?: boolean;
  isLoser?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 py-1.5 ${
        isLoser ? "opacity-50" : ""
      }`}
    >
      <span className="text-[22px] leading-none drop-shadow">{flag}</span>
      <span
        className={`text-[14px] tracking-tight ${
          isWinner ? "font-bold text-white" : "font-semibold"
        }`}
      >
        {name}
      </span>
      {isWinner && <span className="text-[10px] text-emerald-300">勝</span>}
    </div>
  );
}

function Placeholder({
  primaryLabel,
  subLabel,
}: {
  primaryLabel: string;
  subLabel: string;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="w-[22px] h-[22px] rounded-full border border-dashed border-white/30 flex items-center justify-center text-[10px] text-white/40">
        ?
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-white/70 italic">
          {primaryLabel}
        </p>
        <p className="text-[9.5px] text-white/40">{subLabel}</p>
      </div>
    </div>
  );
}

function DeepMatchup({
  home,
  away,
  verb,
  teams,
}: {
  home: BracketSlot;
  away: BracketSlot;
  verb: string;
  teams: Map<string, Team>;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="w-[22px] h-[22px] rounded-full border border-dashed border-white/30 flex items-center justify-center text-[10px] text-white/40">
        ?
      </span>
      <div className="min-w-0 flex items-baseline gap-1.5 flex-wrap">
        <SlotName slot={home} teams={teams} />
        <span className="text-[10px] text-white/40">vs</span>
        <SlotName slot={away} teams={teams} />
        <span className="text-[10px] text-white/55 ml-0.5">{verb}</span>
      </div>
    </div>
  );
}

function SlotName({
  slot,
  teams,
}: {
  slot: BracketSlot;
  teams: Map<string, Team>;
}) {
  if (slot.kind === "team") {
    const team = teams.get(slot.teamId);
    return (
      <span className="text-[12px] font-semibold inline-flex items-center gap-1">
        <span className="text-[14px] leading-none">{team?.flag ?? "❓"}</span>
        {team?.name ?? slot.teamId.toUpperCase()}
      </span>
    );
  }
  if (slot.kind === "group-rank") {
    return (
      <span className="text-[12px] font-medium text-white/70 italic">
        {slot.group}組 {slot.rank}位
      </span>
    );
  }
  if (slot.kind === "group-rank-multi") {
    return (
      <span className="text-[12px] font-medium text-white/70 italic">
        {slot.groups.join("/")}組 3位
      </span>
    );
  }
  return (
    <span className="text-[12px] font-medium text-white/70 italic">
      Match #{slot.sourceMatchNum} {slot.kind === "winner-of" ? "勝者" : "敗者"}
    </span>
  );
}
