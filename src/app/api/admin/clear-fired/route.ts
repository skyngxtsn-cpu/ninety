import { NextResponse } from "next/server";
import { K, redis } from "../../../../lib/push/redis";

export const runtime = "nodejs";

/**
 * POST /api/admin/clear-fired?secret=...
 * Body: { matchId: string, types?: string[] }
 *
 * 指定された matchId の fired フラグを削除する。
 * 通知が誤発火した時に、正しいタイミングで再送できるようにする。
 *
 * デフォルト types: result / fulltime / halftime / halftime-end / kickoff
 * (pre-X 系は再送不要なのでデフォルト外。明示的に渡すこと)
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: { matchId?: string; types?: string[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body.matchId) {
    return NextResponse.json({ error: "missing matchId" }, { status: 400 });
  }

  const types = body.types ?? [
    "result",
    "fulltime",
    "halftime",
    "halftime-end",
    "kickoff",
    "score-baseline",
  ];

  const cleared: string[] = [];
  for (const t of types) {
    const key = K.matchFiredType(body.matchId, t);
    const result = await redis.del(key);
    if (result > 0) cleared.push(t);
  }

  return NextResponse.json({ ok: true, matchId: body.matchId, cleared });
}
