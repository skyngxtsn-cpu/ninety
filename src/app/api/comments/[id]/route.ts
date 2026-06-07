import { NextResponse } from "next/server";
import { redis } from "../../../../lib/push/redis";
import { CK } from "../../../../lib/comments/redis-keys";
import type { Comment } from "../../../../lib/comments/types";

export const runtime = "nodejs";

/** DELETE /api/comments/[id]?userId=X — 自分のコメントだけ削除可 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "missing userId" }, { status: 400 });
  const raw = await redis.get<string>(CK.comment(id));
  if (!raw) return NextResponse.json({ error: "not found" }, { status: 404 });
  const c: Comment =
    typeof raw === "string" ? JSON.parse(raw) : (raw as unknown as Comment);
  if (c.userId !== userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const pipe = redis.pipeline();
  pipe.del(CK.comment(id));
  pipe.zrem(CK.matchComments(c.matchId), id);
  await pipe.exec();
  return NextResponse.json({ ok: true });
}

/** POST /api/comments/[id]/report — 通報。閾値超えたら手動レビュー対象 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const n = await redis.incr(CK.reports(id));
  // 7日 TTL
  await redis.expire(CK.reports(id), 7 * 24 * 60 * 60);

  // コメント本文を取得（Discord 通知用 + 削除判定）
  const raw = await redis.get<string>(CK.comment(id));
  const c: Comment | null = raw
    ? typeof raw === "string"
      ? JSON.parse(raw)
      : (raw as unknown as Comment)
    : null;

  // 5回以上通報されたらコメント自動削除（粗いが MVP として）
  let autoDeleted = false;
  if ((n ?? 0) >= 5 && c) {
    const pipe = redis.pipeline();
    pipe.del(CK.comment(id));
    pipe.zrem(CK.matchComments(c.matchId), id);
    await pipe.exec();
    autoDeleted = true;
  }

  // Discord webhook（通報の即時把握、フィードバックと共用）
  const webhookUrl = process.env.FEEDBACK_DISCORD_WEBHOOK;
  if (webhookUrl && c) {
    const header = autoDeleted
      ? `🚨 **コメント自動削除**（通報 ${n} 件）`
      : `⚠️ **コメント通報**（${n} 件目）`;
    const snippet = c.text.length > 300 ? c.text.slice(0, 300) + "…" : c.text;
    const content = [
      header,
      `🏟 試合: \`${c.matchId}\``,
      `👤 ${c.nick}（\`${c.userId}\`）`,
      `💬 ${snippet}`,
    ].join("\n");
    void fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 1900) }),
    }).catch(() => {
      // best effort
    });
  }

  return NextResponse.json({ ok: true, reportCount: n, autoDeleted });
}
