"use client";

import { useReminderMatches } from "../lib/useReminderMatches";

type Props = {
  matchId: string;
  size?: "sm" | "md" | "lg";
};

/**
 * 「お気に入り（観たい）」⭐ トグル。
 * 旧称 ReminderButton。互換のため名前は維持しているが、メタファーは星。
 * 押すと localStorage に保存 + サーバーに匿名集計を送る。
 */
export function ReminderButton({ matchId, size = "md" }: Props) {
  const { isReminded, toggle, hydrated } = useReminderMatches();
  const active = isReminded(matchId);
  const dim =
    size === "sm" ? "w-7 h-7" : size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const iconSize = size === "sm" ? 14 : size === "lg" ? 22 : 17;

  return (
    <button
      type="button"
      aria-label={active ? "お気に入りから外す" : "お気に入りに追加"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(matchId);
      }}
      className={`${dim} flex items-center justify-center rounded-full bg-black/45 backdrop-blur-md border transition active:scale-90 ${
        hydrated && active
          ? "border-[var(--accent-2)]/70 bg-[var(--accent-2)]/25"
          : "border-white/15 hover:bg-black/60"
      }`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={hydrated && active ? "var(--accent-2)" : "none"}
        stroke={hydrated && active ? "var(--accent-2)" : "#ffffff"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition:
            "fill 120ms ease, stroke 120ms ease, transform 200ms cubic-bezier(.34,1.56,.64,1)",
          transform: hydrated && active ? "scale(1.05)" : "scale(1)",
        }}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
}
