"use client";

import Link from "next/link";
import { useSpoilerBlock } from "../lib/preferences";
import { SpoilerWrap } from "./SpoilerWrap";

type TeamMini = { flag: string; name: string };

type Props = {
  matchId: string;
  home: TeamMini;
  away: TeamMini;
  result: {
    home: number;
    away: number;
    /** PK 戦の勝負シュート結果 */
    penalties?: { home: number; away: number };
    /** REGULAR / EXTRA_TIME / PENALTY_SHOOTOUT */
    duration?: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
  };
  involvesFavorite: boolean;
};

/**
 * クライアント側でネタバレ防止モードを見て、勝敗を示すスタイル
 * (太字/グレー/旗の透明度) と スコアの両方を切り替える。
 */
export function CompactResultRowClient({
  matchId,
  home,
  away,
  result,
  involvesFavorite,
}: Props) {
  const { blocked, hydrated } = useSpoilerBlock();

  // ハイドレート前 or ネタバレ防止 ON → ニュートラルスタイル
  const showWinnerStyle = hydrated && !blocked;
  // 勝者判定: PK 戦に入った場合は PK 結果で決定、それ以外はスコア（延長込み）
  const pkHome = result.penalties?.home ?? 0;
  const pkAway = result.penalties?.away ?? 0;
  const homeWin =
    showWinnerStyle &&
    (result.penalties
      ? pkHome > pkAway
      : result.home > result.away);
  const awayWin =
    showWinnerStyle &&
    (result.penalties
      ? pkAway > pkHome
      : result.away > result.home);

  return (
    <Link
      href={`/matches/${matchId}`}
      className={`block py-3 px-2 rounded-xl transition-colors ${
        involvesFavorite
          ? "bg-[var(--accent-2)]/[0.06] hover:bg-[var(--accent-2)]/[0.10]"
          : "hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-[18px] leading-none drop-shadow shrink-0 ${
            awayWin ? "opacity-55" : ""
          }`}
        >
          {home.flag}
        </span>
        <span
          className={`text-[13px] tracking-tight flex-1 truncate ${
            homeWin ? "font-bold" : "font-medium"
          } ${awayWin ? "text-white/55" : "text-white/90"}`}
        >
          {home.name}
        </span>
        <SpoilerWrap size="md">
          <span className="inline-flex items-baseline gap-1 shrink-0">
            <span className="text-[16px] font-bold tabular-nums">
              {result.home}
              <span className="mx-1.5 text-white/40">-</span>
              {result.away}
            </span>
            {result.duration === "EXTRA_TIME" && !result.penalties && (
              <span className="text-[9px] text-white/55 font-semibold tracking-wide">
                AET
              </span>
            )}
            {result.penalties && (
              <span className="text-[10px] text-white/70 font-semibold tracking-wide tabular-nums">
                PK {result.penalties.home}-{result.penalties.away}
              </span>
            )}
          </span>
        </SpoilerWrap>
        <span
          className={`text-[13px] tracking-tight flex-1 truncate text-right ${
            awayWin ? "font-bold" : "font-medium"
          } ${homeWin ? "text-white/55" : "text-white/90"}`}
        >
          {away.name}
        </span>
        <span
          className={`text-[18px] leading-none drop-shadow shrink-0 ${
            homeWin ? "opacity-55" : ""
          }`}
        >
          {away.flag}
        </span>
        {involvesFavorite && <span className="text-[11px] shrink-0">❤️</span>}
      </div>
    </Link>
  );
}
