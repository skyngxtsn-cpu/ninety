import Link from "next/link";
import { AppHeader } from "./AppHeader";
import { BracketSlotRow } from "./BracketSlotRow";
import { SectionHeader } from "./SectionHeader";
import type { Match } from "../lib/types";
import type { BracketMatch } from "../lib/data/bracket";
import { getAllTeams } from "../lib/data/teams";
import { formatKickoffJST } from "../lib/data/matches";

type Props = {
  match: Match;
  bracketMatch?: BracketMatch;
};

/**
 * 対戦カード未確定の knockout 試合用の hero ページ。
 * /matches/2026-06-28-2a-2b 等で 404 にならないようにこれを返す。
 */
export async function TBDMatchHero({ match, bracketMatch }: Props) {
  const teams = await getAllTeams();
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <>
      <AppHeader back="/tournament" title={match.stage} subtitle={match.venue} />

      <section className="relative mx-4 mt-3 rounded-3xl overflow-hidden border border-[var(--border-strong)] min-h-[280px]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #2c3441 0%, #444b58 50%, #7a8395 100%)",
            opacity: 0.5,
          }}
        />
        <div className="absolute inset-0 hero-shade" />
        <div className="relative p-5 pt-6">
          <div className="text-[11px] text-white/75 font-mono">
            {formatKickoffJST(match.kickoffJST)} JST
          </div>

          <div className="mt-6 space-y-3">
            {bracketMatch ? (
              <>
                <BracketSlotRow slot={bracketMatch.home} teams={teamMap} />
                <div className="text-center text-[10px] tracking-[0.25em] text-white/55">
                  VS
                </div>
                <BracketSlotRow slot={bracketMatch.away} teams={teamMap} />
              </>
            ) : (
              <p className="text-[14px] text-white/70">
                対戦相手は試合直前に確定します。
              </p>
            )}
          </div>

          <p className="mt-6 text-[15px] font-semibold leading-snug">
            🔥 対戦カードが確定するとここに詳細が出ます。
          </p>
        </div>
      </section>

      <SectionHeader kicker="What's next" title="どんな試合になる？" />
      <div className="mx-4 glass rounded-2xl p-5 space-y-2">
        <p className="text-[13.5px] text-white/85 leading-relaxed">
          グループステージの順位が確定するか、前段の試合が終わると、対戦カード・注目選手・予想スタメンが自動で表示されます。
        </p>
        <p className="text-[12px] text-white/55 leading-relaxed">
          📍 {match.venue}
        </p>
      </div>

      <SectionHeader kicker="Tournament" title="トーナメント表を見る" />
      <Link
        href="/tournament"
        className="mx-4 block glass-strong rounded-2xl p-4 flex items-center gap-3"
      >
        <span className="text-[24px]">🏆</span>
        <div className="flex-1">
          <p className="text-[13px] font-semibold">勝ち上がり表へ</p>
          <p className="text-[11px] text-white/55">
            この試合の前後を全体図で見る
          </p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>

      <div className="h-12" />
    </>
  );
}
