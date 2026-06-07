import { Redis } from "@upstash/redis";

/**
 * Upstash Redis クライアント。
 *
 * Vercel の Upstash Marketplace 連携で自動セットされる環境変数を使う。
 * 2025年現在の連携は KV_REST_API_URL / KV_REST_API_TOKEN という名前で入る。
 * （旧 UPSTASH_REDIS_REST_URL/TOKEN もフォールバックでサポート）
 */
function makeRedis(): Redis {
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    // 起動時はビルド時に実行されるため、ここで throw すると build が失敗する。
    // 実際の呼び出し時にエラーが返るよう、空の URL/Token で初期化（クエリ時に例外）
    return new Redis({ url: url ?? "", token: token ?? "" });
  }
  return new Redis({ url, token });
}

export const redis = makeRedis();

/**
 * キー命名:
 *  - sub:{h}                          → PushSubscription JSON
 *  - sub:{h}:matches                  → SET<matchId> ベルマーク試合
 *  - sub:{h}:favs                     → SET<teamId> 推しチーム
 *  - sub:{h}:prefs                    → JSON NotificationPreferences
 *  - sub:{h}:spoiler                  → "1" if spoilerBlock ON
 *  - match:{m}:subs                   → SET<h> ベルマーク経由の購読者
 *  - fav:{teamId}:subs                → SET<h> 推し経由の購読者
 *  - match:{m}:fired:{type}           → "1" + TTL（重複送信防止）
 *  - morning:{yyyy-mm-dd}:fired:{h}   → "1" + 25h TTL（朝ダイジェスト重複防止）
 */
export const K = {
  sub: (h: string) => `sub:${h}`,
  subMatches: (h: string) => `sub:${h}:matches`,
  subFavs: (h: string) => `sub:${h}:favs`,
  subPrefs: (h: string) => `sub:${h}:prefs`,
  subSpoiler: (h: string) => `sub:${h}:spoiler`,
  matchSubs: (m: string) => `match:${m}:subs`,
  favSubs: (teamId: string) => `fav:${teamId}:subs`,
  matchFiredType: (m: string, t: string) => `match:${m}:fired:${t}`,
  morningFired: (date: string, h: string) => `morning:${date}:fired:${h}`,
};

/** subscription endpoint URL から短いハッシュキーを作る */
export async function endpointHash(endpoint: string): Promise<string> {
  const enc = new TextEncoder().encode(endpoint);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}
