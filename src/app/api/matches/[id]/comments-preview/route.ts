import { NextResponse } from "next/server";
import { redis } from "../../../../../lib/push/redis";
import { CK } from "../../../../../lib/comments/redis-keys";
import type { Comment } from "../../../../../lib/comments/types";

export const runtime = "nodejs";

/**
 * GET /api/matches/[id]/comments-preview
 * 試合カードに表示するための「最新 1 件 + 総数」を返す軽量エンドポイント。
 * Edge cache 10 秒。
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // 最新 1 件（降順で 1 件取る = rev sorted set の最大 score）
  const ids = (await redis.zrange<string[]>(
    CK.matchComments(id),
    0,
    0,
    { rev: true },
  )) ?? [];
  let latest: Comment | null = null;
  if (ids.length > 0) {
    const raw = await redis.get<string>(CK.comment(ids[0]));
    if (raw) {
      latest =
        typeof raw === "string" ? (JSON.parse(raw) as Comment) : (raw as unknown as Comment);
    }
  }
  const count = (await redis.zcard(CK.matchComments(id))) ?? 0;

  return new NextResponse(JSON.stringify({ latest, count }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=10, max-age=0, stale-while-revalidate=30",
    },
  });
}
