/**
 * 決勝トーナメント（Knockout）のブラケット表現と解決ロジック。
 *
 * OpenFootball の knockout 試合は team1/team2 が placeholder（"2A", "W74" 等）。
 * これを `BracketSlot` 型の判別共用体で表現し、`resolveSlot()` で順次本物の
 * チームに置き換えていく。
 */
import { fetchEnrichedFixtures } from "../openfootball";
import { getAllGroups } from "./standings";
import { getAllTeams } from "./teams";
import { NEXT_MATCH, type BracketRound } from "./bracket-map";

export type { BracketRound };

export type BracketSlot =
  | { kind: "team"; teamId: string }
  | { kind: "group-rank"; group: string; rank: 1 | 2 | 3 }
  | { kind: "group-rank-multi"; groups: string[]; rank: 3 }
  | {
      kind: "winner-of";
      sourceMatchNum: number;
      deep?: { home: BracketSlot; away: BracketSlot };
    }
  | {
      kind: "loser-of";
      sourceMatchNum: number;
      deep?: { home: BracketSlot; away: BracketSlot };
    };

export type BracketMatch = {
  /** OpenFootball の試合番号。3位決定戦・決勝は擬似的に 9991/9992 を割当てる */
  num: number;
  /** Match.id 形式（既存の `${date}-${homeId}-${awayId}` 互換、URLルーティングOK） */
  id: string;
  round: BracketRound;
  kickoffJST: string;
  venue: string;
  home: BracketSlot;
  away: BracketSlot;
  /** 推しチームが来うる枠なら true（互換のため involvesJapan の名前を維持） */
  involvesJapan: boolean;
  /** この枠に来うる推しチームのID一覧（重複除去）。バッジで旗を出すのに使う */
  favoriteTeamIdsInvolved: string[];
  status: "scheduled" | "finished";
  result?: { home: number; away: number };
};

const ROUND_MAP: Record<string, BracketRound> = {
  "Round of 32": "R32",
  "Round of 16": "R16",
  "Quarter-final": "QF",
  "Semi-final": "SF",
  Final: "FINAL",
  "Match for third place": "THIRD",
};

/** プレースホルダ文字列 → BracketSlot */
export function parsePlaceholder(raw: string): BracketSlot {
  // "1A", "2B", "3F" のような単一グループの順位
  let m = raw.match(/^([123])([A-L])$/);
  if (m) {
    return {
      kind: "group-rank",
      group: m[2],
      rank: parseInt(m[1], 10) as 1 | 2 | 3,
    };
  }
  // "3A/B/C/D/F" のような複数3位枠
  m = raw.match(/^3([A-L])((?:\/[A-L])+)$/);
  if (m) {
    const groups = [m[1], ...m[2].slice(1).split("/")];
    return { kind: "group-rank-multi", groups, rank: 3 };
  }
  // "W74"
  m = raw.match(/^W(\d+)$/);
  if (m) {
    return { kind: "winner-of", sourceMatchNum: parseInt(m[1], 10) };
  }
  // "L101"
  m = raw.match(/^L(\d+)$/);
  if (m) {
    return { kind: "loser-of", sourceMatchNum: parseInt(m[1], 10) };
  }
  // 解決済み（fifa_code が来た想定）
  return { kind: "team", teamId: raw.toLowerCase() };
}

/** slug 経由で来た teamId（"2a", "w74", "3a-b-c-d-f"）の placeholder 復元 */
export function parseSluggedPlaceholder(slug: string): BracketSlot {
  // "2a" → "2A"
  let m = slug.match(/^([123])([a-l])$/);
  if (m) return parsePlaceholder(m[1] + m[2].toUpperCase());
  // "3a-b-c-d-f" → "3A/B/C/D/F"
  m = slug.match(/^3([a-l])((?:-[a-l])+)$/);
  if (m) {
    const raw = "3" + m[1].toUpperCase() + m[2].toUpperCase().replace(/-/g, "/");
    return parsePlaceholder(raw);
  }
  // "w74"
  m = slug.match(/^w(\d+)$/);
  if (m) return parsePlaceholder("W" + m[1]);
  // "l101"
  m = slug.match(/^l(\d+)$/);
  if (m) return parsePlaceholder("L" + m[1]);
  return { kind: "team", teamId: slug };
}

type ResolveCtx = {
  matchByNum: Map<number, BracketMatch>;
  /** group → { rank → teamId, played: 全試合数 } */
  groupRankings: Map<string, { rank1?: string; rank2?: string; rank3?: string; played: number }>;
};

