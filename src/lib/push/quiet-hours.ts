/**
 * 静寂時間（quiet hours）判定。
 * 設定は "HH:mm" 形式の開始・終了時刻（JST想定）。
 * 0時を跨ぐ場合（例：23:00→07:00）も正しく扱う。
 */

import type { NotificationPreferences } from "./notification-types";

function parseHHmm(s: string): { h: number; m: number } | null {
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mi = parseInt(m[2], 10);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return { h, m: mi };
}

/** date を JST に変換した上で hh:mm を返す */
function toJSTHHmm(date: Date): { h: number; m: number } {
  const utcMin = date.getUTCHours() * 60 + date.getUTCMinutes();
  // JST = UTC + 9 hours
  const jstMin = (utcMin + 9 * 60) % (24 * 60);
  return { h: Math.floor(jstMin / 60), m: jstMin % 60 };
}

/**
 * 与えられた時刻が静寂時間内かどうか判定する。
 * 入力: JST想定の現時刻（Date）と preferences.quiet。
 */
export function isInQuietHours(
  now: Date,
  quiet: NotificationPreferences["quiet"],
): boolean {
  if (!quiet) return false;
  const start = parseHHmm(quiet.start);
  const end = parseHHmm(quiet.end);
  if (!start || !end) return false;
  const nowJ = toJSTHHmm(now);
  const startMin = start.h * 60 + start.m;
  const endMin = end.h * 60 + end.m;
  const nowMin = nowJ.h * 60 + nowJ.m;
  if (startMin === endMin) return false;
  if (startMin < endMin) {
    // 同日内（例: 13:00-17:00）
    return nowMin >= startMin && nowMin < endMin;
  }
  // 日跨ぎ（例: 23:00-07:00）
  return nowMin >= startMin || nowMin < endMin;
}
