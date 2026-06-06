import { NextResponse } from "next/server";
import webpush from "web-push";
import { K, redis } from "../../../../lib/push/redis";
import type { StoredSubscription } from "../../../../lib/push/types";
import { getAllMatches, getAllTeams } from "../../../../lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GitHub Actions が 5 分ごとに叩くエンドポイント。
 * Authorization: Bearer ${TICK_SECRET} ヘッダで保護。
 *
 * 動作:
 *   1. 現在から 15±2.5 分後にキックオフする試合を抽出
 *   2. すでに送信済みフラグ（match:{id}:fired）が立っているものは除外
 *   3. その試合の購読者全員にプッシュ
 *   4. 送信済みフラグを 2 時間 TTL で立てる
 */
export async function POST(req: Request) {
  // 認証
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.TICK_SECRET ?? ""}`;
  if (!process.env.TICK_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // VAPID 設定
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

  const now = Date.now();
  // 15分 ±5分 のウィンドウ（cron が5分刻みなので前後余裕を取る）
  const minOffsetMs = 12.5 * 60 * 1000;
  const maxOffsetMs = 17.5 * 60 * 1000;

  const [matches, teams] = await Promise.all([getAllMatches(), getAllTeams()]);
  const teamById = new Map(teams.map((t) => [t.id, t]));

  const candidates = matches.filter((m) => {
    const t = new Date(m.kickoffJST).getTime();
    const diff = t - now;
    return diff >= minOffsetMs && diff <= maxOffsetMs;
  });

  const results: Array<{
    matchId: string;
    pushed: number;
    failed: number;
    skipped?: boolean;
  }> = [];

  for (const m of candidates) {
    const mid = m.id;
    // 重複送信ガード
    const already = await redis.get(K.matchFired(mid));
    if (already) {
      results.push({ matchId: mid, pushed: 0, failed: 0, skipped: true });
      continue;
    }

    // この試合の購読者一覧
    const subHashes = await redis.smembers<string[]>(K.matchSubs(mid));
    if (!subHashes || subHashes.length === 0) {
      // 送信先なし。fired は立てないでおく（次の tick で誰か購読してくれば送れる）
      results.push({ matchId: mid, pushed: 0, failed: 0 });
      continue;
    }

    // プッシュ payload
    const home = teamById.get(m.homeTeamId);
    const away = teamById.get(m.awayTeamId);
    const title = `まもなく ${home?.shortName ?? m.homeTeamId} × ${away?.shortName ?? m.awayTeamId}`;
    const kickoff = new Date(m.kickoffJST);
    const hh = kickoff.getHours().toString().padStart(2, "0");
    const mm = kickoff.getMinutes().toString().padStart(2, "0");
    const body = `${hh}:${mm} JST キックオフ — ${m.stage}`;
    const payload = JSON.stringify({
      title,
      body,
      url: `/matches/${mid}`,
      matchId: mid,
      tag: `match-${mid}`,
    });

    let pushed = 0;
    let failed = 0;
    for (const h of subHashes) {
      const subRaw = await redis.get<string>(K.sub(h));
      if (!subRaw) {
        // ゴミ参照、削除
        await redis.srem(K.matchSubs(mid), h);
        continue;
      }
      let sub: StoredSubscription;
      try {
        sub = typeof subRaw === "string" ? JSON.parse(subRaw) : subRaw;
      } catch {
        await redis.srem(K.matchSubs(mid), h);
        continue;
      }
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payload,
        );
        pushed += 1;
      } catch (e) {
        failed += 1;
        // 410 Gone / 404 → 購読を完全に削除
        const status = (e as { statusCode?: number })?.statusCode;
        if (status === 410 || status === 404) {
          // 全リマインドからこの sub を削除
          const matches = await redis.smembers<string[]>(K.subMatches(h));
          const pipe = redis.pipeline();
          for (const mm of matches ?? []) {
            pipe.srem(K.matchSubs(mm), h);
          }
          pipe.del(K.subMatches(h));
          pipe.del(K.sub(h));
          await pipe.exec();
        }
      }
    }

    // 送信済みフラグ（2時間で自動失効）
    await redis.set(K.matchFired(mid), "1", { ex: 7200 });
    results.push({ matchId: mid, pushed, failed });
  }

  return NextResponse.json({
    ok: true,
    now: new Date(now).toISOString(),
    candidates: candidates.length,
    results,
  });
}
