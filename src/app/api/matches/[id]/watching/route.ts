import { NextResponse } from "next/server";
import { redis } from "../../../../../lib/push/redis";

export const runtime = "nodejs";

const KEY = (m: string) => `match:${m}:watching`;

type Body = { userId: string; watching: boolean };

/** POST /api/matches/[id]/watching */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body.userId) {
    return NextResponse.json({ error: "missing userId" }, { status: 400 });
  }
  if (body.watching) {
    await redis.sadd(KEY(id), body.userId);
  } else {
    await redis.srem(KEY(id), body.userId);
  }
  const count = (await redis.scard(KEY(id))) ?? 0;
  return NextResponse.json({ ok: true, count });
}
