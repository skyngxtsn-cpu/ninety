import { NextResponse } from "next/server";
import { redis } from "../../../../../lib/push/redis";
import { CK } from "../../../../../lib/comments/redis-keys";
import {
  REACTION_EMOJIS,
  type ReactionEmoji,
  type ReactionCounts,
  type ReactRequest,
} from "../../../../../lib/comments/types";

export const runtime = "nodejs";

/** POST /api/matches/[id]/react */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: matchId } = await params;
  let body: ReactRequest;
  try {
    body = (await req.json()) as ReactRequest;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { userId, emoji } = body;
  if (
    !userId ||
    !emoji ||
    !REACTION_EMOJIS.includes(emoji as ReactionEmoji)
  ) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  // 同一ユーザーが既に押してたら解除、未押下なら追加（toggle）
  const isMember = await redis.sismember(CK.matchReact(matchId, emoji), userId);
  if (isMember === 1) {
    await redis.srem(CK.matchReact(matchId, emoji), userId);
  } else {
    await redis.sadd(CK.matchReact(matchId, emoji), userId);
  }

  // 集計返却
  const counts: ReactionCounts = Object.fromEntries(
    REACTION_EMOJIS.map((e) => [e, 0]),
  ) as ReactionCounts;
  for (const e of REACTION_EMOJIS) {
    counts[e] = (await redis.scard(CK.matchReact(matchId, e))) ?? 0;
  }

  return NextResponse.json({ ok: true, counts, toggled: isMember !== 1 });
}
