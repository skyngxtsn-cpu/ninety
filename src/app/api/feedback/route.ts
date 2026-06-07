import { NextResponse } from "next/server";
import { redis } from "../../../lib/push/redis";

export const runtime = "nodejs";

type FeedbackRequest = {
  category: string;
  body: string;
  email?: string;
  userId?: string;
};

const VALID_CATEGORIES = new Set([
  "bug",
  "feature",
  "question",
  "thanks",
  "other",
]);

const RATE_LIMIT_SEC = 60;
const TTL_DAYS = 90;
const MAX_LEN = 2000;

export async function POST(req: Request) {
  let body: FeedbackRequest;
  try {
    body = (await req.json()) as FeedbackRequest;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const text = (body.body ?? "").trim();
  if (!text)
    return NextResponse.json({ error: "本文が空です" }, { status: 400 });
  if (text.length > MAX_LEN)
    return NextResponse.json(
      { error: `本文は${MAX_LEN}文字以内` },
      { status: 400 },
    );
  if (!VALID_CATEGORIES.has(body.category))
    return NextResponse.json({ error: "category が不正" }, { status: 400 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "";
  const userId = body.userId ?? `ip-${ip}`;

  // レート制限：同一 userId は 60 秒間隔
  const rateKey = `feedback:rate:${userId}`;
  const last = await redis.get(rateKey);
  if (last) {
    return NextResponse.json(
      { error: "短時間に何度も送信されています。少し待ってください" },
      { status: 429 },
    );
  }

  const now = Date.now();
  const id = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  const entry = {
    id,
    category: body.category,
    body: text,
    email: (body.email ?? "").trim() || undefined,
    userId: body.userId,
    ip,
    userAgent,
    createdAt: new Date(now).toISOString(),
  };

  await redis.set(`feedback:${id}`, JSON.stringify(entry), {
    ex: TTL_DAYS * 24 * 60 * 60,
  });
  await redis.zadd(`feedback:index`, { score: now, member: id });
  await redis.set(rateKey, "1", { ex: RATE_LIMIT_SEC });

  // Discord webhook（オプション）
  const webhookUrl = process.env.FEEDBACK_DISCORD_WEBHOOK;
  if (webhookUrl) {
    const cat: Record<string, string> = {
      bug: "🐛 バグ報告",
      feature: "💡 改善提案",
      question: "❓ 質問",
      thanks: "❤️ ありがとう",
      other: "📝 その他",
    };
    const content = [
      `**${cat[body.category]}** ［\`${id}\`］`,
      text.length > 500 ? text.slice(0, 500) + "…" : text,
      entry.email ? `📧 ${entry.email}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    void fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 1900) }),
    }).catch(() => {
      // ignore — Discord 通知は best effort
    });
  }

  return NextResponse.json({ ok: true, id });
}