/**
 * BracketSlot をできる限り解決する。試合結果＋グループ順位を見る。
 * 解決できないところは元の slot を返す（再帰深さは隔離されるよう deep に格納）。
 */
export function resolveSlot(slot: BracketSlot, ctx: ResolveCtx, depth = 0): BracketSlot {
  if (depth >= 4) return slot;

  switch (slot.kind) {
    case "team":
      return slot;

    case "group-rank": {
      const g = ctx.groupRankings.get(slot.group);
      if (!g || g.played < 3) return slot; // GS未完
      const teamId =
        slot.rank === 1 ? g.rank1 : slot.rank === 2 ? g.rank2 : g.rank3;
      return teamId ? { kind: "team", teamId } : slot;
    }

    case "group-rank-multi":
      // フェーズ1: 解決ロジック未実装（公式の best-3rd 配置表必要）
      return slot;

    case "winner-of":
    case "loser-of": {
      const src = ctx.matchByNum.get(slot.sourceMatchNum);
      if (!src) return slot;
      if (src.status === "finished" && src.result) {
        const homeWin = src.result.home > src.result.away;
        const wantWinner = slot.kind === "winner-of";
        const pickHome = homeWin === wantWinner;
        const picked = pickHome ? src.home : src.away;
        // picked がさらに placeholder の可能性もある（普通は team になっているが念のため再帰）
        return resolveSlot(picked, ctx, depth + 1);
      }
      // 試合未消化 → 前段のペアを再帰的に解決して deep に積む
      const homeDeep = resolveSlot(src.home, ctx, depth + 1);
      const awayDeep = resolveSlot(src.away, ctx, depth + 1);
      return { ...slot, deep: { home: homeDeep, away: awayDeep } };
    }
  }
}

/** 内部: OpenFootball の生 match → BracketMatch（slot は placeholder のまま） */
function toBracketMatch(
  m: Awaited<ReturnType<typeof fetchEnrichedFixtures>>[number],
): BracketMatch | null {
  const round = ROUND_MAP[m.round];
  if (!round || round === "THIRD" /* skip 3rd place in main view */) return null;
  // FINAL は OpenFootball に num が無いので、bracket-map.ts の #9992 と一致させる
  const num = m.num ?? (round === "FINAL" ? 9992 : 9991);
  const home = m.team1Raw ? parsePlaceholder(m.team1Raw) : { kind: "team" as const, teamId: m.team1Id };
  const away = m.team2Raw ? parsePlaceholder(m.team2Raw) : { kind: "team" as const, teamId: m.team2Id };
  return {
    num,
    id: `${m.date}-${m.team1Id}-${m.team2Id}`,
    round,
    kickoffJST: m.kickoffJST,
    venue: m.ground,
    home,
    away,
    involvesJapan: false, // 後段で塗る
    favoriteTeamIdsInvolved: [], // 後段で塗る
    status: m.status,
    result:
      m.score1 !== undefined && m.score2 !== undefined
        ? { home: m.score1, away: m.score2 }
        : undefined,
  };
}

/** 全 knockout 試合（R32〜Final）。slot は解決済み（可能な範囲で） */
export async function getBracketMatches(): Promise<BracketMatch[]> {
  const [fixtures, groups] = await Promise.all([
    fetchEnrichedFixtures(),
    getAllGroups(),
  ]);

  // raw bracket（placeholderのまま）
  const raw: BracketMatch[] = [];
  for (const m of fixtures) {
    const bm = toBracketMatch(m);
    if (bm) raw.push(bm);
  }

  // ResolveCtx 構築
  const matchByNum = new Map(raw.map((b) => [b.num, b]));
  const groupRankings = new Map<
    string,
    { rank1?: string; rank2?: string; rank3?: string; played: number }
  >();
  for (const g of groups) {
    const sorted = g.rows
      .slice()
      .sort((a, b) => b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf);
    const totalPlayed = Math.max(...g.rows.map((r) => r.played));
    groupRankings.set(g.name, {
      rank1: sorted[0]?.teamId,
      rank2: sorted[1]?.teamId,
      rank3: sorted[2]?.teamId,
      played: totalPlayed,
    });
  }

  // 各 slot を resolve
  const ctx: ResolveCtx = { matchByNum, groupRankings };
  const resolved = raw.map((b) => ({
    ...b,
    home: resolveSlot(b.home, ctx),
    away: resolveSlot(b.away, ctx),
  }));

  return resolved;
}

/**
 * 「指定チームの誰かが来うる枠か」を slot に対して判定する再帰関数を返す。
 * favorites として teamIds + 各チームの group を渡す。
 */
