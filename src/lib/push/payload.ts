import type { Match, Team } from "../types";
import type { NotificationType } from "./notification-types";

export type NotificationPayload = {
  title: string;
  body: string;
  url: string;
  matchId: string;
  tag: string;
  type: NotificationType;
};

function shortName(team: Team | undefined, fallback: string): string {
  return team?.shortName ?? team?.name ?? fallback.toUpperCase();
}

function timeJST(iso: string): string {
  const d = new Date(iso);
  const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes();
  const jstMin = (utcMin + 9 * 60) % (24 * 60);
  const hh = String(Math.floor(jstMin / 60)).padStart(2, "0");
  const mm = String(jstMin % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function buildPayload(
  type: NotificationType,
  match: Match,
  home: Team | undefined,
  away: Team | undefined,
): NotificationPayload {
  const hn = shortName(home, match.homeTeamId);
  const an = shortName(away, match.awayTeamId);
  const flag = (t: Team | undefined): string => t?.flag ?? "";
  const matchup = `${flag(home)} ${hn} × ${an} ${flag(away)}`.trim();
  const hh = timeJST(match.kickoffJST);
  const url = `/matches/${match.id}`;
  const hook = match.hook ? `— ${match.hook}` : "";

  let title = "";
  let body = "";

  switch (type) {
    case "pre-3h":
      title = `あと3時間：${matchup}`;
      body = `${hh} JST キックオフ ${hook}`.trim();
      break;
    case "pre-1h":
      title = `あと1時間：${matchup}`;
      body = `${hh} JST キックオフ。準備はじめよう ${hook}`.trim();
      break;
    case "pre-15m":
      title = `まもなく：${matchup}`;
      body = `${hh} JST キックオフ ${hook}`.trim();
      break;
    case "kickoff":
      title = `🟢 始まりました：${matchup}`;
      body = "ライブ開始、いまから見ても間に合う";
      break;
    case "halftime":
      title = `⏸ ハーフタイム：${matchup}`;
      body = "後半45分、いまから参戦してもまだまだ間に合う";
      break;
    case "fulltime":
      title = `🏁 終了：${matchup}`;
      body = "試合終了。録画派の方は記事や順位表にご注意";
      break;
    case "result":
      // result は呼び出し側で score 入りタイトルを上書きする
      title = `📊 結果：${matchup}`;
      body = "試合終了、スコアはアプリで確認";
      break;
    case "tournament":
      title = "🏆 推しの次の相手が決まりました";
      body = "決勝トーナメントの次戦カードが確定";
      break;
    case "digest":
      // digest はサマリで複数試合なので呼び出し側で組み立て
      title = "🌙 1日お疲れさま。明日の試合";
      body = matchup;
      break;
  }

  return {
    title,
    body,
    url,
    matchId: match.id,
    tag: `${type}-${match.id}`,
    type,
  };
}

/**
 * トーナメント通知。ネタバレ防止モードに応じて文言を変える。
 * - block: チーム名を出さず「次の相手が決まりました」のみ
 * - block無し: 「日本の次は 🇧🇷 ブラジル」のように具体的に
 */
export function buildTournamentPayload(opts: {
  bracketMatchId: string;
  favTeam: Team | undefined;
  opponent: Team | undefined;
  stage: string;
  kickoffJST: string;
  spoilerBlock: boolean;
}): NotificationPayload {
  const fav = opts.favTeam;
  const opp = opts.opponent;
  const favName = fav?.shortName ?? "推しチーム";
  const oppName = opp?.shortName ?? "相手";
  const oppFlag = opp?.flag ?? "";
  const hh = timeJST(opts.kickoffJST);
  const tag = `tournament-${opts.bracketMatchId}-${fav?.id ?? "x"}`;
  const url = `/matches/${opts.bracketMatchId}`;
  if (opts.spoilerBlock) {
    return {
      title: "🏆 推しの次の相手が決まりました",
      body: `${favName} の次戦カードが確定`,
      url,
      matchId: opts.bracketMatchId,
      tag,
      type: "tournament",
    };
  }
  return {
    title: `🏆 ${favName} の次の相手 ${oppFlag} ${oppName}`,
    body: `${opts.stage}・${hh} JST キックオフ`,
    url,
    matchId: opts.bracketMatchId,
    tag,
    type: "tournament",
  };
}

export function buildResultPayload(
  match: Match,
  home: Team | undefined,
  away: Team | undefined,
): NotificationPayload {
  const hn = shortName(home, match.homeTeamId);
  const an = shortName(away, match.awayTeamId);
  const flag = (t: Team | undefined): string => t?.flag ?? "";
  const sh = match.result?.home ?? 0;
  const sa = match.result?.away ?? 0;
  const title = `📊 ${flag(home)} ${hn} ${sh} - ${sa} ${an} ${flag(away)}`.trim();
  const body =
    sh === sa
      ? "引き分け"
      : sh > sa
        ? `${hn}勝利`
        : `${an}勝利`;
  return {
    title,
    body,
    url: `/matches/${match.id}`,
    matchId: match.id,
    tag: `result-${match.id}`,
    type: "result",
  };
}

export function buildDigestPayload(
  matches: Array<{ match: Match; home?: Team; away?: Team }>,
  forJSTDate: string,
): NotificationPayload {
  const lines = matches.slice(0, 5).map(({ match, home, away }) => {
    const flag = (t: Team | undefined): string => t?.flag ?? "";
    const hn = shortName(home, match.homeTeamId);
    const an = shortName(away, match.awayTeamId);
    return `${timeJST(match.kickoffJST)} ${flag(home)}${hn} × ${an}${flag(away)}`;
  });
  const extra = matches.length > 5 ? `\n…他 ${matches.length - 5}試合` : "";
  const dayLabel = forJSTDate.slice(5).replace("-", "/"); // "06-13" → "06/13"
  return {
    title: `🌙 明日 ${dayLabel} 推しチーム ${matches.length}試合`,
    body: lines.join("\n") + extra,
    url: "/",
    matchId: "digest",
    tag: `digest-${forJSTDate}`,
    type: "digest",
  };
}
