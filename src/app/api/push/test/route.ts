import { NextResponse } from "next/server";
import webpush from "web-push";
import type { StoredSubscription } from "../../../../lib/push/types";

export const runtime = "nodejs";

/**
 * デバッグ用：自分の端末に即座にプッシュ通知を送る。
 * フロントから現在の購読オブジェクトをそのまま渡してもらい、その endpoint に対して送信する。
 */
export async function POST(req: Request) {
  let body: { subscription?: StoredSubscription };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const sub = body.subscription;
  if (!sub || !sub.endpoint || !sub.keys) {
    return NextResponse.json({ error: "missing subscription" }, { status: 400 });
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:noreply@example.com";
  if (!publicKey || !privateKey) {
    return NextResponse.json(
      { error: "VAPID keys not configured" },
      { status: 500 },
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const payload = JSON.stringify({
    title: "🔔 90 — テスト通知",
    body: "通知の設定は正常に動いています。試合15分前にこのようなお知らせが届きます。",
    url: "/reminders",
    tag: "test-notification",
  });

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
      },
      payload,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = (e as { statusCode?: number })?.statusCode;
    const message = (e as { body?: string; message?: string })?.message;
    return NextResponse.json(
      { error: "send failed", statusCode: status, message },
      { status: 500 },
    );
  }
}
