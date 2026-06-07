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
export async function CompactMatchCard({ match, favoriteTeamIds }: Props) {
  const [home, away, now] = await Promise.all([
    getTeam(match.homeTeamId),
    getTeam(match.awayTeamId),
    nowReference(),
  ]);
  if (!home || !away) return null;

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
            flag={home.flag}
            name={home.name}
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
            flag={away.flag}
            name={away.name}
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

        {/* 右: 推し ❤️ アイコン + 🔔 ボタン */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          {involvesFavorite && (
            <span className="text-[13px] leading-none">❤️</span>
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
