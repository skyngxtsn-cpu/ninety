import Link from "next/link";
import Image from "next/image";
import { MatchListCard } from "./MatchListCard";
import type { Team, Player, Match, Group } from "../lib/types";
import { matchesByTeam } from "../lib/data/matches";
import { getAllGroups } from "../lib/data/standings";
import { playersByTeam } from "../lib/data/players";

type Props = {
  team: Team;
};

export async function MyTeamBlock({ team }: Props) {
  const [allMatches, allGroups] = await Promise.all([
    matchesByTeam(team.id),
    getAllGroups(),
  ]);
  const nextMatch = allMatches.find((m) => m.status !== "finished");
  const players = playersByTeam(team.id).slice(0, 3);
  const group = allGroups.find((g) => g.name === team.group);
  const myRow = group?.rows.find((r) => r.teamId === team.id);

  return (
    <div className="mx-4 mb-5">
      {/* チームヘッダー */}
      <Link
        href={`/teams/${team.id}`}
        className="block relative rounded-2xl overflow-hidden border border-[var(--border-strong)] mb-3"
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${team.primary} 0%, ${team.secondary} 100%)`,
            opacity: 0.6,
          }}
        />
        <div className="absolute inset-0 hero-shade" />
        <div className="relative p-4 flex items-center gap-3">
          <span className="text-[42px] leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            {team.flag}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] tracking-widest uppercase text-white/70">
              グループ{team.group}
            </p>
            <p className="text-[18px] font-bold tracking-tight leading-tight">
              {team.name}
            </p>
            <p className="text-[11px] text-white/70">
              {team.coach} · {team.playStyle}
            </p>
          </div>
          {myRow && (
            <div className="shrink-0 text-right">
              <p className="text-[9px] tracking-widest uppercase text-white/65">勝点</p>
              <p className="text-[22px] font-bold tabular-nums leading-none">
                {myRow.pts}
              </p>
              <p className="text-[10px] text-white/70 mt-0.5">
                {myRow.w}勝{myRow.d}分{myRow.l}敗
              </p>
            </div>
          )}
        </div>
      </Link>

      {/* 次の試合 */}
      {nextMatch && (
        <div className="mb-3">
          <p className="text-[9px] tracking-widest uppercase text-white/45 mb-1.5">
            次の試合
          </p>
          <MatchListCard match={nextMatch} />
        </div>
      )}

      {/* 監督コメント（あれば） */}
      {team.coachQuote && (
        <blockquote className="glass rounded-2xl p-4 mb-3">
          <p className="text-[10px] tracking-widest uppercase text-[var(--accent-2)] mb-1.5">
            監督の意気込み
          </p>
          <p className="text-[13px] leading-relaxed text-white/90 italic">
            {team.coachQuote}
          </p>
        </blockquote>
      )}

      {/* 注目選手 */}
      {players.length > 0 && (
        <div>
          <p className="text-[9px] tracking-widest uppercase text-white/45 mb-2">
            注目選手
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {players.map((p) => (
              <PlayerMini key={p.id} player={p} team={team} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerMini({ player, team }: { player: Player; team: Team }) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="relative rounded-2xl overflow-hidden border border-[var(--border)] aspect-[3/4] flex flex-col"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, ${team.primary} 0%, ${team.secondary} 100%)`,
          opacity: 0.6,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      {player.photoUrl ? (
        <div className="relative flex-1 flex items-end justify-center pt-3">
          <Image
            src={player.photoUrl}
            alt={player.name}
            width={180}
            height={220}
            unoptimized
            className="h-[88%] w-auto object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
          />
        </div>
      ) : (
        <div className="relative flex-1 flex items-center justify-center pt-3">
          <div className="w-14 h-14 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-lg font-bold">
            {player.name.slice(0, 1)}
          </div>
        </div>
      )}
      <div className="relative p-2.5">
        <p className="text-[9px] tracking-widest uppercase text-white/65">
          {player.tagline}
        </p>
        <p className="text-[12px] font-semibold leading-tight">{player.name}</p>
      </div>
    </Link>
  );
}
