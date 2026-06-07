import Link from "next/link";
import Image from "next/image";
import type { PredictedLineup } from "../lib/data/formations";
import { getPlayer } from "../lib/data/players";

type Props = {
  lineup: PredictedLineup;
  /** ピッチカラー */
  primary: string;
  secondary: string;
  /** ヘッダー用 */
  flag: string;
  teamName: string;
  teamId: string;
  /**
   * 試合フェーズによってラベル切替
   * - predicted: 試合開始 1h より前
   * - announced: 1h 前以降 〜 試合開始 まで（実スタメン or 想定でも「スタメン」表記）
   * - live: 試合開始後
   * - finished: 終了後
   */
  variant?: "predicted" | "announced" | "live" | "finished";
  /** override 経由で本物のスタメンが入っている時 true */
  isConfirmed?: boolean;
};

function labelFor(variant: Props["variant"], isConfirmed: boolean): string {
  if (variant === "live") return isConfirmed ? "LIVE スタメン" : "LIVE 想定";
  if (variant === "finished") return "スタメン";
  if (variant === "announced") return isConfirmed ? "スタメン" : "間もなく発表";
  return "想定スタメン";
}

function toneFor(variant: Props["variant"], isConfirmed: boolean): string {
  if (variant === "live") return "bg-rose-500/25 text-rose-200";
  if (variant === "finished") return "bg-white/12 text-white/85";
  if (variant === "announced")
    return isConfirmed
      ? "bg-emerald-500/25 text-emerald-200"
      : "bg-amber-500/20 text-amber-200";
  return "bg-white/8 text-white/65";
}

function displayName(name: string): string {
  // フルネームをそのまま返す。長い場合は2行に自動折り返し（CSS 側）
  return name.trim();
}

function initialChar(name: string): string {
  const t = name.trim();
  // 日本語ならそのまま1文字、英字なら大文字
  return t.slice(0, 1).toUpperCase();
}

function darken(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`;
}

export function Pitch({
  lineup,
  primary,
  secondary,
  flag,
  teamName,
  teamId,
  variant = "predicted",
  isConfirmed = false,
}: Props) {
  const phaseLabel = labelFor(variant, isConfirmed);
  const phaseTone = toneFor(variant, isConfirmed);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <Link
          href={`/teams/${teamId}`}
          className="flex items-center gap-2 min-w-0"
        >
          <span className="text-[20px] leading-none">{flag}</span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold tracking-tight truncate">
              {teamName}
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium tracking-wide ${phaseTone}`}
              >
                {phaseLabel}
              </span>
              {lineup.manager && (
                <p className="text-[10px] text-white/55 truncate">
                  {lineup.manager}
                </p>
              )}
            </div>
          </div>
        </Link>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/10 shrink-0">
          {lineup.formation}
        </span>
      </div>

      {/* ピッチ */}
      <div
        className="relative w-full"
        style={{
          aspectRatio: "5 / 7",
          background: `linear-gradient(0deg, ${primary} 0%, ${darken(primary, 0.5)} 50%, ${secondary} 100%)`,
        }}
      >
        {/* ピッチライン (SVGオーバーレイ) */}
        <svg
          viewBox="0 0 100 140"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          {/* 外枠 */}
          <rect
            x="3"
            y="3"
            width="94"
            height="134"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="0.4"
          />
          {/* センターライン */}
          <line
            x1="3"
            y1="70"
            x2="97"
            y2="70"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="0.4"
          />
          {/* センターサークル */}
          <circle
            cx="50"
            cy="70"
            r="10"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.4"
          />
          <circle cx="50" cy="70" r="0.8" fill="rgba(255,255,255,0.5)" />
          {/* 下ペナルティエリア (自陣) */}
          <rect
            x="20"
            y="120"
            width="60"
            height="17"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.4"
          />
          <rect
            x="34"
            y="130"
            width="32"
            height="7"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.4"
          />
          {/* 上ペナルティエリア (相手陣) */}
          <rect
            x="20"
            y="3"
            width="60"
            height="17"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.4"
          />
          <rect
            x="34"
            y="3"
            width="32"
            height="7"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.4"
          />
        </svg>

        {/* 選手ドット */}
        {lineup.slots.map((slot) => {
          const left = `${slot.x}%`;
          const bottom = `${slot.y}%`;
          const player = slot.playerId ? getPlayer(slot.playerId) : undefined;
          const photo = player?.photoUrl;
          const initial = initialChar(slot.name);

          const dot = (
            <div className="flex flex-col items-center pointer-events-auto">
              {/* 写真コンテナ。iOS Safari で transform + border-radius のクリップが
                  甘いため、clip-path: circle() で確実に円形にクリップする。
                  さらに isolation で transform 由来のはみ出しを防ぐ */}
              <div
                className="relative w-12 h-12 rounded-full border-2 shadow-[0_4px_10px_-2px_rgba(0,0,0,0.5)]"
                style={{
                  background: `linear-gradient(160deg, ${secondary} 0%, ${primary} 100%)`,
                  borderColor: "rgba(255,255,255,0.65)",
                  clipPath: "circle(50% at 50% 50%)",
                  isolation: "isolate",
                }}
              >
                {photo ? (
                  <Image
                    src={photo}
                    alt={slot.name}
                    width={96}
                    height={96}
                    unoptimized
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[14px] font-bold text-white">
                    {initial}
                  </div>
                )}
              </div>
              {/* 番号バッジは clip-path 外に置く（円から少し顔を出すデザイン保持） */}
              <span className="-mt-3.5 ml-7 min-w-[18px] h-[18px] px-1 rounded-full bg-black/85 border border-white/40 flex items-center justify-center text-[9px] font-bold text-white tabular-nums">
                {slot.number}
              </span>
              <div className="mt-0.5 text-center max-w-[68px]">
                <p className="text-[10px] font-semibold text-white leading-tight px-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] break-words">
                  {displayName(slot.name)}
                </p>
                <p className="text-[8.5px] text-white/70 leading-tight whitespace-nowrap">
                  {slot.role}
                </p>
              </div>
            </div>
          );
          return (
            <div
              key={`${slot.number}-${slot.name}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left, bottom }}
            >
              {slot.playerId ? (
                <Link
                  href={`/players/${slot.playerId}`}
                  className="block transition active:scale-95"
                >
                  {dot}
                </Link>
              ) : (
                dot
              )}
            </div>
          );
        })}
      </div>

      {variant === "predicted" && lineup.note && (
        <p className="px-4 py-3 text-[10px] text-white/45 leading-relaxed">
          ※ {lineup.note} 正式なスタメンは試合開始 1 時間前に発表されます。
        </p>
      )}
      {variant === "announced" && !isConfirmed && (
        <p className="px-4 py-3 text-[10px] text-amber-200/85 leading-relaxed">
          ⏱ もうすぐ試合開始。下記は想定スタメンです。実スタメン発表があり次第更新されます。
        </p>
      )}
    </div>
  );
}

