import type { TournamentCountdown } from "../lib/data/matches";

type Props = {
  countdown: TournamentCountdown;
};

/**
 * 大会全体の進行カウントダウン。
 * 「あと何日で〜」アプローチでスリムに横一列表示。
 * 大会フェーズによって表示する内容を切替える。
 */
export function TournamentProgress({ countdown }: Props) {
  const {
    daysUntilOpening,
    daysUntilGroupEnd,
    daysUntilKnockoutStart,
    daysUntilFinal,
    matchesRemaining,
    totalMatches,
  } = countdown;

  const items: { label: string; value: string }[] = [];

  if (daysUntilOpening > 0) {
    items.push({ label: "開幕まで", value: `あと${daysUntilOpening}日` });
    items.push({ label: "決勝まで", value: `あと${daysUntilFinal}日` });
  } else if (daysUntilGroupEnd > 0) {
    items.push({ label: "グループ突破まで", value: `あと${daysUntilGroupEnd}日` });
    items.push({ label: "決勝T 開幕まで", value: `あと${daysUntilKnockoutStart}日` });
    items.push({ label: "決勝まで", value: `あと${daysUntilFinal}日` });
  } else if (daysUntilFinal > 0) {
    items.push({ label: "決勝T 進行中", value: `残り${matchesRemaining}試合` });
    items.push({ label: "決勝まで", value: `あと${daysUntilFinal}日` });
  } else {
    items.push({ label: "W杯 2026", value: "閉幕" });
  }

  return (
    <div className="mx-4 mt-1 glass rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        {items.map((it) => (
          <div key={it.label}>
            <p className="text-[9.5px] tracking-widest uppercase text-white/45">
              {it.label}
            </p>
            <p className="text-[14px] font-bold tracking-tight tabular-nums leading-none mt-0.5">
              {it.value}
            </p>
          </div>
        ))}
        <div className="ml-auto">
          <p className="text-[9.5px] tracking-widest uppercase text-white/45 text-right">
            進行
          </p>
          <p className="text-[12px] text-white/65 mt-0.5 tabular-nums">
            {totalMatches - matchesRemaining} / {totalMatches}
          </p>
        </div>
      </div>
    </div>
  );
}
