import type { Match, MatchStatus } from "../types";
import { fetchEnrichedFixtures, type EnrichedMatch } from "../openfootball";
import { getAllTeams } from "./teams";
import { getAugmentation, defaultAugmentation } from "./match-augment";
import { jaRound, shortVenue } from "./i18n";
import { broadcastsForMatch } from "./broadcasts";
import autoResultsRaw from "./match-results-auto.json";

type AutoResult = {
  source?: string;
  status?: string;
  home?: number | null;
  away?: number | null;
  halfHome?: number | null;
  halfAway?: number | null;
  fetchedAt?: string;
};
const autoResults = autoResultsRaw as Record<string, AutoResult>;

/**
 * リクエストごとに「いま」と試合状態を再計算する。
 * fetch自体は Next.js の revalidate=3600 でキャッシュ済みなので、
 * ここでのオーバーヘッドは無視できる。
 */
async function loadAll(): Promise<{ matches: Match[]; nowRef: Date }> {
  const [fixtures, teams] = await Promise.all([
    fetchEnrichedFixtures(),
    getAllTeams(),
  ]);
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const nowRef = new Date();

  if (fixtures.length === 0) {
    return { matches: [], nowRef };
  }

  const sorted = [...fixtures].sort(
    (a, b) => new Date(a.kickoffJST).getTime() - new Date(b.kickoffJST).getTime()
  );
  const matches: Match[] = sorted.map((m) => toMatch(m, teamById, nowRef));
  return { matches, nowRef };
}

function toMatch(
  ef: EnrichedMatch,
  teamById: Record<string, { name: string; starPlayerIds?: string[] }>,
  nowRef: Date
): Match {
  const aug =
    getAugmentation(ef.team1Id, ef.team2Id) ??
    defaultAugmentation(
      teamById[ef.team1Id]?.name ?? ef.team1,
      teamById[ef.team2Id]?.name ?? ef.team2,
      ef.team1Id === "jpn" || ef.team2Id === "jpn"
    );

  // augmentationは「ペアキーで先頭のチーム勝利」視点で書かれている。
  // ホーム=team1がペアキー先頭でなければ、homeWin/awayWinを入れ替える。
  const pairFirst = [ef.team1Id, ef.team2Id].sort()[0];
  const flip = ef.team1Id !== pairFirst;
  const meaning = flip
    ? {
        homeWin: aug.meaning.awayWin,
        draw: aug.meaning.draw,
        awayWin: aug.meaning.homeWin,
      }
    : aug.meaning;

  const kickoffMs = new Date(ef.kickoffJST).getTime();
  const finished = kickoffMs + 110 * 60 * 1000 < nowRef.getTime(); // 試合後110分

  const matchId = `${ef.date}-${ef.team1Id}-${ef.team2Id}`;

  // football-data.org からの自動取得結果でステータス・スコアを上書き（OpenFootball より早い）
  const autoR = autoResults[matchId];
  const autoFinished = autoR?.status === "FINISHED";
  const autoLive =
    autoR?.status === "IN_PLAY" || autoR?.status === "PAUSED";
  const status: MatchStatus =
    ef.status === "finished" || finished || autoFinished
      ? "finished"
      : autoLive
        ? "live"
        : "scheduled";
  const effectiveScore1 =
    typeof autoR?.home === "number" ? autoR.home : ef.score1;
  const effectiveScore2 =
    typeof autoR?.away === "number" ? autoR.away : ef.score2;
  // 放送セットの優先順位: match-augment（手書き） > MATCH_OVERRIDES > デフォルト
  const broadcasts =
    aug.broadcasts && aug.broadcasts.length > 0
      ? aug.broadcasts
      : broadcastsForMatch(matchId);

  return {
    id: matchId,
    homeTeamId: ef.team1Id,
    awayTeamId: ef.team2Id,
    homeIsPlaceholder: ef.team1IsPlaceholder || undefined,
    awayIsPlaceholder: ef.team2IsPlaceholder || undefined,
    homeRaw: ef.team1Raw,
    awayRaw: ef.team2Raw,
    kickoffJST: ef.kickoffJST,
    stage: jaRound(ef.round, ef.group),
    venue: shortVenue(ef.ground),
    broadcasts,
    status,
    hook: aug.hook,
    meaning,
    storylines: aug.storylines,
    keyPlayerIds: (() => {
      const homeStars = teamById[ef.team1Id]?.starPlayerIds ?? [];
      const awayStars = teamById[ef.team2Id]?.starPlayerIds ?? [];
      // home → away を交互に取って両チームから公平に
      const interleaved: string[] = [];
      const max = Math.max(homeStars.length, awayStars.length);
      for (let i = 0; i < max; i++) {
        if (i < homeStars.length) interleaved.push(homeStars[i]);
        if (i < awayStars.length) interleaved.push(awayStars[i]);
      }
      const merged = [
        ...aug.keyPlayerIds,
        ...interleaved.filter((id) => !aug.keyPlayerIds.includes(id)),
      ];
      return [merged[0] ?? "", merged[1] ?? "", merged[2] ?? ""] as [
        string,
        string,
        string,
      ];
    })(),
    // 試合後ダミーは後段で生成（今は省略）
    result: status === "finished" && effectiveScore1 !== undefined && effectiveScore2 !== undefined
      ? {
          home: effectiveScore1,
          away: effectiveScore2,
          whyTrending: `${teamById[ef.team1Id]?.name ?? ef.team1} と ${teamById[ef.team2Id]?.name ?? ef.team2} の対戦が終了。`,
          summary30s: "試合の詳細要約は順次更新されます。",
          manOfTheMatchId: aug.keyPlayerIds[0] ?? "kubo",
          nextImplication: "順位表とトーナメント表が更新されました。",
        }
      : undefined,
  };
}

