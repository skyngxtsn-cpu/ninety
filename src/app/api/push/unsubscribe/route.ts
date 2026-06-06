import { NextResponse } from "next/server";
import { K, endpointHash, redis } from "../../../../lib/push/redis";
import type { UnsubscribeRequest } from "../../../../lib/push/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: UnsubscribeRequest;
  try {
    body = (await req.json()) as UnsubscribeRequest;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body.endpoint) {
    return NextResponse.json({ error: "missing endpoint" }, { status: 400 });
  }
  const h = await endpointHash(body.endpoint);
  // この購読者が登録している全試合を取得
  const matches = await redis.smembers<string[]>(K.subMatches(h));
  const pipe = redis.pipeline();
  for (const m of matches ?? []) {
    pipe.srem(K.matchSubs(m), h);
  }
  pipe.del(K.subMatches(h));
  pipe.del(K.sub(h));
  await pipe.exec();
  return NextResponse.json({ ok: true });
}
