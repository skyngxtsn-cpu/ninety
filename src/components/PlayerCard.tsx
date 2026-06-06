import Link from "next/link";
import Image from "next/image";
import type { Player } from "../lib/types";
import { getTeam } from "../lib/data/teams";
import { FavoriteButton } from "./FavoriteButton";

export async function PlayerCard({
  player,
  size = "md",
}: {
  player: Player;
  size?: "md" | "sm";
}) {
  const team = await getTeam(player.teamId);
  if (!team) return null;
  const initials = player.name.slice(0, 1);
  const dim = size === "sm" ? "w-[140px] h-[180px]" : "w-[170px] h-[220px]";
  return (
    <Link
      href={`/players/${player.id}`}
      className={`snap-start shrink-0 ${dim} relative rounded-2xl overflow-hidden border border-[var(--border)] block group`}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, ${team.primary} 0%, ${team.secondary} 100%)`,
          opacity: 0.65,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* 画像 or イニシャル */}
      {player.photoUrl ? (
        <div className="absolute inset-x-0 top-2 bottom-[78px] flex items-end justify-center">
          <Image
            src={player.photoUrl}
            alt={player.name}
            width={200}
            height={240}
            className="h-full w-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.55)]"
            unoptimized
          />
        </div>
      ) : (
        <div className="absolute inset-x-0 top-[28%] flex justify-center">
          <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-bold text-white/95 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.6)]">
            {initials}
          </div>
        </div>
      )}

      <div className="absolute inset-0 flex items-start justify-between p-3">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md font-mono pointer-events-none">
          #{player.number}
        </span>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-2xl drop-shadow pointer-events-none">{team.flag}</span>
          <FavoriteButton playerId={player.id} size="sm" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
        <p className="text-[10px] tracking-widest uppercase text-white/70">
          {player.tagline}
        </p>
        <p className="text-[14px] font-semibold leading-tight">{player.name}</p>
        <p className="text-[11px] text-white/70">{player.club}</p>
      </div>
    </Link>
  );
}
