import { NextResponse } from "next/server";
import { redis } from "../../../lib/push/redis";
import { sendMail } from "../../../lib/email";

export const runtime = "nodejs";

type LogErrorRequest = {
  message?: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
};

const RATE_LIMIT_SEC = 30; // 同一 userId は 30 秒間隔で 1 件まで（保存）
const MAIL_DEDUP_SEC = 60 * 60; // 同一メッセージのメール通知は 1 時間 1 回まで
const TTL_DAYS = 7;
const MAX_LEN = 4000;

/** Gmail にゴミを溜めないよう、エラーキーをハッシュ化（短く） */
async function hashKey(s: string): Promise<string> {
  const enc = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf).slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: Request) {
  let body: LogErrorRequest;
  try {
    body = (await req.json()) as LogErrorRequest;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const message = (body.message ?? "").trim();
  if (!message) return NextResponse.json({ ok: true, skipped: true });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userId = body.userId ?? `ip-${ip}`;

  // ユーザー単位 30 秒レート制限（Redis 保存量を抑える）
  const rateKey = `err:rate:${userId}`;
  const last = await redis.get(rateKey);
  if (last) {
    return NextResponse.json({ ok: true, throttled: true });
  }
  await redis.set(rateKey, "1", { ex: RATE_LIMIT_SEC });

  const now = Date.now();
  const id = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  const entry = {
    id,
    message: message.slice(0, MAX_LEN),
    stack: (body.stack ?? "").slice(0, MAX_LEN),
    url: body.url ?? "",
    userAgent: body.userAgent ?? req.headers.get("user-agent") ?? "",
    userId,
    createdAt: new Date(now).toISOString(),
  };

  // Redis 保存（7日）
  await redis.set(`err:${id}`, JSON.stringify(entry), {
    ex: TTL_DAYS * 24 * 60 * 60,
  });
  await redis.zadd(`err:index`, { score: now, member: id });

  // メール通知：同一エラー（message + 1st stack line）は 1 時間 1 通まで
  // → 1000 ユーザーが同じバグ踏んでも Gmail に 1 通しか来ない
  const firstStack = entry.stack.split("\n")[1]?.trim() ?? "";
  const errSig = await hashKey(`${entry.message}|${firstStack}`);
  const mailKey = `err:mailed:${errSig}`;
  const already = await redis.get(mailKey);

  if (!already) {
    await redis.set(mailKey, "1", { ex: MAIL_DEDUP_SEC });
    const subject = `🐛 ${entry.message.slice(0, 80)}`;
    const mailText = [
      `エラーID: ${id}`,
      `発生時刻: ${entry.createdAt}`,
      `URL: ${entry.url || "(unknown)"}`,
      `userId: ${entry.userId}`,
      `UA: ${entry.userAgent.slice(0, 200)}`,
      "",
      "── メッセージ ──",
      entry.message,
      "",
      entry.stack ? "── スタック（先頭8行）──\n" + entry.stack.split("\n").slice(0, 8).join("\n") : "(stack なし)",
      "",
      `※ 同一エラーは 1 時間 1 通まで（次回通知: ${new Date(now + MAIL_DEDUP_SEC * 1000).toLocaleString("ja-JP")} 以降）`,
    ].join("\n");
    void sendMail({ subject, text: mailText }).catch(() => {
      // best effort
    });
  }

  return NextResponse.json({ ok: true, id });
}