export async function getAllMatches(): Promise<Match[]> {
  return (await loadAll()).matches;
}

export async function getMatch(id: string): Promise<Match | undefined> {
  const { matches } = await loadAll();
  return matches.find((m) => m.id === id);
}

/** ヒーローカード：推しチームの直近・未来の試合を優先で選ぶ */
export async function getFeaturedMatch(
  favoriteTeams: string[] = ["jpn"],
): Promise<Match | undefined> {
  const { matches, nowRef } = await loadAll();
  const upcoming = matches.filter(
    (m) => m.status !== "finished" && new Date(m.kickoffJST).getTime() >= nowRef.getTime()
  );
  const favSet = new Set(favoriteTeams);
  const fav = upcoming.find(
    (m) => favSet.has(m.homeTeamId) || favSet.has(m.awayTeamId),
  );
  return fav ?? upcoming[0] ?? matches[matches.length - 1];
}

export async function getTodayMatches(): Promise<Match[]> {
  const { matches, nowRef } = await loadAll();
  const day = 24 * 3600 * 1000;
  return matches.filter(
    (m) =>
      Math.abs(new Date(m.kickoffJST).getTime() - nowRef.getTime()) < day
  );
}

export async function getFinishedMatches(): Promise<Match[]> {
  const { matches } = await loadAll();
  return matches.filter((m) => m.status === "finished").slice(-3);
}

