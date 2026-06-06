"use client";

import { useFavoritePlayers } from "../lib/useFavorites";

type Props = {
  playerId: string;
  size?: "sm" | "md" | "lg";
  /** カード上のオーバーレイ用、絶対配置のラッパー想定 */
  variant?: "overlay" | "inline";
};

export function FavoriteButton({ playerId, size = "md", variant = "overlay" }: Props) {
  const { isFavorite, toggle, hydrated } = useFavoritePlayers();
  const active = isFavorite(playerId);
  const dim = size === "sm" ? "w-7 h-7" : size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const iconSize = size === "sm" ? 14 : size === "lg" ? 22 : 18;

  return (
    <button
      type="button"
      aria-label={active ? "推しから外す" : "推しに追加"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(playerId);
      }}
      className={`${dim} ${
        variant === "overlay" ? "" : ""
      } flex items-center justify-center rounded-full bg-black/45 backdrop-blur-md border border-white/15 transition active:scale-90 hover:bg-black/60`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={hydrated && active ? "#ff3b30" : "none"}
        stroke={hydrated && active ? "#ff3b30" : "#ffffff"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition: "fill 120ms ease, stroke 120ms ease, transform 200ms cubic-bezier(.34,1.56,.64,1)",
          transform: hydrated && active ? "scale(1.05)" : "scale(1)",
        }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
