/**
 * Web Push 通知の種別とグループ定義。
 */

export type NotificationType =
  | "pre-3h"
  | "pre-1h"
  | "pre-15m"
  | "lineup" // スタメン発表通知（football-data.org から取得した時点）
  | "kickoff"
  | "goal" // ⚽ 得点通知（ネタバレOK時のみ）
  | "halftime"
  | "halftime-end" // 後半開始（ハーフタイム終了）
  | "fulltime"
  | "result"
  | "tournament"
  | "digest"; // 1日の全試合終了後 → 明日の推し試合プレビュー

export type NotificationGroup =
  | "pre"
  | "lineup"
  | "live"
  | "result"
  | "digest"
  | "tournament"
  | "goal";

export const TYPE_TO_GROUP: Record<NotificationType, NotificationGroup> = {
  "pre-3h": "pre",
  "pre-1h": "pre",
  "pre-15m": "pre",
  lineup: "lineup",
  kickoff: "live",
  goal: "goal",
  halftime: "live",
  "halftime-end": "live",
  fulltime: "live",
  result: "result",
  tournament: "tournament",
  digest: "digest",
};

/**
 * 各タイプの「キックオフからの相対オフセット（分）」。
 * morning, tournament, lineup, goal は別ロジックなので null。
 */
export const OFFSET_MINUTES: Record<NotificationType, number | null> = {
  "pre-3h": -180,
  "pre-1h": -60,
  "pre-15m": -15,
  lineup: null, // 自動取得 JSON の fetchedAt から判定
  kickoff: 0,
  goal: null, // 得点イベントの差分検知で発火
  halftime: 50,
  "halftime-end": 65, // ハーフタイム 15 分後＝後半開始
  fulltime: 110,
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
  /** 3 時間前通知 */
  pre3h: boolean;
  /** 1 時間前通知 */
  pre1h: boolean;
  /** 15 分前通知 */
  pre15m: boolean;
  /** スタメン発表通知 */
  lineup: boolean;
  /** 試合中通知 (kickoff / halftime / halftime-end / fulltime — スコア無し) */
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
  /**
   * ⚽ 得点通知。点が入るたびにスコア付きで配信。
   * ネタバレ防止モード ON 時はサーバー側で強制 false 扱い。
   */
  goal: boolean;
  /** 静寂時間 (HH:mm の文字列。null なら無し) */
  quiet: { start: string; end: string } | null;
};

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  pre3h: true,
  pre1h: true,
  pre15m: true,
  lineup: true,
  live: true,
  digest: true,
  tournament: true,
  result: false,
  goal: false,
  quiet: null,
};

/**
 * 旧バージョンの NotificationPreferences (`{pre: boolean, ...}`) を
 * 新バージョン (`{pre3h, pre1h, pre15m, ...}`) に変換する。
 * 既存ユーザーの localStorage / Redis に旧構造が残っているため、
 * 読み出し直後に必ずこれを通す。
 */
export function migratePreferences(stored: unknown): NotificationPreferences {
  if (!stored || typeof stored !== "object") return { ...DEFAULT_PREFERENCES };
  const s = stored as Record<string, unknown>;
  const preLegacy =
    typeof s.pre === "boolean" ? s.pre : true; // 旧フィールドが boolean なら採用、無ければ true
  const merged = {
    ...DEFAULT_PREFERENCES,
    ...s,
    pre3h: typeof s.pre3h === "boolean" ? s.pre3h : preLegacy,
    pre1h: typeof s.pre1h === "boolean" ? s.pre1h : preLegacy,
    pre15m: typeof s.pre15m === "boolean" ? s.pre15m : preLegacy,
  } as Record<string, unknown>;
  // 旧 `pre` フィールドは持ち越さない（型に含まれていないため）
  delete merged.pre;
  return merged as unknown as NotificationPreferences;
}

/** pre-* タイプ → 該当する pref フィールド */
const PRE_TYPE_TO_FIELD: Partial<
  Record<NotificationType, keyof NotificationPreferences>
> = {
  "pre-3h": "pre3h",
  "pre-1h": "pre1h",
  "pre-15m": "pre15m",
};

/** group が ON なら type も配信可。pre-* は個別フィールドで判定 */
export function isTypeEnabled(
  type: NotificationType,
  pref: NotificationPreferences,
  spoilerBlock: boolean,
): boolean {
  // ネタバレ防止モード ON 時は、結果を暗黙的にバラすタイプを強制 OFF
  //   - result: スコア丸見え
  //   - tournament: 通知が届く＝推しが勝ち抜けたことが分かる
  //   - goal: 点数推移バラし
  if (
    spoilerBlock &&
    (type === "result" || type === "tournament" || type === "goal")
  ) {
    return false;
  }

  // ネタバレ防止モード OFF + 試合結果通知 ON のユーザーは、
  // fulltime (スコア無し) と result (スコア付き) が重複する。
  // この場合 result を優先し、fulltime をスキップ
  if (type === "fulltime" && !spoilerBlock && pref.result === true) {
    return false;
  }

  // pre-3h / pre-1h / pre-15m は個別フィールドで判定
  const preField = PRE_TYPE_TO_FIELD[type];
  if (preField !== undefined) {
    return pref[preField] === true;
  }

  const group = TYPE_TO_GROUP[type];
  return pref[group as keyof NotificationPreferences] === true;
}
