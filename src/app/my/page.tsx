import Link from "next/link";
import { AppHeader } from "../../components/AppHeader";
import { SectionHeader } from "../../components/SectionHeader";
import { MyFavoritesSection } from "../../components/MyFavoritesSection";
import { MyTeamBlock } from "../../components/MyTeamBlock";
import {
  getAllTeams,
  players,
} from "../../lib/data";
import { getFavoriteTeamsFromCookie } from "../../lib/getFavoritesFromCookie";

export default async function MyPage() {
  const [favoriteIds, allTeams] = await Promise.all([
    getFavoriteTeamsFromCookie(),
    getAllTeams(),
  ]);
  const favTeams = allTeams.filter((t) => favoriteIds.includes(t.id));

  const teamFlags = Object.fromEntries(allTeams.map((t) => [t.id, t.flag]));
  const teamColors = Object.fromEntries(
    allTeams.map((t) => [t.id, [t.primary, t.secondary] as [string, string]]),
  );
  const playerSnapshot = players.map((p) => ({
    id: p.id,
    name: p.name,
    club: p.club,
    photoUrl: p.photoUrl,
    number: p.number,
    tagline: p.tagline,
    teamId: p.teamId,
  }));

  return (
    <>
      <AppHeader
        title="マイ"
        subtitle="あなたのW杯"
        rightSlot={
          <Link
            href="/settings"
            className="w-9 h-9 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-white/85 hover:bg-white/10 transition"
            aria-label="設定"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M19.4 12c0-.3 0-.7-.1-1l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-1.7-1L15 3.5h-4l-.3 2.5a7.5 7.5 0 0 0-1.7 1l-2.3-.9-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9c.5.4 1.1.8 1.7 1l.3 2.5h4l.3-2.5c.6-.2 1.2-.5 1.7-1l2.3.9 2-3.4-2-1.5c.1-.3.1-.7.1-1Z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
          </Link>
        }
      />

      <div className="px-4 pt-3">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--text-dim)]">
          Your Cup
        </p>
        <h1 className="pt-1 text-[24px] font-bold tracking-tight leading-tight text-gradient">
          あなたの推しが集まる場所。
        </h1>
        {favTeams.length === 0 && (
          <p className="text-[12px] text-white/55 mt-2 leading-relaxed">
            推しチームをまだ選んでいないようです。設定から選んでみよう。
          </p>
        )}
      </div>

      {favTeams.length === 0 ? (
        <div className="mx-4 mt-5 glass rounded-2xl p-6 text-center">
          <p className="text-[36px] mb-2">❤️</p>
          <p className="text-[14px] font-semibold mb-3">
            推しチームを選んでみよう
          </p>
          <Link
            href="/settings"
            className="inline-block px-5 py-2 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#ff7a3d] text-[13px] font-semibold"
          >
            設定で選ぶ
          </Link>
        </div>
      ) : (
        <>
          <SectionHeader
            kicker="My Teams"
            title={`推しチーム (${favTeams.length})`}
            action={{ label: "編集", href: "/settings" }}
          />
          {favTeams.map((team) => (
            <MyTeamBlock key={team.id} team={team} />
          ))}
        </>
      )}

      <SectionHeader kicker="My Players" title="推し選手" />
      <MyFavoritesSection
        allPlayers={playerSnapshot}
        teamFlags={teamFlags}
        teamColors={teamColors}
      />

      <div className="px-4 pt-6 pb-4">
        <Link
          href="/settings"
          className="block glass rounded-2xl p-4 text-center"
        >
          <p className="text-[13px] font-semibold">⚙ 設定・通知・推しの編集</p>
          <p className="text-[10.5px] text-white/55 mt-0.5">設定画面へ移動</p>
        </Link>
      </div>

      <div className="h-12" />
    </>
  );
}
