/**
 * NG ワードの簡易フィルタ。
 * 検出した投稿は拒否する。
 * リスト自体は控えめに（暴言・差別系）。後で拡張可能。
 */
const NG_PATTERNS: RegExp[] = [
  /\b(死ね|殺す|くたばれ)\b/i,
  /\b(キモ|うざ)い?\b/i,
  /\b(ファック|fuck|shit)\b/i,
];

const URL_PATTERN = /(https?:\/\/|www\.)\S+/i;

export function isPostAllowed(text: string): { ok: boolean; reason?: string } {
  const t = text.trim();
  if (!t) return { ok: false, reason: "空のコメントは投稿できません" };
  if (t.length > 200)
    return { ok: false, reason: "コメントは 200 文字以内にしてください" };
  if (URL_PATTERN.test(t))
    return { ok: false, reason: "URL の投稿は禁止されています" };
  for (const p of NG_PATTERNS) {
    if (p.test(t)) return { ok: false, reason: "不適切な表現が含まれています" };
  }
  return { ok: true };
}
