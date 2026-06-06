type Props = {
  items: { label: string; rating: number }[];
  /** バーのアクセントカラー（チームの primary など） */
  accent: string;
};

/**
 * 強み (rating 0-5) を縦リストでバー表示。
 * 試合のスタッツのような直感性を初心者にも提供。
 */
export function StrengthBars({ items, accent }: Props) {
  return (
    <div className="space-y-2.5">
      {items.map((s) => {
        const pct = Math.max(0, Math.min(5, s.rating)) / 5;
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11.5px] font-medium text-white/85">
                {s.label}
              </span>
              <span className="text-[10px] font-mono text-white/55 tabular-nums">
                {s.rating.toFixed(1)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct * 100}%`,
                  background: `linear-gradient(90deg, ${accent} 0%, ${accent}cc 100%)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
