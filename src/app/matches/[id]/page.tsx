import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AppHeader } from "../../../components/AppHeader";
import { SectionHeader } from "../../../components/SectionHeader";
import {
  getMatch,
  getTeam,
  getTeamSync,
  getPlayer,
  formatKickoffJST,
  relativeKickoff,
  nowReference,
  getPredictedLineup,
  getMatchOverride,
  getBracketMatchById,
} from "../../../lib/data";
import { Pitch } from "../../../components/Pitch";
import { TBDMatchHero } from "../../../components/TBDMatchHero";
import { ReminderButton } from "../../../components/ReminderButton";
import { BroadcastChipList } from "../../../components/BroadcastChip";
import { CHANNELS, type BroadcastChannelId } from "../../../lib/data/broadcasts";

export default async function MatchPage(props: PageProps<"/matches/[id]">) {
  const { id } = await props.params;
  const match = await getMatch(id);
  if (!match) notFound();

  const [home, away, now] = await Promise.all([
    getTeam(match.homeTeamId),
    getTeam(match.awayTeamId),
    nowReference(),
  ]);

  // 対戦カードが未確定（slot が placeholder の knockout 試合）の場合は TBD ヒーロー
  if (!home || !away) {
    const bm = await getBracketMatchById(id);
    return <TBDMatchHero match={match} bracketMatch={bm} />;
  }
  const finished = match.status === "finished";
  const motm = match.result ? getPlayer(match.result.manOfTheMatchId) : null;

  return (
    <>
      <AppHeader
        back="/"
        title={match.stage}
        subtitle={match.venue}
        rightSlot={<ReminderButton matchId={match.id} size="md" />}
      />

      {/* Hero */}
      <section className="relative mx-4 mt-3 rounded-3xl overflow-hidden border border-[var(--border-strong)]">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${home.primary} 0%, ${home.secondary} 45%, ${away.primary} 55%, ${away.secondary} 100%)`,
            opacity: 0.5,
          }}
        />
        <div className="absolute inset-0 hero-shade" />
        <div className="relative p-5 pb-6">
          <div className="text-[11px] text-white/75 font-mono">
            {formatKickoffJST(match.kickoffJST)} JST
          </div>

          <div className="flex items-center justify-between mt-5">
            <TeamBlock teamId={match.homeTeamId} flag={home.flag} name={home.name} />
            <div className="text-center px-2 shrink-0 min-w-[80px]">
              {finished && match.result ? (
                <div>
                  <div className="text-[12px] text-white/70 mb-1">終了</div>
                  <div className="text-[40px] font-bold tabular-nums leading-none">
                    {match.result.home}
                    <span className="mx-2 text-white/40">-</span>
                    {match.result.away}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-[10px] tracking-[0.25em] text-white/65 mb-1">VS</div>
                  <div className="text-[20px] font-bold leading-none whitespace-nowrap">
                    {relativeKickoff(match.kickoffJST, now)}
                  </div>
                </>
              )}
            </div>
            <TeamBlock teamId={match.awayTeamId} flag={away.flag} name={away.name} reverse />
          </div>

          {!finished && match.broadcasts.length > 0 && (
            <div className="mt-6">
              <BroadcastChipList ids={match.broadcasts.slice(0, 4)} size="md" />
            </div>
          )}

          <p className="mt-5 text-[16px] font-semibold leading-snug">🔥 {match.hook}</p>
        </div>
      </section>

      {/* 試合後体験（最優先） */}
      {finished && match.result && (
        <section className="mx-4 mt-5 space-y-3">
          <div className="glass rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-2)] mb-2">
              🔥 なぜ話題？
            </div>
            <p className="text-[15px] leading-relaxed font-medium">
              {match.result.whyTrending}
            </p>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2">
              📝 30秒で要約
            </div>
            <p className="text-[14px] leading-relaxed text-white/90">
              {match.result.summary30s}
            </p>
          </div>

          {motm && (
            <Link
              href={`/players/${motm.id}`}
              className="block glass-strong rounded-2xl p-5"
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-2)] mb-2">
                ⭐ 今日の主役
              </div>
              <div className="flex items-center gap-4">
                {motm.photoUrl ? (
                  <Image
                    src={motm.photoUrl}
                    alt={motm.name}
                    width={120}
                    height={120}
                    unoptimized
                    className="w-16 h-16 rounded-2xl object-cover bg-white/10 border border-white/15"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold">
                    {motm.name.slice(0, 1)}
                  </div>
                )}
                <div>
                  <p className="text-[15px] font-semibold">{motm.name}</p>
                  <p className="text-[11px] text-white/70">
                    {getTeamSync(motm.teamId)?.flag} {motm.club} · {motm.position}
                  </p>
                </div>
              </div>
            </Link>
          )}

          <div className="glass rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2">
              🏆 結果どうなった？
            </div>
            <p className="text-[14px] leading-relaxed">{match.result.nextImplication}</p>
          </div>

          {match.result.highlightUrl && (
            <a
              href={match.result.highlightUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl p-5 text-center font-semibold bg-gradient-to-br from-[#ff3b30] to-[#ff6b3d] glow-ring"
            >
              🎥 ダイジェスト動画を観る
            </a>
          )}
        </section>
      )}

      {/* この試合の意味 */}
      <SectionHeader kicker="Meaning" title="この試合の意味" />
      <div className="mx-4 grid grid-cols-3 gap-2">
        <MeaningCell label={`${home.shortName} 勝利`} text={match.meaning.homeWin} tone="win" />
        <MeaningCell label="引き分け" text={match.meaning.draw} tone="draw" />
        <MeaningCell label={`${away.shortName} 勝利`} text={match.meaning.awayWin} tone="lose" />
      </div>

      {/* どこで観れる？ */}
      {match.broadcasts.length > 0 && (
        <>
          <SectionHeader kicker="Watch" title="どこで観れる？" />
          <div className="mx-4 glass rounded-2xl p-4 space-y-2.5">
            {match.broadcasts.map((b) => {
              const channel = CHANNELS[b as BroadcastChannelId];
              if (!channel) {
                return (
                  <div
                    key={b}
                    className="flex items-center gap-3 py-1.5"
                  >
                    <span className="text-[14px]">📺 {b}</span>
                  </div>
                );
              }
              return (
                <a
                  key={b}
                  href={channel.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl hover:bg-white/5 transition group"
                >
                  <span
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[15px] font-bold"
                    style={{
                      backgroundColor: channel.brand,
                      color: channel.text === "black" ? "#000" : "#fff",
                    }}
                  >
                    {channel.glyph}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold tracking-tight">
                      {channel.name}
                    </p>
                    <p className="text-[10.5px] text-white/55 mt-0.5">
                      {labelType(channel.type)} · {labelTier(channel.tier)}
                    </p>
                  </div>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white/40 group-hover:text-white/80 transition shrink-0"
                  >
                    <path
                      d="M14 5h5v5M19 5l-11 11M9 5H5v14h14v-4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              );
            })}
            <p className="text-[10px] text-white/45 pt-2 leading-relaxed">
              ※ 放送スケジュールは推定を含みます。正式な放送局・配信開始時刻は各社の番組表をご確認ください。
            </p>
          </div>
        </>
      )}

      {/* 注目ポイント */}
      <SectionHeader kicker="Storylines" title="注目ポイント" />
      <div className="mx-4 space-y-2">
        {match.storylines.map((s, i) => (
          <div
            key={i}
            className="glass rounded-2xl px-4 py-3 flex items-start gap-3"
          >
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#ffb020] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            <p className="text-[14px] leading-snug">{s}</p>
          </div>
        ))}
      </div>

      {/* 注目選手 */}
      <SectionHeader kicker="Spotlight" title="注目選手" />
      <div className="mx-4 grid grid-cols-3 gap-2.5">
        {match.keyPlayerIds
          .map((id, i) => ({ player: getPlayer(id), key: `${id}-${i}` }))
          .filter((x) => !!x.player)
          .map(({ player, key }) => (
            <KeyPlayer key={key} player={player!} />
          ))}
      </div>

      {/* スタメン (試合フェーズで自動切替) */}
      {(() => {
        const override = getMatchOverride(match.id);
        const homePredicted = getPredictedLineup(match.homeTeamId);
        const awayPredicted = getPredictedLineup(match.awayTeamId);
        const homeLineup = override?.home ?? homePredicted;
        const awayLineup = override?.away ?? awayPredicted;
        if (!homeLineup && !awayLineup) return null;

        // フェーズ判定: 試合開始の 60 分前から「間もなく発表/スタメン」、
        // キックオフ後は「LIVE」、110 分以降は「finished」
        const kickMs = new Date(match.kickoffJST).getTime();
        const diff = kickMs - now.getTime();
        const variant: "predicted" | "announced" | "live" | "finished" =
          match.status === "finished" || diff < -110 * 60 * 1000
            ? "finished"
            : diff < 0
              ? "live"
              : diff < 60 * 60 * 1000
                ? "announced"
                : "predicted";

        const sectionTitle =
          variant === "finished"
            ? "スタメン"
            : variant === "live"
              ? "今のピッチ"
              : variant === "announced"
                ? "スタメン発表"
                : "想定スタメン";

        return (
          <>
            <SectionHeader kicker="Lineup" title={sectionTitle} />
            <div className="mx-4 space-y-4">
              {homeLineup && (
                <Pitch
                  lineup={homeLineup}
                  primary={home.primary}
                  secondary={home.secondary}
                  flag={home.flag}
                  teamName={home.name}
                  teamId={home.id}
                  variant={variant}
                  isConfirmed={!!override?.home}
                />
              )}
              {awayLineup && (
                <Pitch
                  lineup={awayLineup}
                  primary={away.primary}
                  secondary={away.secondary}
                  flag={away.flag}
                  teamName={away.name}
                  teamId={away.id}
                  variant={variant}
                  isConfirmed={!!override?.away}
                />
              )}
            </div>
          </>
        );
      })()}

      <div className="h-12" />
    </>
  );
}

function TeamBlock({
  teamId,
  flag,
  name,
  reverse,
}: {
  teamId: string;
  flag: string;
  name: string;
  reverse?: boolean;
}) {
  return (
    <Link
      href={`/teams/${teamId}`}
      className="flex flex-col items-center gap-2 shrink-0 min-w-[80px]"
    >
      <div className="text-[44px] leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        {flag}
      </div>
      <div className="text-[13px] font-semibold tracking-tight">{name}</div>
    </Link>
  );
}

function labelType(t: string): string {
  if (t === "terrestrial") return "地上波";
  if (t === "bs") return "BS";
  if (t === "streaming") return "配信";
  return t;
}
function labelTier(t: string): string {
  if (t === "free") return "無料";
  if (t === "subscription") return "サブスク";
  if (t === "with-account") return "要アカウント";
  return t;
}

function MeaningCell({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: "win" | "draw" | "lose";
}) {
  const accent =
    tone === "win"
      ? "from-emerald-400/20 to-emerald-500/5 border-emerald-400/25"
      : tone === "draw"
        ? "from-amber-300/15 to-amber-500/5 border-amber-300/20"
        : "from-rose-400/20 to-rose-500/5 border-rose-400/25";
  const dotColor =
    tone === "win" ? "bg-emerald-400" : tone === "draw" ? "bg-amber-300" : "bg-rose-400";
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-b ${accent} p-3 min-h-[124px] flex flex-col`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-white/80">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {label}
      </div>
      <p className="mt-2 text-[12px] leading-snug text-white/90">{text}</p>
    </div>
  );
}

function KeyPlayer({
  player,
}: {
  player: NonNullable<ReturnType<typeof getPlayer>>;
}) {
  const team = getTeamSync(player.teamId);
  if (!team) return null;
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
        <div className="relative flex-1 flex items-end justify-center pt-4">
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
        <div className="relative flex-1 flex items-center justify-center pt-4">
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

function LineupBlock({
  flag,
  name,
  formation,
  starters,
}: {
  flag: string;
  name: string;
  formation: string;
  starters: string[];
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{flag}</span>
          <span className="text-[13px] font-semibold">{name}</span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/10">
          {formation}
        </span>
      </div>
      <ul className="space-y-1">
        {starters.map((id) => {
          const p = getPlayer(id);
          if (!p) return null;
          return (
            <li key={id}>
              <Link
                href={`/players/${id}`}
                className="flex items-center gap-2 text-[12px] text-white/85 hover:text-white py-0.5"
              >
                <span className="w-5 text-right text-[10px] font-mono text-white/60">
                  {p.number}
                </span>
                <span className="font-medium">{p.name}</span>
                <span className="text-white/40 text-[10px] ml-auto">{p.position}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[10px] text-white/40">※ 主要メンバーを抜粋</p>
    </div>
  );
}
