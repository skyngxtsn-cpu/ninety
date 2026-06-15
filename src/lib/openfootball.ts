/**
 * OpenFootball — W杯2026の公開JSONフィード。
 * 出典: https://github.com/openfootball/worldcup.json (Public Domain)
 *
 * 試合日程・チーム情報を完全無料で取得できる。
 * 大会期間中は数時間〜半日遅れで結果が反映されることがある。
 */

const BASE = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026";

export type OFMatch = {
  round: string;
  /** R32〜SF は OpenFootball 側で連番（73〜102）。GS は無し、3位決定戦・決勝は無し。 */
  num?: number;
  date: string; // YYYY-MM-DD
  time: string; // "HH:MM UTC-X" or "HH:MM UTC+X"
  team1: string;
  team2: string;
  group?: string; // "Group A" 等。決勝Tはなし
  ground: string;
  score1?: number;
  score2?: number;
  /** 試合終了済みなら入る。"ft":[2,2],"ht":[0,0] 形式 */
  score?: {
    ft?: [number, number];
    ht?: [number, number];
  };
  /** team1 (ホーム) 側の得点者。"minute" は文字列 "51" / "45+2" / "90+5"。
   *  football-data.org 無料枠で goals が取れないため OF を主データソースに。
   *  ただし数時間〜半日の更新ラグあり。
   */
  goals1?: { name: string; minute: string }[];
  /** team2 (アウェイ) 側の得点者。形式は goals1 と同じ */
  goals2?: { name: string; minute: string }[];
};

export type OFTeam = {
  name: string;
  fifa_code: string;
  group: string; // "A".."L"
  flag_icon: string;
  confed: string;
  continent: string;
};

type OFFixturePayload = {
  name: string;
  matches: OFMatch[];
};

/** Next.js のISR：1時間ごとに再検証してキャッシュ */
const REVALIDATE = { next: { revalidate: 3600 } } as const;

export async function fetchFixtures(): Promise<OFMatch[]> {
  const res = await fetch(`${BASE}/worldcup.json`, REVALIDATE);
  if (!res.ok) throw new Error(`OpenFootball fixtures: ${res.status}`);
  const data = (await res.json()) as OFFixturePayload;
  return data.matches;
}

export async function fetchTeams(): Promise<OFTeam[]> {
  const res = await fetch(`${BASE}/worldcup.teams.json`, REVALIDATE);
  if (!res.ok) throw new Error(`OpenFootball teams: ${res.status}`);
  return (await res.json()) as OFTeam[];
}

/**
 * OpenFootballのローカル時刻文字列をJSTのISO文字列に変換する。
 * 例: "13:00 UTC-6" + "2026-06-11" → "2026-06-12T04:00:00.000Z"（JSTで2026-06-12 13:00）
 */
export function toJSTISO(date: string, time: string): string {
  const match = time.match(/^(\d{1,2}):(\d{2})\s+UTC([+-])(\d+)$/);
  if (!match) {
    // fallback: 既にUTC前提
    return new Date(`${date}T${time}Z`).toISOString();
  }
  const [, hh, mm, sign, off] = match;
  const localHour = parseInt(hh, 10);
  const localMin = parseInt(mm, 10);
  const offset = parseInt(off, 10) * (sign === "-" ? -1 : 1);
  // UTC = local - offset
  const utcHour = localHour - offset;
  const [y, mo, d] = date.split("-").map(Number);
  const utcMs = Date.UTC(y, mo - 1, d, utcHour, localMin);
  return new Date(utcMs).toISOString();
}

/** チーム名（英語）→ 内部teamId（小文字fifa_code）に変換するためのキャッシュ */
let teamNameMapCache: Map<string, string> | null = null;
let teamsCache: OFTeam[] | null = null;

export async function getTeamNameMap(): Promise<Map<string, string>> {
  if (teamNameMapCache) return teamNameMapCache;
  const teams = await fetchTeams();
  teamsCache = teams;
  teamNameMapCache = new Map(teams.map((t) => [t.name, t.fifa_code.toLowerCase()]));
  return teamNameMapCache;
}

export async function getOFTeams(): Promise<OFTeam[]> {
  if (teamsCache) return teamsCache;
  teamsCache = await fetchTeams();
  return teamsCache;
}

/** 大会日程取得＋teamIdマッピング適用済みの配列を返す */
export type EnrichedMatch = OFMatch & {
  /** 解決済みなら fifa_code 小文字、未解決ならプレースホルダ slug（例: "2a", "w74", "3a-b-c-d-f"） */
  team1Id: string;
  team2Id: string;
  /** 解決済みなら false、placeholder（決勝Tの未確定枠）なら true */
  team1IsPlaceholder: boolean;
  team2IsPlaceholder: boolean;
  /** placeholder の生文字列（"2A", "W74", "3A/B/C/D/F" 等）。解決済みなら undefined */
  team1Raw?: string;
  team2Raw?: string;
  kickoffJST: string;
  status: "scheduled" | "finished";
};

export async function fetchEnrichedFixtures(): Promise<EnrichedMatch[]> {
  const [fixtures, nameMap] = await Promise.all([
    fetchFixtures(),
    getTeamNameMap(),
  ]);
  return fixtures.map((m) => {
    const r1 = nameMap.get(m.team1);
    const r2 = nameMap.get(m.team2);
    const t1Resolved = r1 !== undefined;
    const t2Resolved = r2 !== undefined;
    return {
      ...m,
      team1Id: r1 ?? slug(m.team1),
      team2Id: r2 ?? slug(m.team2),
      team1IsPlaceholder: !t1Resolved,
      team2IsPlaceholder: !t2Resolved,
      team1Raw: t1Resolved ? undefined : m.team1,
      team2Raw: t2Resolved ? undefined : m.team2,
      kickoffJST: toJSTISO(m.date, m.time),
      status:
        m.score1 !== undefined && m.score2 !== undefined ? "finished" : "scheduled",
    };
  });
}

/**
 * 名前→FIFAコードのマップに無いチーム名は placeholder（"2A", "W74", "3A/B/C/D/F"）。
 * 形を温存しながら URL/ID-safe な slug に変換する。
 *  - "2A"          → "2a"
 *  - "W74"         → "w74"
 *  - "3A/B/C/D/F"  → "3a-b-c-d-f"
 *  - "L101"        → "l101"
 */
function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
