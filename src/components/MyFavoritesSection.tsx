"use client";

import Link from "next/link";
import Image from "next/image";
import type { Player } from "../lib/types";
import { useFavoritePlayers } from "../lib/useFavorites";
import { SectionHeader } from "./SectionHeader";

type Props = {
  allPlayers: Pick<
    Player,
    "id" | "name" | "club" | "photoUrl" | "number" | "tagline" | "teamId"
  >[];
  /** id -> flag */
  teamFlags: Record<string, string>;
  /** id -> [primary, secondary] colors */
  teamColors: Record<string, [string, string]>;
};

export function MyFavoritesSection({ allPlayers, teamFlags, teamColors }: Props) {
  const { favorites, hydrated } = useFavoritePlayers();
  if (!hydrated || favorites.length === 0) return null;

  const list = favorites
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter(Boolean) as (typeof allPlayers)[number][];

  if (list.length === 0) return null;

  return (
    <>
      <SectionHeader kicker="My ❤️" title="あなたの推し選手" />
      <div className="mx-4 grid grid-cols-2 gap-3">
        {list.map((p) => {
            const flag = teamFlags[p.teamId] ?? "⚽";
            const [c1, c2] = teamColors[p.teamId] ?? ["#3b3f4a", "#7a8395"];
            return (
              <Link
                key={p.id}
                href={`/players/${p.id}`}
                className="h-[210px] relative rounded-2xl overflow-hidden border border-[var(--border)] block"
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`,
                    opacity: 0.6,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                {p.photoUrl ? (
                  <div className="absolute inset-x-0 top-2 bottom-[64px] flex items-end justify-center">
                    <Image
                      src={p.photoUrl}
                      alt={p.name}
                      width={180}
                      height={220}
                      unoptimized
                      className="h-full w-auto object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-x-0 top-[28%] flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-2xl font-bold text-white/95">
                      {p.name.slice(0, 1)}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 flex items-start justify-between p-2.5 pointer-events-none">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/45 backdrop-blur-md font-mono">
                    #{p.number}
                  </span>
                  <span className="text-xl drop-shadow">{flag}</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <p className="text-[10px] tracking-widest uppercase text-white/70">
                    {p.tagline}
                  </p>
                  <p className="text-[13px] font-semibold leading-tight">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-white/70 truncate">{p.club}</p>
                </div>
              </Link>
            );
          })}
      </div>
    </>
  );
}
