import { NextResponse } from "next/server";
import { K, redis } from "../../../../lib/push/redis";

export const runtime = "nodejs";

/**
 * GET /api/admin/stats?secret=...
 *
 * 購読者の集計を返す管理用エンドポイント。
 * - 指定試合 (?match=) の購読者数（ベル + 推し home + 推し away の union）
 * - 推しチームの内訳
 *
 * 例: /api/admin/stats?secret=...&match=2026-06-14-ned-jpn&home=ned&away=jpn
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const match = url.searchParams.get("match");
  const home = url.searchParams.get("home");
  const away = url.searchParams.get("away");

  const result: Record<string, unknown> = {};

  if (match) {
    const bell = (await redis.smembers<string[]>(K.matchSubs(match))) ?? [];
    result.matchBellSubs = bell.length;
    result.matchBellHashes = bell;
  }
  if (home) {
    const arr = (await redis.smembers<string[]>(K.favSubs(home))) ?? [];
    result.homeFavSubs = arr.length;
    result.homeFavHashes = arr;
  }
  if (away) {
    const arr = (await redis.smembers<string[]>(K.favSubs(away))) ?? [];
    result.awayFavSubs = arr.length;
    result.awayFavHashes = arr;
  }

  // 試合に届く可能性のあるユニーク購読者数（bell ∪ home fav ∪ away fav）
  if (match || home || away) {
    const union = new Set<string>();
    (result.matchBellHashes as string[] | undefined)?.forEach((h) => union.add(h));
    (result.homeFavHashes as string[] | undefined)?.forEach((h) => union.add(h));
    (result.awayFavHashes as string[] | undefined)?.forEach((h) => union.add(h));
    result.uniqueRecipients = union.size;
  }

  return NextResponse.json(result);
}
