import { NextResponse } from "next/server";
import { redis } from "../../../../../lib/push/redis";

export const runtime = "nodejs";

/**
 * GET /api/matches/[id]/watching-count
 * 「観たい」を押した人数を返す。試合カード一覧から多数同時呼ばれるため Edge cache。
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const count = (await redis.scard(`match:${id}:watching`)) ?? 0;
  return new NextResponse(JSON.stringify({ count }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=10, max-age=0, stale-while-revalidate=30",
    },
  });
}
