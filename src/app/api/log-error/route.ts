import { NextResponse } from "next/server";
import { redis } from "../../../lib/push/redis";

export const runtime = "nodejs";

type LogErrorRequest = {
  message?: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
};

const RATE_LIMIT_SEC = 30; // 同一 userId は 30 秒間隔で 1 件まで
const TTL_DAYS = 7;
const MAX_LEN = 4000;

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

  // レート制限：同一 userId は 30 秒間隔
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

  await redis.set(`err:${id}`, JSON.stringify(entry), {
    ex: TTL_DAYS * 24 * 60 * 60,
  });
  await redis.zadd(`err:index`, { score: now, member: id });

  // Discord webhook（オプション）
  const webhookUrl = process.env.FEEDBACK_DISCORD_WEBHOOK;
  if (webhookUrl) {
    const stackSnippet = entry.stack
      ? "\n```\n" + entry.stack.split("\n").slice(0, 4).join("\n").slice(0, 800) + "\n```"
      : "";
    const content = [
      `🐛 **クライアントエラー** \`${id}\``,
      `📍 ${entry.url || "(unknown)"}`,
      `💥 ${entry.message.slice(0, 400)}`,
      stackSnippet,
    ]
      .filter(Boolean)
      .join("\n");
    void fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 1900) }),
    }).catch(() => {
      // best effort
    });
  }

  return NextResponse.json({ ok: true, id });
}
