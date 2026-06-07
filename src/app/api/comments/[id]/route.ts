import { NextResponse } from "next/server";
import { redis } from "../../../../lib/push/redis";
import { CK } from "../../../../lib/comments/redis-keys";
import type { Comment } from "../../../../lib/comments/types";
import { sendMail } from "../../../../lib/email";

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

  // Email 通知（Resend）
  if (c) {
    const subject = autoDeleted
      ? `🚨 コメント自動削除 (通報 ${n} 件)`
      : `⚠️ コメント通報 (${n} 件目)`;
    const snippet = c.text.length > 500 ? c.text.slice(0, 500) + "…" : c.text;
    const mailText = [
      autoDeleted
        ? `通報が ${n} 件に達したため自動削除しました。`
        : `通報数: ${n} 件目`,
      "",
      `コメントID: ${id}`,
      `試合ID: ${c.matchId}`,
      `投稿者: ${c.nick} (userId: ${c.userId})`,
      `投稿時刻: ${new Date(c.createdAt).toISOString()}`,
      "",
      "── コメント本文 ──",
      snippet,
    ].join("\n");
    void sendMail({ subject, text: mailText }).catch(() => {
      // best effort
    });
  }

  return NextResponse.json({ ok: true, reportCount: n, autoDeleted });
}
