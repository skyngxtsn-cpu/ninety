import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AppHeader } from "../../../components/AppHeader";
import { FavoriteButton } from "../../../components/FavoriteButton";
import { SectionHeader } from "../../../components/SectionHeader";
import { MatchListCard } from "../../../components/MatchListCard";
import {
  getPlayer,
  getTeam,
  matchesByTeam,
  playersByTeam,
} from "../../../lib/data";
import { PlayerCard } from "../../../components/PlayerCard";
import { HorizontalScroll } from "../../../components/HorizontalScroll";
import { StrengthBars } from "../../../components/StrengthBars";

export default async function PlayerPage(props: PageProps<"/players/[id]">) {
  const { id } = await props.params;
  const player = getPlayer(id);
  if (!player) notFound();

  const team = await getTeam(player.teamId);
  if (!team) notFound();
  const teamMatches = (await matchesByTeam(team.id)).slice(0, 3);
  const teammates = playersByTeam(team.id).filter((p) => p.id !== player.id);

  return (
    <>
      <AppHeader
        back="/"
        title={player.name}
        subtitle={`${team.flag} ${team.name}`}
        rightSlot={<FavoriteButton playerId={player.id} size="md" />}
      />

      <section className="relative mx-4 mt-3 rounded-3xl overflow-hidden border border-[var(--border-strong)] min-h-[300px]">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, ${team.primary} 0%, ${team.secondary} 100%)`,
            opacity: 0.7,
          }}
        />
        <div className="absolute inset-0 hero-shade" />

        <div className="relative flex flex-col items-center p-6 pb-7">
          {player.photoUrl ? (
            <div className="w-40 h-40 relative flex items-end justify-center">
              <Image
                src={player.photoUrl}
                alt={player.name}
                width={300}
                height={360}
                priority
                className="h-full w-auto object-contain drop-shadow-[0_14px_30px_rgba(0,0,0,0.6)]"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-28 h-28 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-5xl font-bold shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)]">
              {player.name.slice(0, 1)}
            </div>
          )}

          <Link
            href={`/teams/${team.id}`}
            className="mt-4 flex items-center gap-2 text-[12px] text-white/85"
          >
            <span className="text-base">{team.flag}</span>
            {team.name}
          </Link>

          <h1 className="mt-1 text-[26px] font-bold tracking-tight">
            {player.name}
          </h1>
          {player.nameRomaji && (
            <p className="text-[11px] text-white/55 mt-0.5 font-mono">
              {player.nameRomaji}
            </p>
          )}

          <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-[var(--accent-2)] font-medium">
            {player.tagline}
          </p>

          <div className="mt-5 grid grid-cols-4 gap-2 w-full">
            <Stat label="背番号" value={`#${player.number}`} />
            <Stat label="ポジション" value={player.position} />
            <Stat label="年齢" value={`${player.age}`} />
            <Stat label="所属" value={player.club} small />
          </div>
        </div>
      </section>

      <SectionHeader kicker="Who" title="この選手は何者？" />
      <div className="mx-4 glass rounded-2xl p-5 space-y-2">
        {player.story.map((line, i) => (
          <p key={i} className="text-[14px] leading-relaxed text-white/90">
            <span className="text-[var(--accent-2)] mr-2 font-bold">{i + 1}.</span>
            {line}
          </p>
        ))}
      </div>

      {/* なぜ見る？（初心者向けひとこと） */}
      {player.whyWatch && (
        <>
          <SectionHeader kicker="Why Watch" title="ここを見て" />
          <div className="mx-4 relative rounded-2xl overflow-hidden border border-[var(--accent-2)]/30">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `linear-gradient(135deg, ${team.primary} 0%, ${team.secondary} 100%)`,
              }}
            />
            <div className="relative p-5">
              <p className="text-[14px] leading-relaxed font-medium text-white">
                💡 {player.whyWatch}
              </p>
            </div>
          </div>
        </>
      )}

      {/* パーソナル情報 */}
      {(player.birthPlace ||
        player.birthDate ||
        player.heightCm ||
        player.preferredFoot ||
        player.caps !== undefined ||
        player.internationalGoals !== undefined) && (
        <>
          <SectionHeader kicker="Personal" title="パーソナル" />
          <div className="mx-4 glass rounded-2xl overflow-hidden">
            {player.birthPlace && (
              <BioRow label="出身" value={player.birthPlace} />
            )}
            {player.birthDate && (
              <BioRow label="生年月日" value={formatBirthDate(player.birthDate)} />
            )}
            {player.heightCm && (
              <BioRow label="身長" value={`${player.heightCm} cm`} />
            )}
            {player.preferredFoot && (
              <BioRow label="利き足" value={footLabel(player.preferredFoot)} />
            )}
            {player.caps !== undefined && (
              <BioRow
                label="代表 キャップ / ゴール"
                value={`${player.caps} 試合 / ${player.internationalGoals ?? 0} G`}
              />
            )}
          </div>
        </>
      )}

      {/* 強み */}
      {player.strengths && player.strengths.length > 0 && (
        <>
          <SectionHeader kicker="Strengths" title="強み" />
          <div className="mx-4 glass rounded-2xl p-5">
            <StrengthBars items={player.strengths} accent={team.primary} />
          </div>
        </>
      )}

      {/* 名場面 */}
      {player.signatureMoment && (
        <>
          <SectionHeader kicker="Signature" title="名場面" />
          <div className="mx-4 relative rounded-2xl overflow-hidden border border-[var(--border-strong)]">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `linear-gradient(135deg, ${team.primary} 0%, ${team.secondary} 100%)`,
              }}
            />
            <div className="absolute inset-0 hero-shade" />
            <div className="relative p-5">
              <p className="text-[10px] tracking-widest uppercase text-[var(--accent-2)] mb-2">
                ⭐ {player.signatureMoment.title}
              </p>
              <p className="text-[14px] leading-relaxed text-white/95">
                {player.signatureMoment.body}
              </p>
            </div>
          </div>
        </>
      )}

      {/* キャリア */}
      {player.careerPath && player.careerPath.length > 0 && (
        <>
          <SectionHeader kicker="Career" title="キャリア" />
          <div className="mx-4 glass rounded-2xl p-5">
            <ol className="space-y-3 relative">
              <div
                className="absolute top-1.5 bottom-1.5 left-[5px] w-px bg-white/15"
                aria-hidden
              />
              {player.careerPath.map((c, i) => (
                <li key={i} className="relative pl-5">
                  <span
                    className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white/40"
                    style={{ background: team.primary }}
                  />
                  <p className="text-[10.5px] tracking-widest uppercase text-white/55">
                    {c.period}
                  </p>
                  <p className="text-[13.5px] font-semibold tracking-tight mt-0.5">
                    {c.club}
                  </p>
                  {c.note && (
                    <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">
                      {c.note}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      {teamMatches.length > 0 && (
        <>
          <SectionHeader kicker="Schedule" title="この大会で見られる試合" />
          <div className="mx-4 space-y-2.5">
            {teamMatches.map((m) => (
              <MatchListCard key={m.id} match={m} />
            ))}
          </div>
        </>
      )}

      {teammates.length > 0 && (
        <>
          <SectionHeader kicker="Teammates" title={`${team.name}の他の注目選手`} />
          <HorizontalScroll>
            {teammates.map((p) => (
              <PlayerCard key={p.id} player={p} size="sm" />
            ))}
          </HorizontalScroll>
        </>
      )}

      <div className="h-12" />
    </>
  );
}

function BioRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 last:border-b-0">
      <span className="text-[11.5px] text-white/55 tracking-wide">{label}</span>
      <span className="text-[13.5px] font-semibold tracking-tight">{value}</span>
    </div>
  );
}

function footLabel(f: "L" | "R" | "B"): string {
  return f === "L" ? "左足" : f === "R" ? "右足" : "両足";
}

function formatBirthDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const now = new Date("2026-06-11"); // W杯開幕日
  let age = now.getFullYear() - y;
  if (
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  ) {
    age--;
  }
  return `${y}年${m}月${day}日（${age}歳）`;
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl bg-black/40 backdrop-blur-md border border-white/10 px-2.5 py-2 text-center">
      <div className="text-[9px] tracking-widest uppercase text-white/55">
        {label}
      </div>
      <div className={`${small ? "text-[11px]" : "text-[14px]"} font-semibold mt-0.5 truncate`}>
        {value}
      </div>
    </div>
  );
}
