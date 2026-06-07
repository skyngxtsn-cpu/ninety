import { NextResponse } from "next/server";
import { redis } from "../../../../../lib/push/redis";
import { CK } from "../../../../../lib/comments/redis-keys";
import {
  REACTION_EMOJIS,
  type Comment,
  type CommentsResponse,
  type CreateCommentRequest,
  type ReactionCounts,
} from "../../../../../lib/comments/types";
import { isPostAllowed } from "../../../../../lib/comments/ngwords";

export const runtime = "nodejs";

const POST_INTERVAL_MS = 5000;
const MAX_COMMENTS_PER_REQUEST = 100;

function newCommentId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}`;
}

/** GET /api/matches/[id]/comments?since=ts */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: matchId } = await params;
  const url = new URL(req.url);
  const since = Math.max(0, parseInt(url.searchParams.get("since") ?? "0", 10) || 0);

  // SORTED SET から since より新しい commentId を取得（昇順）
  const ids = (await redis.zrange<string[]>(
    CK.matchComments(matchId),
    since + 1,
    "+inf",
    { byScore: true, offset: 0, count: MAX_COMMENTS_PER_REQUEST },
  )) ?? [];

  let comments: Comment[] = [];
  if (ids.length > 0) {
    const raws = await Promise.all(
      ids.map((cid) => redis.get<string>(CK.comment(cid))),
    );
    comments = raws
      .filter((x): x is NonNullable<typeof x> => x != null)
      .map((raw) => (typeof raw === "string" ? (JSON.parse(raw) as Comment) : (raw as unknown as Comment)));
  }

  // 各リアクションの集計
  const reactionCounts: ReactionCounts = Object.fromEntries(
    REACTION_EMOJIS.map((e) => [e, 0]),
  ) as ReactionCounts;
  for (const e of REACTION_EMOJIS) {
    const n = await redis.scard(CK.matchReact(matchId, e));
    reactionCounts[e] = n ?? 0;
  }

  // 最新の cursor
  const latest = comments.length > 0 ? comments[comments.length - 1].createdAt : since;

  const body: CommentsResponse = {
    comments,
    reactions: reactionCounts,
    cursor: latest,
  };

  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Edge キャッシュ（複数ユーザーの同時ポーリングを潰す）
      "Cache-Control": "public, s-maxage=2, max-age=0, stale-while-revalidate=3",
    },
  });
}

/** POST /api/matches/[id]/comments */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: matchId } = await params;
  let body: CreateCommentRequest;
  try {
    body = (await req.json()) as CreateCommentRequest;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { userId, nick, flag, text } = body;
  if (!userId || !nick || !text) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // NG ワード・文字数チェック
  const allowed = isPostAllowed(text);
  if (!allowed.ok) {
    return NextResponse.json({ error: allowed.reason }, { status: 400 });
  }

  // レート制限
  const last = (await redis.get<number>(CK.userLastPost(userId))) ?? 0;
  const now = Date.now();
  if (now - last < POST_INTERVAL_MS) {
    return NextResponse.json(
      { error: "投稿の間隔が短すぎます。5秒以上空けてください" },
      { status: 429 },
    );
  }

  const id = newCommentId();
  const comment: Comment = {
    id,
    matchId,
    userId,
    nick: nick.slice(0, 24),
    flag,
    text: text.trim(),
    createdAt: now,
  };

  const pipe = redis.pipeline();
  pipe.set(CK.comment(id), JSON.stringify(comment), { ex: 60 * 60 * 24 * 90 });
  pipe.zadd(CK.matchComments(matchId), { score: now, member: id });
  pipe.set(CK.userLastPost(userId), now, { ex: 60 });
  pipe.set(CK.userNick(userId), nick.slice(0, 24), { ex: 60 * 60 * 24 * 90 });
  await pipe.exec();

  return NextResponse.json({ ok: true, comment });
}
