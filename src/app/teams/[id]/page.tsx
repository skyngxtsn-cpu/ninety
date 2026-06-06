import { notFound } from "next/navigation";
import { AppHeader } from "../../../components/AppHeader";
import { SectionHeader } from "../../../components/SectionHeader";
import { MatchListCard } from "../../../components/MatchListCard";
import { PlayerCard } from "../../../components/PlayerCard";
import { HorizontalScroll } from "../../../components/HorizontalScroll";
import {
  getTeam,
  getTeamSync,
  matchesByTeam,
  playersByTeam,
  getAllGroups,
} from "../../../lib/data";

export default async function TeamPage(props: PageProps<"/teams/[id]">) {
  const { id } = await props.params;
  const team = await getTeam(id);
  if (!team) notFound();

  const [teamMatches, allGroups] = await Promise.all([
    matchesByTeam(team.id),
    getAllGroups(),
  ]);
  const teamPlayers = playersByTeam(team.id);
  const group = allGroups.find((g) => g.name === team.group);

  return (
    <>
      <AppHeader back="/" title={team.name} subtitle={`グループ${team.group}`} />

      <section className="relative mx-4 mt-3 rounded-3xl overflow-hidden border border-[var(--border-strong)] min-h-[200px]">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${team.primary} 0%, ${team.secondary} 100%)`,
            opacity: 0.65,
          }}
        />
        <div className="absolute inset-0 hero-shade" />
        <div className="relative p-5 flex flex-col h-full">
          <div className="flex items-center gap-4">
            <div className="text-[64px] leading-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)]">
              {team.flag}
            </div>
            <div>
              <div className="text-[28px] font-bold tracking-tight leading-tight">
                {team.name}
              </div>
              <div className="text-[12px] text-white/75 mt-0.5">
                {team.shortName} · {team.coach}
              </div>
            </div>
          </div>
          <div className="mt-auto pt-6 flex gap-2">
            <Stat label="FIFAランク" value={`#${team.fifaRank}`} />
            <Stat label="グループ" value={team.group} />
            <Stat label="プレースタイル" value={team.playStyle} wide />
          </div>
        </div>
      </section>

      <SectionHeader kicker="About" title="この国はどんなチーム？" />
      <div className="mx-4 glass rounded-2xl p-5 space-y-2">
        {team.story.map((line, i) => (
          <p key={i} className="text-[14px] leading-relaxed text-white/90">
            <span className="text-[var(--accent-2)] mr-2 font-bold">{i + 1}.</span>
            {line}
          </p>
        ))}
      </div>

      {team.coach && team.coach !== "—" && (
        <>
          <SectionHeader kicker="Coach" title="指揮官" />
          <div className="mx-4 glass-strong rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-[20px] font-bold shrink-0"
                style={{
                  background: `linear-gradient(160deg, ${team.primary} 0%, ${team.secondary} 100%)`,
                }}
              >
                {team.coach.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-white/55">監督</p>
                <p className="text-[15px] font-semibold tracking-tight truncate">
                  {team.coach}
                </p>
                <p className="text-[11px] text-white/65 mt-0.5">{team.playStyle}</p>
              </div>
            </div>
            {team.coachQuote && (
              <blockquote className="mt-4 pt-4 border-t border-white/8">
                <p className="text-[10px] uppercase tracking-widest text-[var(--accent-2)] mb-2">
                  意気込み
                </p>
                <p className="text-[14px] leading-relaxed text-white/90 italic">
                  {team.coachQuote}
                </p>
              </blockquote>
            )}
          </div>
        </>
      )}

      {team.hype && (
        <>
          <SectionHeader kicker="Hype" title="ここを推せ" />
          <div className="mx-4 rounded-2xl p-5 relative overflow-hidden border border-[var(--border-strong)]">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `linear-gradient(135deg, ${team.primary} 0%, ${team.secondary} 100%)`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60" />
            <p className="relative text-[14px] leading-relaxed font-medium">
              🔥 {team.hype}
            </p>
          </div>
        </>
      )}

      {teamPlayers.length > 0 && (
        <>
          <SectionHeader kicker="Spotlight" title="注目選手" />
          <HorizontalScroll>
            {teamPlayers.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </HorizontalScroll>
        </>
      )}

      {teamMatches.length > 0 && (
        <>
          <SectionHeader kicker="Schedule" title="この大会の試合" />
          <div className="mx-4 space-y-2.5">
            {teamMatches.map((m) => (
              <MatchListCard key={m.id} match={m} />
            ))}
          </div>
        </>
      )}

      {group && (
        <>
          <SectionHeader kicker="Group" title={`グループ${group.name}`} />
          <div className="mx-4 glass rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[22px_1fr_28px_28px_28px_36px] gap-2 px-4 py-2 text-[10px] text-white/55 border-b border-white/8">
              <span>#</span>
              <span>チーム</span>
              <span className="text-right">勝</span>
              <span className="text-right">分</span>
              <span className="text-right">負</span>
              <span className="text-right">勝点</span>
            </div>
            {group.rows
              .slice()
              .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga))
              .map((row, i) => {
                const t = getTeamSync(row.teamId);
                if (!t) return null;
                const isMe = t.id === team.id;
                return (
                  <div
                    key={row.teamId}
                    className={`grid grid-cols-[22px_1fr_28px_28px_28px_36px] gap-2 px-4 py-3 text-[12px] items-center ${
                      isMe ? "bg-white/[0.06]" : ""
                    }`}
                  >
                    <span
                      className={`text-[11px] font-bold ${
                        i < 2 ? "text-[var(--accent-2)]" : "text-white/40"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex items-center gap-2">
                      <span>{t.flag}</span>
                      <span className={isMe ? "font-semibold" : ""}>{t.name}</span>
                    </span>
                    <span className="text-right tabular-nums">{row.w}</span>
                    <span className="text-right tabular-nums">{row.d}</span>
                    <span className="text-right tabular-nums">{row.l}</span>
                    <span className="text-right tabular-nums font-bold">
                      {row.pts}
                    </span>
                  </div>
                );
              })}
          </div>
        </>
      )}

      <div className="h-12" />
    </>
  );
}

function Stat({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div
      className={`rounded-xl bg-black/40 backdrop-blur-md border border-white/10 px-3 py-2 ${
        wide ? "flex-1 min-w-0" : ""
      }`}
    >
      <div className="text-[9px] tracking-widest uppercase text-white/55">
        {label}
      </div>
      <div className="text-[13px] font-semibold mt-0.5 truncate">{value}</div>
    </div>
  );
}
