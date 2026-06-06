import { Redis } from "@upstash/redis";

/**
 * Upstash Redis クライアント。
 * 環境変数 UPSTASH_REDIS_REST_URL と UPSTASH_REDIS_REST_TOKEN が必要。
 * Vercel の Upstash Marketplace 連携で自動セットされる。
 */
export const redis = Redis.fromEnv();

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
