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
 *  - sub:{endpointHash}                → PushSubscription JSON
 *  - sub:{endpointHash}:matches        → SET<matchId> （この購読者がリマインド希望中の試合）
 *  - match:{matchId}:subs              → SET<endpointHash> （この試合をリマインド希望中の購読者）
 *  - match:{matchId}:fired             → "1" + TTL（重複送信防止、試合終了後に自動失効）
 */
export const K = {
  sub: (h: string) => `sub:${h}`,
  subMatches: (h: string) => `sub:${h}:matches`,
  matchSubs: (m: string) => `match:${m}:subs`,
  matchFired: (m: string) => `match:${m}:fired`,
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
