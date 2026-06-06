import { CHANNELS, type BroadcastChannelId } from "../lib/data/broadcasts";

type Props = {
  id: BroadcastChannelId | string;
  /** 大サイズ（match detail 用） */
  size?: "sm" | "md" | "lg";
  /** クリック時に外部リンクへ */
  withLink?: boolean;
  /** "無料" "サブスク" 等のティアバッジを横に出す */
  showTier?: boolean;
};

const TIER_LABEL: Record<string, string> = {
  free: "無料",
  subscription: "サブスク",
  "with-account": "要アカウント",
};

const TIER_TONE: Record<string, string> = {
  free: "bg-emerald-500/20 text-emerald-200",
  subscription: "bg-amber-500/20 text-amber-200",
  "with-account": "bg-sky-500/20 text-sky-200",
};

export function BroadcastChip({
  id,
  size = "sm",
  withLink = false,
  showTier = false,
}: Props) {
  const channel = CHANNELS[id as BroadcastChannelId];
  if (!channel) {
    // 未知のチャンネルは文字列としてそのまま出す
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-white/8 text-white/85">
        📺 {String(id)}
      </span>
    );
  }

  const sizeClasses =
    size === "lg"
      ? "text-[12px] px-2.5 py-1.5 gap-1.5 rounded-lg"
      : size === "md"
        ? "text-[11px] px-2 py-1 gap-1 rounded-md"
        : "text-[10px] px-1.5 py-0.5 gap-1 rounded-md";
  const glyphSize =
    size === "lg" ? "w-5 h-5 text-[12px]" : size === "md" ? "w-4 h-4 text-[10px]" : "w-3.5 h-3.5 text-[9px]";

  const inner = (
    <span
      className={`inline-flex items-center font-semibold ${sizeClasses}`}
      style={{
        backgroundColor: `${channel.brand}22`,
        color: channel.text === "white" ? "#fff" : "#fff",
        border: `1px solid ${channel.brand}66`,
      }}
    >
      <span
        className={`inline-flex items-center justify-center rounded ${glyphSize} font-bold leading-none`}
        style={{
          backgroundColor: channel.brand,
          color: channel.text === "white" ? "#fff" : "#000",
        }}
      >
        {channel.glyph}
      </span>
      <span className="tracking-tight">{channel.shortName}</span>
      {showTier && (
        <span
          className={`ml-1 px-1.5 py-px rounded-full text-[9px] font-medium ${TIER_TONE[channel.tier]}`}
        >
          {TIER_LABEL[channel.tier]}
        </span>
      )}
    </span>
  );

  if (withLink && channel.url) {
    return (
      <a
        href={channel.url}
        target="_blank"
        rel="noreferrer"
        className="inline-block hover:opacity-90 transition"
      >
        {inner}
      </a>
    );
  }
  return inner;
}

export function BroadcastChipList({
  ids,
  size = "sm",
  withLink = false,
  showTier = false,
}: {
  ids: (BroadcastChannelId | string)[];
  size?: Props["size"];
  withLink?: boolean;
  showTier?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <BroadcastChip
          key={id}
          id={id}
          size={size}
          withLink={withLink}
          showTier={showTier}
        />
      ))}
    </div>
  );
}

/**
 * アイコンのみのコンパクト表示。一覧の試合カードなど狭いスペース用。
 * 文字なしで、配色された小さな glyph 四角だけが並ぶ。
 */
export function BroadcastIcons({
  ids,
  size = "sm",
}: {
  ids: (BroadcastChannelId | string)[];
  size?: "xs" | "sm";
}) {
  const dim = size === "xs" ? "w-4 h-4 text-[8px]" : "w-[18px] h-[18px] text-[9px]";
  return (
    <div className="flex items-center gap-1">
      {ids.map((id) => {
        const ch = CHANNELS[id as BroadcastChannelId];
        if (!ch) {
          return (
            <span
              key={id}
              className={`inline-flex items-center justify-center rounded font-bold ${dim} bg-white/15 text-white/85`}
              aria-label={String(id)}
              title={String(id)}
            >
              ?
            </span>
          );
        }
        // 短い表示用ラベル：NHK_G→N、NHK_BS→BS、NTV→日、FUJI→フ、TBS→T、ABEMA→ア、DAZN→D
        const label =
          ch.id === "NHK_G"
            ? "N"
            : ch.id === "NHK_BS"
              ? "BS"
              : ch.id === "NTV"
                ? "日"
                : ch.id === "FUJI"
                  ? "フ"
                  : ch.id === "TBS"
                    ? "T"
                    : ch.id === "TEREASA"
                      ? "EX"
                      : ch.id === "ABEMA"
                        ? "A"
                        : ch.id === "DAZN"
                          ? "D"
                          : ch.id === "U-NEXT"
                            ? "U"
                            : ch.id === "NHK_PLUS"
                              ? "N+"
                              : ch.id === "TVER"
                                ? "Tv"
                                : ch.glyph;
        return (
          <span
            key={id}
            className={`inline-flex items-center justify-center rounded font-bold leading-none ${dim}`}
            style={{
              backgroundColor: ch.brand,
              color: ch.text === "white" ? "#fff" : "#000",
            }}
            aria-label={ch.name}
            title={ch.name}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
