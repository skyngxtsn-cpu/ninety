import type { Match } from "../lib/types";
import { SpoilerWrap } from "./SpoilerWrap";

type Props = {
  events: NonNullable<Match["events"]>;
  homeTeamId: string;
  homeFlag: string;
  awayTeamId: string;
  awayFlag: string;
};

type TimelineEvent = {
  minute: number;
  injuryTime: number | null;
  /** 表示時に左 (home) か右 (away) か中央（その他）か */
  side: "home" | "away" | "center";
  icon: string;
  text: string;
  detail?: string;
};

function buildTimeline(
  events: NonNullable<Match["events"]>,
  homeTeamId: string,
  awayTeamId: string,
): TimelineEvent[] {
  const arr: TimelineEvent[] = [];

  for (const g of events.goals) {
    const side =
      g.team === homeTeamId ? "home" : g.team === awayTeamId ? "away" : "center";
    const icon =
      g.type === "PENALTY" ? "⚽️🅿️" : g.type === "OWN" ? "⚽️🤦" : "⚽️";
    const detail = g.assist ? `(A: ${g.assist})` : undefined;
    arr.push({
      minute: g.minute ?? 0,
      injuryTime: g.injuryTime,
      side,
      icon,
      text: g.scorer,
      detail,
    });
  }
  for (const b of events.bookings) {
    const side =
      b.team === homeTeamId ? "home" : b.team === awayTeamId ? "away" : "center";
    const icon =
      b.card === "RED" || b.card === "YELLOW_RED" ? "🟥" : "🟨";
    arr.push({
      minute: b.minute ?? 0,
      injuryTime: null,
      side,
      icon,
      text: b.player,
    });
  }
  for (const s of events.substitutions) {
    const side =
      s.team === homeTeamId ? "home" : s.team === awayTeamId ? "away" : "center";
    arr.push({
      minute: s.minute ?? 0,
      injuryTime: null,
      side,
      icon: "🔄",
      text: `${s.playerIn} ← ${s.playerOut}`,
    });
  }

  arr.sort((a, b) => {
    const am = (a.minute ?? 0) + (a.injuryTime ?? 0) / 60;
    const bm = (b.minute ?? 0) + (b.injuryTime ?? 0) / 60;
    return am - bm;
  });
  return arr;
}

export function MatchEventTimeline({
  events,
  homeTeamId,
  homeFlag,
  awayTeamId,
  awayFlag,
}: Props) {
  const timeline = buildTimeline(events, homeTeamId, awayTeamId);
  if (timeline.length === 0) return null;

  return (
    <SpoilerWrap size="lg" hint="試合の経過を見る">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/55">
            Timeline
          </span>
          <span className="text-[10px] text-white/40">{timeline.length} 件</span>
        </div>
        <div className="space-y-2">
          {timeline.map((e, i) => (
            <EventRow
              key={i}
              ev={e}
              homeFlag={homeFlag}
              awayFlag={awayFlag}
            />
          ))}
        </div>
      </div>
    </SpoilerWrap>
  );
}

function EventRow({
  ev,
  homeFlag,
  awayFlag,
}: {
  ev: TimelineEvent;
  homeFlag: string;
  awayFlag: string;
}) {
  const minuteStr =
    ev.injuryTime && ev.injuryTime > 0
      ? `${ev.minute}+${ev.injuryTime}'`
      : `${ev.minute}'`;
  const flag = ev.side === "home" ? homeFlag : ev.side === "away" ? awayFlag : "";

  // ホーム = 左寄せ、アウェイ = 右寄せ、中央 = センター
  if (ev.side === "away") {
    return (
      <div className="flex items-center gap-2 text-[12px] justify-end">
        <span className="text-white/85 truncate">{ev.text}</span>
        {ev.detail && (
          <span className="text-[10px] text-white/45 truncate">{ev.detail}</span>
        )}
        <span className="text-[16px]">{ev.icon}</span>
        <span className="font-mono text-[11px] text-white/55 tabular-nums shrink-0 w-10 text-right">
          {minuteStr}
        </span>
        <span className="text-[14px] leading-none shrink-0">{flag}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="text-[14px] leading-none shrink-0">{flag}</span>
      <span className="font-mono text-[11px] text-white/55 tabular-nums shrink-0 w-10">
        {minuteStr}
      </span>
      <span className="text-[16px]">{ev.icon}</span>
      <span className="text-white/85 truncate">{ev.text}</span>
      {ev.detail && (
        <span className="text-[10px] text-white/45 truncate">{ev.detail}</span>
      )}
    </div>
  );
}
