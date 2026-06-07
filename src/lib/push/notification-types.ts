/**
 * Web Push 通知の種別とグループ定義。
 */

export type NotificationType =
  | "pre-3h"
  | "pre-1h"
  | "pre-15m"
  | "kickoff"
  | "halftime"
  | "fulltime"
  | "result"
  | "tournament"
  | "digest"; // 1日の全試合終了後 → 明日の推し試合プレビュー

export type NotificationGroup =
  | "pre"
  | "live"
  | "result"
  | "digest"
  | "tournament";

export const TYPE_TO_GROUP: Record<NotificationType, NotificationGroup> = {
  "pre-3h": "pre",
  "pre-1h": "pre",
  "pre-15m": "pre",
  kickoff: "live",
  halftime: "live",
  fulltime: "live",
  result: "result",
  tournament: "tournament",
  digest: "digest",
};

/**
 * 各タイプの「キックオフからの相対オフセット（分）」。
 * morning と tournament は別ロジックなので null。
 */
export const OFFSET_MINUTES: Record<NotificationType, number | null> = {
  "pre-3h": -180,
  "pre-1h": -60,
  "pre-15m": -15,
  kickoff: 0,
  halftime: 50, // 前半 45 + ロスタイム 5
  fulltime: 110, // 90 + ロスタイム + 後半開始までの間
  result: 115,
  tournament: null,
  digest: null,
};

/**
 * tick の発火許容ウィンドウ（分）。
 * cron が 5 分刻みなのでオフセット中心 ±2.5 分を見る。
 */
export const TICK_WINDOW_MINUTES = 2.5;

export type NotificationPreferences = {
  /** 事前通知 (pre-3h / pre-1h / pre-15m) */
  pre: boolean;
  /** 試合中通知 (kickoff / halftime / fulltime — スコア無し) */
  live: boolean;
  /** 1日の全試合終了後の「明日のプレビュー」ダイジェスト */
  digest: boolean;
  /** トーナメント進出通知 */
  tournament: boolean;
  /**
   * 試合結果通知（スコア付き）。
   * ネタバレ防止モード ON 時はサーバー側で強制 false 扱い。
   */
  result: boolean;
  /** 静寂時間 (HH:mm の文字列。null なら無し) */
  quiet: { start: string; end: string } | null;
};

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  pre: true,
  live: true,
  digest: true,
  tournament: true,
  result: false,
  quiet: null,
};

/** group が ON なら type も配信可。各 type のフラグはまだ細分化していない */
export function isTypeEnabled(
  type: NotificationType,
  pref: NotificationPreferences,
  spoilerBlock: boolean,
): boolean {
  // ネタバレ防止モード ON 時は、結果を暗黙的にバラすタイプを強制 OFF
  //   - result: スコア丸見え
  //   - tournament: 通知が届く＝推しが勝ち抜けたことが分かる
  if (spoilerBlock && (type === "result" || type === "tournament")) {
    return false;
  }
  const group = TYPE_TO_GROUP[type];
  return pref[group] === true;
}
