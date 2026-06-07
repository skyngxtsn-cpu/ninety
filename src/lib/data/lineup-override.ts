/**
 * 試合ごとの「正式スタメン」上書きデータ。
 *
 * 入力ソース 2 種:
 *  1. 手書き hand-edited overrides（このファイル内 matchLineupOverrides）
 *  2. 自動取得 lineup-overrides-auto.json（football-data.org スクレイプ結果）
 *
 * 解決順序: 手書き > 自動取得 > formations.ts の想定スタメン
 */
import type { PredictedLineup } from "./formations";
import autoOverridesRaw from "./lineup-overrides-auto.json";

export type MatchLineupOverride = {
  home?: PredictedLineup;
  away?: PredictedLineup;
  /** "auto" なら自動取得、"manual" なら手書き */
  source?: "auto" | "manual";
};

const autoOverrides = autoOverridesRaw as Record<string, MatchLineupOverride>;

/** 手書きの override。緊急で実スタメンを反映したい場合ここに追加 */
export const matchLineupOverrides: Record<string, MatchLineupOverride> = {
  // 例:
  // "2026-06-14-ned-jpn": {
  //   home: { formation: "4-3-3", slots: [...] },
  //   away: { formation: "4-2-3-1", slots: [...] },
  //   source: "manual",
  // },
};

export function getMatchOverride(matchId: string): MatchLineupOverride | undefined {
  // 手書きを優先
  const manual = matchLineupOverrides[matchId];
  if (manual) return manual;
  return autoOverrides[matchId];
}
