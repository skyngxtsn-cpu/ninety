/**
 * ダイジェスト通知の振り返り対象とする「注目国」のハードコード一覧。
 * W杯2026 における Tier-1 国（FIFA ランキング上位 + 大会の話題国）を
 * 暫定で列挙。後で AI またはユーザー設定で柔軟にしたい。
 *
 * 推しチームは常に対象（このリストとは独立）。
 */
export const TIER1_TEAM_IDS = new Set<string>([
  "bra",
  "arg",
  "fra",
  "esp",
  "por",
  "eng",
  "ger",
  "ned",
  "bel",
  "cro",
  "uru",
  "mar",
  "jpn", // 日本も常に注目対象として
]);

/** その試合が「注目試合」か（少なくとも一方が Tier-1） */
export function isNotableMatch(homeId: string, awayId: string): boolean {
  return TIER1_TEAM_IDS.has(homeId) || TIER1_TEAM_IDS.has(awayId);
}