export async function getTrendingMatches(
  favoriteTeams: string[] = ["jpn"],
): Promise<Match[]> {
  const { matches, nowRef } = await loadAll();
  // 大物カード or 推しチーム戦 を優先で5件
  const featured = await getFeaturedMatch(favoriteTeams);
  const big = new Set([
    "bra-arg",
    "arg-bra",
    "eng-fra",
    "fra-eng",
    "esp-por",
    "por-esp",
  ]);
  const favSet = new Set(favoriteTeams);
  const ranked = matches
    .filter((m) => m.id !== featured?.id)
    .sort((a, b) => {
      const ka = `${a.homeTeamId}-${a.awayTeamId}`;
      const kb = `${b.homeTeamId}-${b.awayTeamId}`;
      const sa =
        (big.has(ka) ? 100 : 0) +
        (favSet.has(a.homeTeamId) || favSet.has(a.awayTeamId) ? 50 : 0);
      const sb =
        (big.has(kb) ? 100 : 0) +
        (favSet.has(b.homeTeamId) || favSet.has(b.awayTeamId) ? 50 : 0);
      if (sa !== sb) return sb - sa;
      const diffA = Math.abs(new Date(a.kickoffJST).getTime() - nowRef.getTime());
      const diffB = Math.abs(new Date(b.kickoffJST).getTime() - nowRef.getTime());
      return diffA - diffB;
    });
  return ranked.slice(0, 5);
}

export async function matchesByTeam(teamId: string): Promise<Match[]> {
  const all = await getAllMatches();
  return all.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId);
}

/** 相対時刻ラベル */
export async function nowReference(): Promise<Date> {
  return (await loadAll()).nowRef;
}

export function relativeKickoff(iso: string, now: Date): string {
  const diffMs = new Date(iso).getTime() - now.getTime();
  const absMin = Math.round(Math.abs(diffMs) / 60000);
  const future = diffMs > 0;
  if (absMin < 60) return future ? `あと${absMin}分` : `${absMin}分前`;
  const h = Math.round(absMin / 60);
  if (h < 24) return future ? `あと${h}時間` : `${h}時間前`;
  const d = Math.round(h / 24);
  return future ? `あと${d}日` : `${d}日前`;
}

/**
 * ホーム画面のヘッダー状態（kicker/title/hero）を期間で切替えるための判定結果。
 *   pre      : W杯開幕前
 *   today    : 大会期間中で「今日（JST）」に試合あり
 *   upcoming : 大会期間中だが「今日」は試合無し、次の試合あり
 *   finished : 全試合終了済み
 */
export type HomeHeroState =
  | {
      kind: "pre";
      daysUntilOpening: number;
      firstMatch?: Match;
      favoriteFirstMatch?: Match;
    }
  | {
      kind: "today";
      matchesToday: Match[];
      favoriteMatchToday?: Match;
    }
  | {
      kind: "upcoming";
      daysUntilNext: number;
      nextMatch?: Match;
    }
  | {
      kind: "finished";
      lastMatch?: Match;
    };

const JST = "Asia/Tokyo";

/** Date -> "YYYY-MM-DD"（JSTの日付） */
function jstDateKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export async function getHomeHeroState(
  favoriteTeams: string[] = ["jpn"],
): Promise<HomeHeroState> {
  const { matches, nowRef } = await loadAll();
  if (matches.length === 0) {
    return { kind: "pre", daysUntilOpening: 0 };
  }
  const favSet = new Set(favoriteTeams);

  const firstMs = new Date(matches[0].kickoffJST).getTime();
  const lastMs = new Date(matches[matches.length - 1].kickoffJST).getTime();
  const nowMs = nowRef.getTime();

  // --- finished ---
  if (nowMs > lastMs + 110 * 60 * 1000) {
    return { kind: "finished", lastMatch: matches[matches.length - 1] };
  }

  // --- pre ---
  if (nowMs < firstMs) {
    const days = Math.max(1, Math.ceil((firstMs - nowMs) / (24 * 3600 * 1000)));
    const favoriteFirstMatch = matches.find(
      (m) => favSet.has(m.homeTeamId) || favSet.has(m.awayTeamId),
    );
    return {
      kind: "pre",
      daysUntilOpening: days,
      firstMatch: matches[0],
      favoriteFirstMatch,
    };
  }

  // --- 大会期間中 ---
  const todayKey = jstDateKey(nowRef);
  const matchesToday = matches.filter(
    (m) => jstDateKey(new Date(m.kickoffJST)) === todayKey,
  );
  if (matchesToday.length > 0) {
    const favoriteMatchToday = matchesToday.find(
      (m) => favSet.has(m.homeTeamId) || favSet.has(m.awayTeamId),
    );
    return { kind: "today", matchesToday, favoriteMatchToday };
  }

  // --- upcoming ---
  const nextMatch =
    matches.find((m) => new Date(m.kickoffJST).getTime() > nowMs) ?? undefined;
  const days = nextMatch
    ? Math.max(
        1,
        Math.ceil(
          (new Date(nextMatch.kickoffJST).getTime() - nowMs) /
            (24 * 3600 * 1000),
        ),
      )
    : 0;
  return { kind: "upcoming", daysUntilNext: days, nextMatch };
}

