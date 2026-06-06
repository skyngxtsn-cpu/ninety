import Link from "next/link";
import Image from "next/image";
import type { Story } from "../lib/types";
import { getPlayer } from "../lib/data/players";
import { getTeamSync } from "../lib/data/teams";

export async function StoryCard({ story }: { story: Story }) {
  const href = story.matchId
    ? `/matches/${story.matchId}`
    : story.playerId
      ? `/players/${story.playerId}`
      : story.teamId
        ? `/teams/${story.teamId}`
        : "#";

  // 写真URL解決：明示photoUrl > player.photoUrl > none
  const player = story.playerId ? getPlayer(story.playerId) : undefined;
  const photo = story.photoUrl ?? player?.photoUrl;

  // 試合フィーチャー時の旗
  const teamA = story.flagTeams ? getTeamSync(story.flagTeams[0]) : undefined;
  const teamB = story.flagTeams ? getTeamSync(story.flagTeams[1]) : undefined;
  const team = story.teamId ? getTeamSync(story.teamId) : undefined;

  return (
    <Link
      href={href}
      className="snap-start shrink-0 w-[260px] h-[340px] relative overflow-hidden rounded-2xl border border-[var(--border)] block"
    >
      {/* ベースグラデ */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, ${story.gradient[0]} 0%, ${story.gradient[1]} 100%)`,
          opacity: 0.85,
        }}
      />

      {/* ビジュアル: 選手写真 / 試合の旗 / チーム旗 */}
      {story.kind === "player" && photo && (
        <div className="absolute inset-x-0 top-[14%] bottom-[42%] flex items-end justify-center">
          <Image
            src={photo}
            alt={story.title}
            width={300}
            height={360}
            unoptimized
            className="h-full w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
          />
        </div>
      )}
      {story.kind === "match" && teamA && teamB && (
        <div className="absolute inset-x-0 top-[12%] bottom-[44%] flex items-center justify-center gap-4">
          <span className="text-[64px] leading-none drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]">
            {teamA.flag}
          </span>
          <span className="text-[14px] tracking-[0.3em] uppercase text-white/65">vs</span>
          <span className="text-[64px] leading-none drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]">
            {teamB.flag}
          </span>
        </div>
      )}
      {story.kind === "team" && team && (
        <div className="absolute inset-x-0 top-[12%] bottom-[44%] flex items-center justify-center">
          <span className="text-[110px] leading-none drop-shadow-[0_10px_22px_rgba(0,0,0,0.55)]">
            {team.flag}
          </span>
        </div>
      )}
      {story.kind === "coach" && team && (
        <div className="absolute inset-x-0 top-[14%] bottom-[42%] flex items-center justify-center">
          <div
            className="w-[120px] h-[120px] rounded-3xl flex items-center justify-center text-[44px] font-bold drop-shadow-[0_10px_24px_rgba(0,0,0,0.6)]"
            style={{
              background: `linear-gradient(160deg, ${team.primary} 0%, ${team.secondary} 100%)`,
            }}
          >
            {team.coach.slice(0, 1)}
          </div>
        </div>
      )}

      {/* 下半分の暗転 */}
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/95 via-black/70 to-transparent" />

      {/* 上部のキッカー */}
      <div className="absolute inset-x-0 top-0 p-4">
        <span className="inline-block text-[10px] tracking-[0.2em] uppercase font-semibold text-white px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md">
          {story.kicker}
        </span>
      </div>

      {/* 下部のタイトル/本文 */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="text-[20px] font-bold leading-tight tracking-tight">
          {story.title}
        </h3>
        <p className="mt-2 text-[12.5px] leading-relaxed text-white/85">
          {story.body}
        </p>
      </div>
    </Link>
  );
}
