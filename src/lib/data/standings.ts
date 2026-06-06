import type { Group, GroupRow } from "../types";
import { getAllTeams } from "./teams";
import { getAllMatches } from "./matches";

/**
 * 試合結果から動的に順位表を計算する。
 * 試合がまだ無いグループは、出場チームを表示するだけ（全項目0）。
 */
export async function getAllGroups(): Promise<Group[]> {
  const [teams, matches] = await Promise.all([getAllTeams(), getAllMatches()]);
  const groupNames = Array.from(new Set(teams.map((t) => t.group))).sort();
  const result: Group[] = [];

  for (const g of groupNames) {
    const teamsInGroup = teams.filter((t) => t.group === g);
    const rowMap = new Map<string, GroupRow>();
    for (const t of teamsInGroup) {
      rowMap.set(t.id, {
        teamId: t.id,
        played: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        pts: 0,
      });
    }

    const groupMatches = matches.filter(
      (m) =>
        m.status === "finished" &&
        m.result &&
        rowMap.has(m.homeTeamId) &&
        rowMap.has(m.awayTeamId)
    );

    for (const m of groupMatches) {
      const home = rowMap.get(m.homeTeamId)!;
      const away = rowMap.get(m.awayTeamId)!;
      home.played++;
      away.played++;
      home.gf += m.result!.home;
      home.ga += m.result!.away;
      away.gf += m.result!.away;
      away.ga += m.result!.home;
      if (m.result!.home > m.result!.away) {
        home.w++;
        home.pts += 3;
        away.l++;
      } else if (m.result!.home < m.result!.away) {
        away.w++;
        away.pts += 3;
        home.l++;
      } else {
        home.d++;
        away.d++;
        home.pts++;
        away.pts++;
      }
    }

    result.push({
      name: g as Group["name"],
      rows: Array.from(rowMap.values()),
    });
  }
  return result;
}

export async function getGroup(name: string): Promise<Group | undefined> {
  const all = await getAllGroups();
  return all.find((g) => g.name === name);
}

/**
 * グループ → R32 で対戦するグループ（FIFA 2026 確定の組み合わせ）
 *   - 1位通過: 別グループの2位 と R32 で対戦
 *   - 2位通過: 同じく別グループの相手
 *  例: B組1位 → C組2位 (R32 #75), B組2位 → A組2位 (R32 #73 の片側ペア)
 *  これは bracket-map と OpenFootball R32 の team1/team2 配置から導出。
 */
type R32Slot = { vsGroup?: string; vsRank?: 1 | 2 | 3; vsMulti?: string[] };

const R32_BY_GROUP_RANK: Record<string, Partial<Record<1 | 2 | 3, R32Slot>>> = {
  A: {
    1: { vsMulti: ["C", "E", "F", "H", "I"] }, // 1A → 3位 (R32 #79)
    2: { vsGroup: "B", vsRank: 2 }, // 2A vs 2B (R32 #73)
  },
  B: {
    1: { vsMulti: ["E", "F", "G", "I", "J"] }, // 1B → 3位 (R32 #85)
    2: { vsGroup: "A", vsRank: 2 },
  },
  C: {
    1: { vsGroup: "F", vsRank: 2 }, // 1C vs 2F (R32 #76)
    2: { vsGroup: "F", vsRank: 1 }, // 2C vs 1F (R32 #75)
  },
  D: {
    1: { vsMulti: ["B", "E", "F", "I", "J"] }, // 1D → 3位 (R32 #81)
    2: { vsGroup: "G", vsRank: 2 }, // 2D vs 2G (R32 #88)
  },
  E: {
    1: { vsMulti: ["A", "B", "C", "D", "F"] }, // 1E → 3位 (R32 #74)
    2: { vsGroup: "I", vsRank: 2 }, // 2E vs 2I (R32 #78)
  },
  F: {
    1: { vsGroup: "C", vsRank: 2 }, // 1F vs 2C (R32 #75)
    2: { vsGroup: "C", vsRank: 1 }, // 2F vs 1C (R32 #76)
  },
  G: {
    1: { vsMulti: ["A", "E", "H", "I", "J"] }, // 1G → 3位 (R32 #82)
    2: { vsGroup: "D", vsRank: 2 },
  },
  H: {
    1: { vsGroup: "J", vsRank: 2 }, // 1H vs 2J (R32 #84)
    2: { vsGroup: "J", vsRank: 1 }, // 2H vs 1J (R32 #86)
  },
  I: {
    1: { vsMulti: ["C", "D", "F", "G", "H"] }, // 1I → 3位 (R32 #77)
    2: { vsGroup: "E", vsRank: 2 },
  },
  J: {
    1: { vsGroup: "H", vsRank: 2 },
    2: { vsGroup: "H", vsRank: 1 },
  },
  K: {
    1: { vsMulti: ["D", "E", "I", "J", "L"] }, // 1K → 3位 (R32 #87)
    2: { vsGroup: "L", vsRank: 2 }, // 2K vs 2L (R32 #83)
  },
  L: {
    1: { vsMulti: ["E", "H", "I", "J", "K"] }, // 1L → 3位 (R32 #80)
    2: { vsGroup: "K", vsRank: 2 },
  },
};

function describeSlot(slot: R32Slot, teamNameLookup?: (gr: string, rank: 1 | 2 | 3) => string | undefined): string {
  if (slot.vsMulti) return `${slot.vsMulti.join("/")}組 3位 の中の1チーム`;
  if (slot.vsGroup && slot.vsRank !== undefined) {
    const realName = teamNameLookup?.(slot.vsGroup, slot.vsRank);
    if (realName) return `${realName}（${slot.vsGroup}組 ${slot.vsRank}位）`;
    return `${slot.vsGroup}組 ${slot.vsRank}位`;
  }
  return "未確定";
}

/**
 * チームが「1位 / 2位 で通過した場合の R32 相手」のシナリオを返す。
 * group が分からない場合や K/L 等は空配列。
 */
export async function nextOpponentScenarios(
  teamId: string,
): Promise<{ rank: 1 | 2; opponent: string }[]> {
  const all = await getAllTeams();
  const team = all.find((t) => t.id === teamId);
  if (!team) return [];
  const groupRules = R32_BY_GROUP_RANK[team.group];
  if (!groupRules) return [];
  const out: { rank: 1 | 2; opponent: string }[] = [];
  for (const rank of [1, 2] as const) {
    const slot = groupRules[rank];
    if (!slot) continue;
    out.push({ rank, opponent: describeSlot(slot) });
  }
  return out;
}
