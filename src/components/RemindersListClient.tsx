"use client";

import Link from "next/link";
import { useReminderMatches } from "../lib/useReminderMatches";

export type ReminderMatchSnapshot = {
  id: string;
  date: string; // YYYY-MM-DD (JST)
  timeLabel: string; // HH:mm (JST)
  homeFlag: string;
  awayFlag: string;
  homeName: string;
  awayName: string;
  stage: string;
  venue: string;
  status: "scheduled" | "live" | "finished";
};

type Props = {
  matches: ReminderMatchSnapshot[];
};

export function RemindersListClient({ matches }: Props) {
  const { matches: ids, hydrated, toggle } = useReminderMatches();
  if (!hydrated) {
    return (
      <div className="px-4 pt-4">
        <div className="h-20 glass rounded-2xl animate-pulse" />
      </div>
    );
  }
  const set = new Set(ids);
  const list = matches.filter((m) => set.has(m.id));

  if (list.length === 0) {
    return (
      <div className="mx-4 mt-6 glass rounded-2xl p-6 text-center">
        <p className="text-[36px] mb-2">⭐</p>
        <p className="text-[14px] font-semibold mb-1">
          お気に入りに入れた試合はまだありません
        </p>
        <p className="text-[12px] text-white/55 leading-relaxed mb-4">
          試合カードの⭐ボタンを押すと、ここに集まります。
          推しチームと別に、観たい試合をピン留めできます。
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#ffb020] text-[13px] font-semibold text-white"
        >
          試合を探す
        </Link>
      </div>
    );
  }

  // 日付ごとにグループ化
  const byDate = new Map<string, ReminderMatchSnapshot[]>();
  for (const m of list) {
    const arr = byDate.get(m.date) ?? [];
    arr.push(m);
    byDate.set(m.date, arr);
  }
  const dates = Array.from(byDate.keys()).sort();

  return (
    <>
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--text-dim)]">
          Reminders
        </p>
        <span className="text-[11px] text-white/55">{list.length} 試合</span>
      </div>
      {dates.map((d) => (
        <section key={d} className="px-4 pt-4">
          <h2 className="text-[13px] font-bold mb-2">{formatDateLabel(d)}</h2>
          <div className="space-y-2">
            {byDate.get(d)!.map((m) => (
              <ReminderRow key={m.id} match={m} onToggle={() => toggle(m.id)} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function ReminderRow({
  match,
  onToggle,
}: {
  match: ReminderMatchSnapshot;
  onToggle: () => void;
}) {
  return (
    <div className="glass rounded-2xl p-3 ring-1 ring-[var(--accent-2)]/35 flex items-center gap-3">
      <Link
        href={`/matches/${match.id}`}
        className="flex-1 min-w-0 flex items-center gap-3"
      >
        <span className="font-mono text-[11px] text-white/55 w-10 shrink-0">
          {match.timeLabel}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold">
            <span>{match.homeFlag}</span>
            <span className="truncate">{match.homeName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] font-semibold">
            <span>{match.awayFlag}</span>
            <span className="truncate">{match.awayName}</span>
          </div>
          <p className="text-[10px] text-white/45 mt-0.5">
            {match.stage} ・ {match.venue}
          </p>
        </div>
      </Link>
      <button
        onClick={onToggle}
        aria-label="お気に入りから外す"
        className="w-9 h-9 rounded-full bg-[var(--accent-2)]/18 border border-[var(--accent-2)]/45 text-[var(--accent-2)] flex items-center justify-center shrink-0 hover:bg-[var(--accent-2)]/30 transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="currentColor"
            fillOpacity="0.3"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

function formatDateLabel(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-");
  if (!y || !m || !d) return yyyymmdd;
  const date = new Date(`${y}-${m}-${d}T00:00:00+09:00`);
  const dow = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${Number(m)}月${Number(d)}日 (${dow})`;
}
