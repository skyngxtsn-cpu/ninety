"use client";

import { useReminderMatches } from "../lib/useReminderMatches";

type Props = {
  matchId: string;
  size?: "sm" | "md" | "lg";
};

/**
 * ベルアイコンの「リマインド・保存」トグル。
 * 試合カード（小サイズ）と試合詳細ページ（中サイズ）で共用。
 */
export function ReminderButton({ matchId, size = "md" }: Props) {
  const { isReminded, toggle, hydrated } = useReminderMatches();
  const active = isReminded(matchId);
  const dim =
    size === "sm" ? "w-7 h-7" : size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const iconSize = size === "sm" ? 13 : size === "lg" ? 20 : 16;

  return (
    <button
      type="button"
      aria-label={active ? "リマインドを解除" : "リマインドに追加"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(matchId);
      }}
      className={`${dim} flex items-center justify-center rounded-full bg-black/45 backdrop-blur-md border transition active:scale-90 ${
        hydrated && active
          ? "border-sky-400/60 bg-sky-500/25"
          : "border-white/15 hover:bg-black/60"
      }`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={hydrated && active ? "#7dd3fc" : "none"}
        stroke={hydrated && active ? "#7dd3fc" : "#ffffff"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition:
            "fill 120ms ease, stroke 120ms ease, transform 200ms cubic-bezier(.34,1.56,.64,1)",
          transform: hydrated && active ? "scale(1.05)" : "scale(1)",
        }}
      >
        <path d="M6 9a6 6 0 1 1 12 0c0 4 2 5 2 7H4c0-2 2-3 2-7Z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
    </button>
  );
}
