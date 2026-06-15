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
  // 「見どころ」は match.hook（match-augment.ts の手書きフック）
  const hookLine = match.hook ? `\n👁 ${match.hook}` : "";

  let title = "";
  let body = "";

  switch (type) {
    case "pre-3h":
      title = `⏳ あと3時間 — ${matchup}`;
      body = `${hh} JST にキックオフ。心の準備、はじめよう。${hookLine}`;
      break;
    case "pre-1h":
      title = `🔔 1時間後にKO — ${matchup}`;
      body = `${hh} JST 開戦。テレビ・配信スタンバイ。${hookLine}`;
      break;
    case "pre-15m":
      title = `⚡ まもなく — ${matchup}`;
      body = `あと15分で ${hh} JST キックオフ。さあ、始まる。${hookLine}`;
      break;
    case "kickoff":
      title = `🔴 LIVE 開幕！ ${matchup}`;
      body = `90分の物語が、いま動き出した。\nいまから滑り込みでも間に合う。`;
      break;
    case "halftime":
      title = `⏸ ハーフタイム — ${matchup}`;
      body = `前半終了。ここまでの45分、どうだった？\n後半が本番。途中参戦も大歓迎。`;
      break;
    case "halftime-end":
      title = `▶️ 後半開始 — ${matchup}`;
      body = `ハーフタイム終了。45分の後半戦が始まる。\nこの45分で全てが決まる。`;
      break;
    case "fulltime":
      title = `🏁 試合終了 — ${matchup}`;
      body = `90分が終わりました。\n録画派の方は記事・SNS・順位表にご注意。`;
      break;
    case "result":
      // result は呼び出し側で score 入りタイトルを上書きする
      title = `📊 結果 — ${matchup}`;
      body = `試合終了。スコアと流れはアプリで。`;
      break;
    case "lineup":
      title = `📋 スタメン発表 — ${matchup}`;
      body = `先発11人がアプリで見られます。\n${hh} JST キックオフまで読み込み。${hookLine}`;
      break;
    case "tournament":
      title = `🏆 推しの次戦カード確定`;
      body = `決勝トーナメントの対戦相手が決まりました。`;
      break;
    case "digest":
      title = `🌙 今日もお疲れさま`;
      body = `明日の試合をチェックしよう。\n${matchup}`;
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

/**
 * ハーフタイムの「途中スコア付き」通知。
 * ネタバレ防止モード OFF の人だけ受け取る用。
 */
/**
 * ⚽ 得点通知 payload。
 * 「⚽ ゴール！🇯🇵 日本 1-0 オランダ 🇳🇱 (33分・三笘 薫)」
 * - スコアは得点後の状態
 * - ownGoal / penalty の場合は強調
 */
export function buildGoalPayload(
  match: Match,
  home: Team | undefined,
  away: Team | undefined,
  scoreHome: number,
  scoreAway: number,
  goal: {
    minute: number | null;
    injuryTime: number | null;
    type: string; // REGULAR / OWN / PENALTY
    team: string; // teamId
    scorer: string;
    assist: string | null;
  },
): NotificationPayload {
  const hn = shortName(home, match.homeTeamId);
  const an = shortName(away, match.awayTeamId);
  const flag = (t: Team | undefined): string => t?.flag ?? "";
  const isHomeGoal = goal.team === match.homeTeamId;
  const scoringFlag = isHomeGoal ? flag(home) : flag(away);
  const scoringName = isHomeGoal ? hn : an;

  // 時間表示
  const minuteText =
    goal.minute !== null
      ? goal.injuryTime !== null && goal.injuryTime > 0
        ? `${goal.minute}+${goal.injuryTime}分`
        : `${goal.minute}分`
      : "";

  // 種類
  const goalEmoji =
    goal.type === "PENALTY"
      ? "🎯"
      : goal.type === "OWN"
        ? "😱"
        : "⚽";
  const goalLabel =
    goal.type === "PENALTY"
      ? "PK"
      : goal.type === "OWN"
        ? "オウンゴール"
        : "ゴール";

  const title = `${goalEmoji} ${goalLabel}！${flag(home)} ${hn} ${scoreHome}-${scoreAway} ${an} ${flag(away)}`.trim();

  const bodyParts: string[] = [];
  if (minuteText) bodyParts.push(minuteText);
  if (goal.scorer) bodyParts.push(`${scoringFlag} ${goal.scorer}`);
  if (goal.assist && goal.type !== "OWN")
    bodyParts.push(`アシスト: ${goal.assist}`);
  const body =
    bodyParts.length > 0
      ? bodyParts.join(" ・ ")
      : `${scoringFlag} ${scoringName} が得点！`;

  return {
    title,
    body,
    url: `/matches/${match.id}`,
    matchId: match.id,
    // タグはゴール idx を含めて重複再表示防止と独立通知を両立
    tag: `goal-${match.id}-${scoreHome}-${scoreAway}`,
    type: "goal",
  };
}

export function buildHalftimeScorePayload(
  match: Match,
  home: Team | undefined,
  away: Team | undefined,
  halfHome: number,
  halfAway: number,
): NotificationPayload {
  const hn = shortName(home, match.homeTeamId);
  const an = shortName(away, match.awayTeamId);
  const flag = (t: Team | undefined): string => t?.flag ?? "";
  const title = `⏸ HT ${flag(home)} ${hn} ${halfHome} - ${halfAway} ${an} ${flag(away)}`.trim();
  const body =
    halfHome === halfAway
      ? `前半終了。${halfHome}-${halfAway} のスコアで折り返し。後半が本番。`
      : halfHome > halfAway
        ? `前半終了。${flag(home)} ${hn} が ${halfHome}-${halfAway} とリード。\n後半 45 分が始まります。`
        : `前半終了。${flag(away)} ${an} が ${halfAway}-${halfHome} とリード。\n後半 45 分が始まります。`;
  return {
    title,
    body,
    url: `/matches/${match.id}`,
    matchId: match.id,
    tag: `halftime-score-${match.id}`,
    type: "halftime",
  };
}

/**
 * ハーフタイム終了（後半開始）のスコア付き payload。
 * ネタバレ防止モード OFF のユーザーに、現在スコアと共に「後半始まるぞ」を伝える。
 */
export function buildHalftimeEndScorePayload(
  match: Match,
  home: Team | undefined,
  away: Team | undefined,
  scoreHome: number,
  scoreAway: number,
): NotificationPayload {
  const hn = shortName(home, match.homeTeamId);
  const an = shortName(away, match.awayTeamId);
  const flag = (t: Team | undefined): string => t?.flag ?? "";
  const title = `▶️ 後半開始 ${flag(home)} ${hn} ${scoreHome} - ${scoreAway} ${an} ${flag(away)}`.trim();
  const body =
    scoreHome === scoreAway
      ? `${scoreHome}-${scoreAway} のまま後半キックオフ。\nこの 45 分で勝者が決まる。`
      : scoreHome > scoreAway
        ? `${flag(home)} ${hn} が ${scoreHome}-${scoreAway} でリードして後半開始。\n逆転なるか、押し切るか。`
        : `${flag(away)} ${an} が ${scoreAway}-${scoreHome} でリードして後半開始。\n逆転なるか、押し切るか。`;
  return {
    title,
    body,
    url: `/matches/${match.id}`,
    matchId: match.id,
    tag: `halftime-end-score-${match.id}`,
    type: "halftime-end",
  };
}

/**
 * 得点者リストを「33' 三笘・67' 久保 / 89' Verstappen」形式に整形。
 * - ホームチーム → アウェイチームの順で / 区切り
 * - 各チーム内は分昇順
 * - オウンゴールは "(OG)" 補足
 * - PK は "(PK)" 補足
 *
 * goals が空 (football-data.org 無料枠で取れない場合や試合中) → 空文字
 */
function formatScorers(
  goals: NonNullable<Match["events"]>["goals"] | undefined,
  homeTeamId: string,
  awayTeamId: string,
): string {
  if (!goals || goals.length === 0) return "";
  const fmt = (g: NonNullable<Match["events"]>["goals"][number]) => {
    const min =
      g.minute !== null
        ? g.injuryTime
          ? `${g.minute}+${g.injuryTime}'`
          : `${g.minute}'`
        : "";
    const suffix =
      g.type === "OWN" ? " (OG)" : g.type === "PENALTY" ? " (PK)" : "";
    const name = (g.scorer || "").trim();
    if (!name) return ""; // 得点者名が取れていないものはスキップ
    return `${min} ${name}${suffix}`.trim();
  };
  const sorted = [...goals].sort(
    (a, b) =>
      (a.minute ?? 999) - (b.minute ?? 999) ||
      (a.injuryTime ?? 0) - (b.injuryTime ?? 0),
  );
  // オウンゴールは「相手側に得点が入る」が、見出しのチーム所属判定では
  // g.team はゴールを入れた本人のチーム ID（OG なら自陣に入れた側）。
  // ここではシンプルに「自軍枠の得点」として home/away を分ける。
  const homeGoals = sorted.filter((g) => g.team === homeTeamId).map(fmt).filter(Boolean);
  const awayGoals = sorted.filter((g) => g.team === awayTeamId).map(fmt).filter(Boolean);
  if (homeGoals.length === 0 && awayGoals.length === 0) return "";
  const homeLine = homeGoals.join("・");
  const awayLine = awayGoals.join("・");
  if (homeGoals.length && awayGoals.length) {
    return `⚽ ${homeLine} / ${awayLine}`;
  }
  return `⚽ ${homeLine || awayLine}`;
}

export function buildResultPayload(
  match: Match,
  home: Team | undefined,
  away: Team | undefined,
): NotificationPayload {
  const hn = shortName(home, match.homeTeamId);
  const an = shortName(away, match.awayTeamId);
  const flag = (t: Team | undefined): string => t?.flag ?? "";

  // 表示スコア: 延長戦に入った場合は ET の累計を採用、それ以外は規定 90 分のスコア。
  const r = match.result;
  const displayHome = r?.extraTime?.home ?? r?.home ?? 0;
  const displayAway = r?.extraTime?.away ?? r?.away ?? 0;
  const pk = r?.penalties;
  const duration = r?.duration;

  // 勝者判定: r.winner があれば優先、なければスコアで判断（PK 戦は引き分けが規定スコアなので winner 必須）
  let winnerSide: "home" | "away" | "draw";
  if (r?.winner) {
    winnerSide = r.winner;
  } else if (pk) {
    winnerSide = pk.home > pk.away ? "home" : pk.away > pk.home ? "away" : "draw";
  } else {
    winnerSide =
      displayHome === displayAway
        ? "draw"
        : displayHome > displayAway
          ? "home"
          : "away";
  }

  // タイトル: スコア + ET / PK の補足
  let suffix = "";
  if (duration === "EXTRA_TIME") suffix = " (AET)";
  else if (duration === "PENALTY_SHOOTOUT" && pk) {
    suffix = ` (PK ${pk.home}-${pk.away})`;
  }
  const emoji = winnerSide === "draw" ? "🤝" : "🏆";
  const title =
    `${emoji} ${flag(home)} ${hn} ${displayHome} - ${displayAway} ${an} ${flag(away)}${suffix}`.trim();

  const winnerName =
    winnerSide === "home" ? hn : winnerSide === "away" ? an : null;
  const winnerFlag =
    winnerSide === "home"
      ? flag(home)
      : winnerSide === "away"
        ? flag(away)
        : null;

  // 得点者リスト（取れていれば本文に追加）
  const scorers = formatScorers(
    match.events?.goals,
    match.homeTeamId,
    match.awayTeamId,
  );
  const scorersLine = scorers ? `\n${scorers}` : "";

  let body: string;
  if (winnerSide === "draw") {
    body = `両者譲らず、痛み分け。${scorersLine}`;
  } else if (duration === "PENALTY_SHOOTOUT") {
    body = `${winnerFlag} ${winnerName} が PK 戦を制して勝利！${scorersLine}`;
  } else if (duration === "EXTRA_TIME") {
    body = `${winnerFlag} ${winnerName} が延長戦で勝利！${scorersLine}`;
  } else {
    body = `${winnerFlag} ${winnerName} の勝利！${scorersLine}`;
  }
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