/** 試合がいま LIVE 中か？（キックオフから 110 分以内） */
export function isLiveMatch(match: Match, now: Date): boolean {
  const kickMs = new Date(match.kickoffJST).getTime();
  const nowMs = now.getTime();
  return nowMs >= kickMs && nowMs <= kickMs + 110 * 60 * 1000;
}

/** 試合のキックオフ後経過分（0〜110）。終わってる試合は null */
export function liveMinute(match: Match, now: Date): number | null {
  if (!isLiveMatch(match, now)) return null;
  const diffMin = Math.floor(
    (now.getTime() - new Date(match.kickoffJST).getTime()) / 60000,
  );
  // 試合は前後半 45 分ずつ + ハーフタイム約 15 分。今は粗くキックオフからの経過分。
  return Math.max(0, diffMin);
}

/** 今からN日後までの未開催試合を、JSTの日付キーでグルーピングして返す */
export type DateBucket = {
  /** JSTの "YYYY-MM-DD" */
  dateKey: string;
  /** 表示用 "6月14日(土)" / "今日" / "明日" */
  label: string;
  /** Date オブジェクト（その日の0時 JST 想定だが当日比較用） */
  date: Date;
  matches: Match[];
};

export async function getUpcomingByDate(
  daysAhead = 7,
): Promise<DateBucket[]> {
  const { matches, nowRef } = await loadAll();
  const nowMs = nowRef.getTime();
  const horizonMs = nowMs + daysAhead * 24 * 3600 * 1000;
  const upcoming = matches.filter((m) => {
    const ms = new Date(m.kickoffJST).getTime();
    // LIVE中の試合 と これから始まる試合 を含める。終了済みは除外。
    return (
      ms + 110 * 60 * 1000 >= nowMs && // 終了から十分時間経ってないもの
      ms <= horizonMs
    );
  });

  const buckets = new Map<string, Match[]>();
  for (const m of upcoming) {
    const key = jstDateKey(new Date(m.kickoffJST));
    const arr = buckets.get(key) ?? [];
    arr.push(m);
    buckets.set(key, arr);
  }

  const result: DateBucket[] = [];
  const todayKey = jstDateKey(nowRef);
  const tomorrowKey = jstDateKey(new Date(nowMs + 24 * 3600 * 1000));
  for (const [dateKey, ms] of [...buckets.entries()].sort(
    ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
  )) {
    const date = new Date(dateKey + "T00:00:00+09:00");
    let label: string;
    if (dateKey === todayKey) label = "今日";
    else if (dateKey === tomorrowKey) label = "明日";
    else label = formatDateLabel(date);
    result.push({
      dateKey,
      label,
      date,
      matches: ms.sort(
        (a, b) =>
          new Date(a.kickoffJST).getTime() - new Date(b.kickoffJST).getTime(),
      ),
    });
  }
  return result;
}