export function buildFavoriteReach(
  favoriteTeamIds: string[],
  groupOfTeam: Record<string, string>,
  matchByNum: Map<number, BracketMatch>,
): (slot: BracketSlot) => boolean {
  const teamSet = new Set(favoriteTeamIds);
  const groupSet = new Set(
    favoriteTeamIds.map((id) => groupOfTeam[id]).filter(Boolean),
  );
  const reach = (slot: BracketSlot): boolean => {
    if (slot.kind === "team") return teamSet.has(slot.teamId);
    if (slot.kind === "group-rank") return groupSet.has(slot.group);
    if (slot.kind === "group-rank-multi")
      return slot.groups.some((g) => groupSet.has(g));
    if (slot.kind === "winner-of" || slot.kind === "loser-of") {
      if (slot.deep) return reach(slot.deep.home) || reach(slot.deep.away);
      const src = matchByNum.get(slot.sourceMatchNum);
      if (!src) return false;
      return reach(src.home) || reach(src.away);
    }
    return false;
  };
  return reach;
}

/**
 * slot に来うる「推しチームのID一覧」を返す再帰関数。
 * 例: slot が "3A/B/C/D/F" で推しチームに JPN(F) と USA(D) があれば ["usa", "jpn"]。
 */
export function buildFavoriteIdsLookup(
  favoriteTeamIds: string[],
  groupOfTeam: Record<string, string>,
  matchByNum: Map<number, BracketMatch>,
): (slot: BracketSlot) => string[] {
  const teamSet = new Set(favoriteTeamIds);
  const groupToFavorites = new Map<string, string[]>();
  for (const id of favoriteTeamIds) {
    const g = groupOfTeam[id];
    if (g) {
      const arr = groupToFavorites.get(g) ?? [];
      arr.push(id);
      groupToFavorites.set(g, arr);
    }
  }
  const find = (slot: BracketSlot): string[] => {
    if (slot.kind === "team")
      return teamSet.has(slot.teamId) ? [slot.teamId] : [];
    if (slot.kind === "group-rank")
      return groupToFavorites.get(slot.group) ?? [];
    if (slot.kind === "group-rank-multi") {
      const result: string[] = [];
      for (const g of slot.groups) {
        const arr = groupToFavorites.get(g);
        if (arr) result.push(...arr);
      }
      return [...new Set(result)];
    }
    if (slot.kind === "winner-of" || slot.kind === "loser-of") {
      if (slot.deep)
        return [
          ...new Set([...find(slot.deep.home), ...find(slot.deep.away)]),
        ];
      const src = matchByNum.get(slot.sourceMatchNum);
      if (!src) return [];
      return [...new Set([...find(src.home), ...find(src.away)])];
    }
    return [];
  };
  return find;
}

/**
 * 推しチーム情報を渡して involvesFavorites を上書きした BracketMatch[] を返す。
 * 何も指定されなければデフォルトで日本 ("jpn") を推しとして扱う。
 */
export async function getBracketMatchesForFavorites(
  favoriteTeamIds: string[],
): Promise<BracketMatch[]> {
  const all = await getBracketMatches();
  const teams = await getAllTeams();
  const groupOfTeam = Object.fromEntries(teams.map((t) => [t.id, t.group]));
  const matchByNum = new Map(all.map((b) => [b.num, b]));
  const reach = buildFavoriteReach(favoriteTeamIds, groupOfTeam, matchByNum);
  const findIds = buildFavoriteIdsLookup(
    favoriteTeamIds,
    groupOfTeam,
    matchByNum,
  );
  return all.map((b) => {
    const homeIds = findIds(b.home);
    const awayIds = findIds(b.away);
    const combined = [...new Set([...homeIds, ...awayIds])];
    return {
      ...b,
      involvesJapan: reach(b.home) || reach(b.away),
      favoriteTeamIdsInvolved: combined,
    };
  });
}

/** 同じく split bracket 用 */
export async function getSplitBracketForFavorites(
  favoriteTeamIds: string[],
): Promise<SplitBracket> {
  const enriched = await getBracketMatchesForFavorites(favoriteTeamIds);
  const byNum = new Map(enriched.map((b) => [b.num, b]));
  const pick = (nums: number[]) =>
    nums.map((n) => byNum.get(n)).filter((b): b is BracketMatch => !!b);
  return {
    left: {
      R32: pick(LEFT_ORDER.R32),
      R16: pick(LEFT_ORDER.R16),
      QF: pick(LEFT_ORDER.QF),
      SF: pick(LEFT_ORDER.SF),
    },
    right: {
      R32: pick(RIGHT_ORDER.R32),
      R16: pick(RIGHT_ORDER.R16),
      QF: pick(RIGHT_ORDER.QF),
      SF: pick(RIGHT_ORDER.SF),
    },
    final: enriched.find((b) => b.round === "FINAL"),
    third: enriched.find((b) => b.round === "THIRD"),
  };
}

