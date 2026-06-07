import { NextResponse } from "next/server";
import { redis } from "../../../../../lib/push/redis";
import { CK } from "../../../../../lib/comments/redis-keys";

export const runtime = "nodejs";

/**
 * GET /api/matches/[id]/comments-count
 * 試合のコメント総数だけ返す軽量エンドポイント。
 * Edge cache + ZCARD で多数の試合カードからのリクエストを潰す。
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const count = (await redis.zcard(CK.matchComments(id))) ?? 0;
  return new NextResponse(JSON.stringify({ count }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=10, max-age=0, stale-while-revalidate=30",
    },
  });
}
