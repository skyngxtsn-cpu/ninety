/**
 * 試合ごとの「正式スタメン」上書きデータ。
 *
 * - Match.id をキーに、ホーム/アウェイの確定スタメンを書く
 * - 試合開始 1 時間前に各国 SNS / Wikipedia で発表される
 * - 入っていれば自動で「想定スタメン」→「スタメン」表示に切り替わる
 *
 * 運用フロー:
 *   1. 試合開始 1 時間前にスタメン発表
 *   2. 編集者がここに追記してデプロイ（または将来は自動スクレイパで）
 *   3. アプリは即座に確定スタメンを表示
 */
import type { PredictedLineup } from "./formations";

export type MatchLineupOverride = {
  home?: PredictedLineup;
  away?: PredictedLineup;
};

export const matchLineupOverrides: Record<string, MatchLineupOverride> = {
  // 例:
  // "2026-06-14-ned-jpn": {
  //   home: { formation: "4-3-3", slots: [...] },
  //   away: { formation: "4-2-3-1", slots: [...] },
  // },
};

export function getMatchOverride(matchId: string): MatchLineupOverride | undefined {
  return matchLineupOverrides[matchId];
}