function formatDateLabel(d: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: JST,
    month: "numeric",
    day: "numeric",
    weekday: "short",
  };
  const parts = new Intl.DateTimeFormat("ja-JP", opts).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("month")}月${get("day")}日 (${get("weekday")})`;
}

/** 試合終了済みの直近 N 試合（新しい順） */
export async function getRecentResults(limit = 5): Promise<Match[]> {
  const { matches, nowRef } = await loadAll();
  return matches
    .filter((m) => {
      const kickMs = new Date(m.kickoffJST).getTime();
      return kickMs + 110 * 60 * 1000 < nowRef.getTime();
    })
    .sort(
      (a, b) =>
        new Date(b.kickoffJST).getTime() - new Date(a.kickoffJST).getTime(),
    )
    .slice(0, limit);
}

/** 大会全体の進行カウントダウン情報 */
export type TournamentCountdown = {
  /** W杯 開幕まで（負なら開幕後） */
  daysUntilOpening: number;
  /** グループステージ終了まで（負なら終了済み） */
  daysUntilGroupEnd: number;
  /** 決勝T 開幕まで */
  daysUntilKnockoutStart: number;
  /** 決勝まで */
  daysUntilFinal: number;
  /** 残り試合数 */
  matchesRemaining: number;
  /** 全試合数 */
  totalMatches: number;
};

export async function getTournamentCountdown(): Promise<TournamentCountdown> {
  const { matches, nowRef } = await loadAll();
  if (matches.length === 0) {
    return {
      daysUntilOpening: 0,
      daysUntilGroupEnd: 0,
      daysUntilKnockoutStart: 0,
      daysUntilFinal: 0,
      matchesRemaining: 0,
      totalMatches: 0,
    };
  }
  const opening = new Date(matches[0].kickoffJST).getTime();
  // グループステージはラウンドが "Round of 32" でない試合の前まで
  const knockoutStart = matches
    .filter((m) =>
      ["ベスト32", "ベスト16", "準々決勝", "準決勝", "決勝"].some((r) =>
        m.stage.includes(r),
      ),
    )
    .sort(
      (a, b) =>
        new Date(a.kickoffJST).getTime() - new Date(b.kickoffJST).getTime(),
    )[0];
  const knockoutStartMs = knockoutStart
    ? new Date(knockoutStart.kickoffJST).getTime()
    : opening;
  // グループステージは knockoutStart の 1 日前を「終了」とする近似
  const groupEndMs = knockoutStartMs - 24 * 3600 * 1000;
  const finalMs = new Date(matches[matches.length - 1].kickoffJST).getTime();
  const nowMs = nowRef.getTime();
  const days = (ms: number) =>
    Math.ceil((ms - nowMs) / (24 * 3600 * 1000));
  const matchesRemaining = matches.filter((m) => {
    const k = new Date(m.kickoffJST).getTime();
    return k + 110 * 60 * 1000 > nowMs;
  }).length;
  return {
    daysUntilOpening: days(opening),
    daysUntilGroupEnd: days(groupEndMs),
    daysUntilKnockoutStart: days(knockoutStartMs),
    daysUntilFinal: days(finalMs),
    matchesRemaining,
    totalMatches: matches.length,
  };
}

/** 推しチームの「次の試合」（既に始まっていればLIVE扱いで返す） */
export async function getFavoriteNextMatch(
  favoriteTeams: string[],
): Promise<Match | undefined> {
  const { matches, nowRef } = await loadAll();
  const favSet = new Set(favoriteTeams);
  const nowMs = nowRef.getTime();
  return matches
    .filter((m) => favSet.has(m.homeTeamId) || favSet.has(m.awayTeamId))
    .filter((m) => new Date(m.kickoffJST).getTime() + 110 * 60 * 1000 > nowMs)
    .sort(
      (a, b) =>
        new Date(a.kickoffJST).getTime() - new Date(b.kickoffJST).getTime(),
    )[0];
}

export function formatKickoffJST(iso: string): string {
  const d = new Date(iso);
  // 日本時間で組み立て
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "narrow",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const parts = new Intl.DateTimeFormat("ja-JP", opts).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("month")}/${get("day")}(${get("weekday")}) ${get("hour")}:${get("minute")}`;
}