/** byRound 版 */
export async function getBracketByRoundForFavorites(
  favoriteTeamIds: string[],
): Promise<Record<BracketRound, BracketMatch[]>> {
  const enriched = await getBracketMatchesForFavorites(favoriteTeamIds);
  const grouped: Record<BracketRound, BracketMatch[]> = {
    R32: [],
    R16: [],
    QF: [],
    SF: [],
    FINAL: [],
    THIRD: [],
  };
  for (const b of enriched) grouped[b.round].push(b);
  for (const k of Object.keys(grouped) as BracketRound[]) {
    grouped[k].sort((a, b) => a.num - b.num);
  }
  return grouped;
}

/** ラウンド別グルーピング */
export async function getBracketByRound(): Promise<Record<BracketRound, BracketMatch[]>> {
  const all = await getBracketMatches();
  const grouped: Record<BracketRound, BracketMatch[]> = {
    R32: [],
    R16: [],
    QF: [],
    SF: [],
    FINAL: [],
    THIRD: [],
  };
  for (const b of all) grouped[b.round].push(b);
  // num 昇順で安定
  for (const k of Object.keys(grouped) as BracketRound[]) {
    grouped[k].sort((a, b) => a.num - b.num);
  }
  return grouped;
}

/** matchId（"2026-07-04-w74-w77" 等）から BracketMatch を引く */
export async function getBracketMatchById(id: string): Promise<BracketMatch | undefined> {
  const all = await getBracketMatches();
  return all.find((b) => b.id === id);
}

/** NEXT_MATCH をクライアントから参照できるように再エクスポート */
export { NEXT_MATCH };

/**
 * num の試合が、Final から見て左半分か右半分かを返す。
 * Final 自身は "center"。SF #101 配下が左、SF #102 配下が右。
 */
export function bracketSide(num: number): "left" | "right" | "center" {
  if (num >= 9991) return "center";
  let cur = num;
  while (NEXT_MATCH[cur]) {
    const next = NEXT_MATCH[cur];
    if (next.nextNum === 9992) return next.side === "home" ? "left" : "right";
    cur = next.nextNum;
  }
  return "center";
}

/**
 * フルブラケット表示用に、左半分/中央(決勝)/右半分にグルーピングし、
 * 各ラウンドを「上から下」のトーナメント順で並べた配列を返す。
 *
 * 左半分の R32 順:
 *   #74, #77, #73, #75, #83, #84, #81, #82
 *  これは R16 #89 (74,77)→#90 (73,75)→QF #97、#93 (83,84)→#94 (81,82)→QF #98 と続く順。
 */
export type SplitBracket = {
  left: {
    R32: BracketMatch[];
    R16: BracketMatch[];
    QF: BracketMatch[];
    SF: BracketMatch[];
  };
  right: {
    R32: BracketMatch[];
    R16: BracketMatch[];
    QF: BracketMatch[];
    SF: BracketMatch[];
  };
  final?: BracketMatch;
  third?: BracketMatch;
};

/** 各ラウンドの「トーナメント表での縦位置順」（FIFA 2026 確定の bracket structure） */
const LEFT_ORDER = {
  R32: [74, 77, 73, 75, 83, 84, 81, 82],
  R16: [89, 90, 93, 94],
  QF: [97, 98],
  SF: [101],
};
const RIGHT_ORDER = {
  R32: [76, 78, 79, 80, 86, 88, 85, 87],
  R16: [91, 92, 95, 96],
  QF: [99, 100],
  SF: [102],
};

export async function getSplitBracket(): Promise<SplitBracket> {
  const all = await getBracketMatches();
  const byNum = new Map(all.map((b) => [b.num, b]));
  const pick = (nums: number[]) =>
    nums.map((n) => byNum.get(n)).filter((b): b is BracketMatch => !!b);
  return {
    left: {
      R32: pick(LEFT_ORDER.R32),
      R16: pick(LEFT_ORDER.R16),
      QF: pick(LEFT_ORDER.QF),
      SF: pick(LEFT_ORDER.SF),
    },
    right: {
      R32: pick(RIGHT_ORDER.R32),
      R16: pick(RIGHT_ORDER.R16),
      QF: pick(RIGHT_ORDER.QF),
      SF: pick(RIGHT_ORDER.SF),
    },
    final: all.find((b) => b.round === "FINAL"),
    third: all.find((b) => b.round === "THIRD"),
  };
}
