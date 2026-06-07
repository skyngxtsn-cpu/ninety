import Link from "next/link";
import type { Match } from "../lib/types";
import { getTeam } from "../lib/data/teams";
import {
  isLiveMatch,
  liveMinute,
  nowReference,
  formatKickoffJST,
} from "../lib/data/matches";
import { ReminderButton } from "./ReminderButton";
import { CompactMatchCardClient } from "./CompactMatchCardClient";
import { BroadcastIcons } from "./BroadcastChip";
import { SpoilerWrap } from "./SpoilerWrap";
import { CommentBadge } from "./CommentBadge";
import { HotMatchBadge } from "./HotMatchBadge";

type Props = {
  match: Match;
  /** 推しチーム ID 集合（含まれていれば金リング + ❤️） */
  favoriteTeamIds: Set<string>;
};

/**
 * 日付グループの中で並ぶコンパクトな試合カード。
 * - 推しチーム参戦: 金リング + ❤️
 * - リマインド済み: 青リング + 🔔（推しと両立なら金が優先）
 * - LIVE中: 赤 LIVE バッジ + 経過分表示
 */
/** placeholder（"1E", "W74", "3A/B/C/D/F" 等）の表示ラベルを日本語化 */
function placeholderLabel(raw: string | undefined): string {
  if (!raw) return "未定";
  // "1E" → "E組1位"、 "2A" → "A組2位"
  const rank = raw.match(/^([12])([A-L])$/);
  if (rank) return `${rank[2]}組${rank[1]}位`;
  // "3A/B/C/D/F" → "ABCDF組3位"
  const triRank = raw.match(/^3([A-L\/]+)$/);
  if (triRank) {
    const groups = triRank[1].replace(/\//g, "");
    return `${groups}組3位`;
  }
  // "W74" → "#74勝者"、"L101" → "#101敗者"
  const wl = raw.match(/^([WL])(\d+)$/);
  if (wl) return `#${wl[2]}${wl[1] === "W" ? "勝者" : "敗者"}`;
  return raw;
}

export async function CompactMatchCard({ match, favoriteTeamIds }: Props) {
  const [home, away, now] = await Promise.all([
    getTeam(match.homeTeamId),
    getTeam(match.awayTeamId),
    nowReference(),
  ]);
  // placeholder の場合は仮チーム情報で描画
  const homeForRender = home ?? {
    id: match.homeTeamId,
    name: placeholderLabel(match.homeRaw),
    shortName: placeholderLabel(match.homeRaw),
    flag: "·",
  };
  const awayForRender = away ?? {
    id: match.awayTeamId,
    name: placeholderLabel(match.awayRaw),
    shortName: placeholderLabel(match.awayRaw),
    flag: "·",
  };

  const live = isLiveMatch(match, now);
  const minute = live ? liveMinute(match, now) : null;
  const finished = match.status === "finished" && !live;
  const involvesFavorite =
    favoriteTeamIds.has(match.homeTeamId) ||
    favoriteTeamIds.has(match.awayTeamId);
  const timeLabel = formatKickoffJST(match.kickoffJST).split(" ")[1] ?? "";

  // 静的にレンダリングできる中身
  const cardContent = (
    <>
      <div className="flex items-center gap-3">
        {/* 左: 状態バッジ or 時刻 */}
        <div className="shrink-0 w-[60px] flex flex-col items-center gap-0.5">
          {live ? (
            <>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/25 text-rose-200 text-[9.5px] font-bold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 live-dot" />
                LIVE
              </span>
              <span className="text-[10px] font-mono text-rose-200/85 tabular-nums">
                {minute}'
              </span>
            </>
          ) : finished ? (
            <span className="text-[10px] text-white/45 font-medium tracking-wide">
              終了
            </span>
          ) : (
            <span className="text-[13px] font-mono font-semibold text-white/90 tabular-nums">
              {timeLabel}
            </span>
          )}
          <HotMatchBadge matchId={match.id} threshold={10} />
        </div>

        {/* 中央: チーム一覧 */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <TeamLine
            flag={homeForRender.flag}
            name={homeForRender.name}
            score={live || finished ? match.result?.home : undefined}
            isWinner={
              !!(
                finished &&
                match.result &&
                match.result.home > match.result.away
              )
            }
            isLoser={
              !!(
                finished &&
                match.result &&
                match.result.home < match.result.away
              )
            }
          />
          <TeamLine
            flag={awayForRender.flag}
            name={awayForRender.name}
            score={live || finished ? match.result?.away : undefined}
            isWinner={
              !!(
                finished &&
                match.result &&
                match.result.away > match.result.home
              )
            }
            isLoser={
              !!(
                finished &&
                match.result &&
                match.result.away < match.result.home
              )
            }
          />
        </div>

        {/* 右: 推し ❤️ アイコン + ⭐ お気に入りボタン（垂直中央揃え） */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          {involvesFavorite && (
            <span className="w-7 text-center text-[13px] leading-none">
              ❤️
            </span>
          )}
          <ReminderButton matchId={match.id} size="sm" />
        </div>
      </div>

      {/* 下部: 📍会場 / 放送局アイコン / 💬コメント */}
      <div className="mt-2 flex items-center gap-2 text-[10px] text-white/45">
        <span className="truncate shrink min-w-0">📍 {match.venue}</span>
        {match.broadcasts.length > 0 && (
          <div className="shrink-0">
            <BroadcastIcons ids={match.broadcasts} size="xs" />
          </div>
        )}
        <span className="ml-auto shrink-0">
          <CommentBadge matchId={match.id} variant="inline" threshold={0} />
        </span>
      </div>
    </>
  );

  return (
    <CompactMatchCardClient
      matchId={match.id}
      involvesFavorite={involvesFavorite}
    >
      {cardContent}
    </CompactMatchCardClient>
  );
}

function TeamLine({
  flag,
  name,
  score,
  isWinner,
  isLoser,
}: {
  flag: string;
  name: string;
  score?: number;
  isWinner?: boolean;
  isLoser?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${isLoser ? "opacity-55" : ""}`}>
      <span className="text-[18px] leading-none drop-shadow">{flag}</span>
      <span
        className={`text-[13px] tracking-tight ${
          isWinner ? "font-bold" : "font-semibold"
        } truncate flex-1`}
      >
        {name}
      </span>
      {score !== undefined && (
        <SpoilerWrap size="sm">
          <span
            className={`text-[15px] font-bold tabular-nums w-5 text-right ${
              isWinner ? "text-white" : "text-white/85"
            }`}
          >
            {score}
          </span>
        </SpoilerWrap>
      )}
    </div>
  );
}
