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

/** 日付（kickoffJST ISO）を「6/29 (火) 4:00 JST」形式に */
function dateTimeJST(iso: string): string {
  const d = new Date(iso);
  const utcMs = d.getTime();
  const jst = new Date(utcMs + 9 * 60 * 60 * 1000);
  const dow = ["日", "月", "火", "水", "木", "金", "土"][jst.getUTCDay()];
  const mo = jst.getUTCMonth() + 1;
  const da = jst.getUTCDate();
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mm = String(jst.getUTCMinutes()).padStart(2, "0");
  return `${mo}/${da} (${dow}) ${hh}:${mm} JST`;
}

/** 放送局 ID を表示用短文字に */
function channelLabel(id: string): string {
  return (
    {
      NHK_G: "NHK総合",
      NHK_BS: "NHK BS",
      TBS: "TBS",
      TEREASA: "テレ朝",
      FUJI: "フジ",
      NTV: "日テレ",
      ABEMA: "ABEMA",
      DAZN: "DAZN",
      "U-NEXT": "U-NEXT",
      NHK_PLUS: "NHK+",
      TVER: "TVer",
    }[id] ?? id
  );
}

/**
 * トーナメント通知。ネタバレ防止モードに応じて文言を変える。
 * - block: 相手を出さず「次の相手が決まりました」のみ
 * - block無し: 推しの旗 + 相手 + 日時 + 会場 + 放送局
 */
export function buildTournamentPayload(opts: {
  bracketMatchId: string;
  favTeam: Team | undefined;
  opponent: Team | undefined;
  stage: string;
  kickoffJST: string;
  venue?: string;
  broadcasts?: string[];
  spoilerBlock: boolean;
}): NotificationPayload {
  const fav = opts.favTeam;
  const opp = opts.opponent;
  const favFlag = fav?.flag ?? "";
  const favName = fav?.shortName ?? "推しチーム";
  const oppFlag = opp?.flag ?? "";
  const oppName = opp?.shortName ?? "相手";
  const when = dateTimeJST(opts.kickoffJST);
  const tag = `tournament-${opts.bracketMatchId}-${fav?.id ?? "x"}`;
  const url = `/matches/${opts.bracketMatchId}`;

  if (opts.spoilerBlock) {
    return {
      title: "🏆 推しの次の相手が決まりました",
      body: `${when} キックオフ`,
      url,
      matchId: opts.bracketMatchId,
      tag,
      type: "tournament",
    };
  }

  // タイトル: 「🏆 🇯🇵 日本 × 🇧🇷 ブラジル｜準々決勝」
  const title = `🏆 ${favFlag} ${favName} × ${oppFlag} ${oppName}｜${opts.stage}`;
  const bodyLines: string[] = [];
  // 1行目: 日時 + 会場
  bodyLines.push(opts.venue ? `${when} · ${opts.venue}` : when);
  // 2行目: 放送局
  if (opts.broadcasts && opts.broadcasts.length > 0) {
    const labels = opts.broadcasts.slice(0, 3).map(channelLabel).join(" / ");
    bodyLines.push(`📺 ${labels}`);
  }
  return {
    title,
    body: bodyLines.join("\n"),
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

/**
 * 1日の終わりダイジェスト。
 * 「📜 今日の振り返り」セクション + 「🔜 明日のプレビュー」セクションを
 * 1 通にまとめる。
 *
 * spoilerBlock の挙動:
 *  - ON: 振り返りはスコア無し（「終了」表示のみ）
 *  - OFF: 振り返りはスコア付き
 */
export function buildDigestPayload(opts: {
  todayRecap: Array<{ match: Match; home?: Team; away?: Team }>;
  tomorrowPreview: Array<{ match: Match; home?: Team; away?: Team }>;
  forTomorrowJSTDate: string;
  spoilerBlock: boolean;
}): NotificationPayload {
  const { todayRecap, tomorrowPreview, forTomorrowJSTDate, spoilerBlock } =
    opts;

  const flag = (t: Team | undefined): string => t?.flag ?? "";
  const sn = (t: Team | undefined, fallback: string): string =>
    shortName(t, fallback);

  const recapLines = todayRecap.slice(0, 5).map(({ match, home, away }) => {
    const hn = sn(home, match.homeTeamId);
    const an = sn(away, match.awayTeamId);
    if (spoilerBlock || !match.result) {
      return `${flag(home)}${hn} vs ${an}${flag(away)} 終了`;
    }
    return `${flag(home)}${hn} ${match.result.home}-${match.result.away} ${an}${flag(away)}`;
  });
  const recapExtra =
    todayRecap.length > 5 ? `\n…他 ${todayRecap.length - 5}試合` : "";

  const previewLines = tomorrowPreview.slice(0, 5).map(({ match, home, away }) => {
    const hn = sn(home, match.homeTeamId);
    const an = sn(away, match.awayTeamId);
    return `${timeJST(match.kickoffJST)} ${flag(home)}${hn} × ${an}${flag(away)}`;
  });
  const previewExtra =
    tomorrowPreview.length > 5
      ? `\n…他 ${tomorrowPreview.length - 5}試合`
      : "";

  const sections: string[] = [];
  if (recapLines.length > 0) {
    sections.push(`📜 今日の振り返り\n${recapLines.join("\n")}${recapExtra}`);
  }
  if (previewLines.length > 0) {
    sections.push(`🔜 明日の試合\n${previewLines.join("\n")}${previewExtra}`);
  }

  const dayLabel = forTomorrowJSTDate.slice(5).replace("-", "/");
  const recapCount = todayRecap.length;
  const previewCount = tomorrowPreview.length;
  let title = "🌙 1日のまとめ";
  if (recapCount > 0 && previewCount > 0) {
    title = `🌙 今日${recapCount}試合 / 明日 ${dayLabel} ${previewCount}試合`;
  } else if (recapCount > 0) {
    title = `🌙 今日の振り返り（${recapCount}試合）`;
  } else if (previewCount > 0) {
    title = `🌙 明日 ${dayLabel} ${previewCount}試合`;
  }

  return {
    title,
    body: sections.join("\n\n"),
    url: "/",
    matchId: "digest",
    tag: `digest-${forTomorrowJSTDate}`,
    type: "digest",
  };
}
