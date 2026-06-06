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
