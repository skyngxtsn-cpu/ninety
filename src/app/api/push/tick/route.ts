import { NextResponse } from "next/server";
import webpush from "web-push";
import { K, redis } from "../../../../lib/push/redis";
import type { StoredSubscription } from "../../../../lib/push/types";
import {
  type NotificationType,
  type NotificationPreferences,
  OFFSET_MINUTES,
  TICK_WINDOW_MINUTES,
  DEFAULT_PREFERENCES,
  isTypeEnabled,
} from "../../../../lib/push/notification-types";
import { isInQuietHours } from "../../../../lib/push/quiet-hours";
import {
  buildPayload,
  buildResultPayload,
  buildDigestPayload,
  type NotificationPayload,
} from "../../../../lib/push/payload";
import { getAllMatches, getAllTeams } from "../../../../lib/data";
import type { Match, Team } from "../../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GitHub Actions が 5 分ごとに叩くエンドポイント。
 * Authorization: Bearer ${TICK_SECRET} で保護。
 *
 * 全 NotificationType について発火条件をチェックし、購読者に配信。
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.TICK_SECRET ?? ""}`;
  if (!process.env.TICK_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

  const now = new Date();
  const [matches, teams] = await Promise.all([getAllMatches(), getAllTeams()]);
  const teamById = new Map(teams.map((t) => [t.id, t]));

  // 1. 試合関連の通知タイプ（オフセット定義済み）を処理
  const offsetTypes: NotificationType[] = [
    "pre-3h",
    "pre-1h",
    "pre-15m",
    "kickoff",
    "halftime",
    "fulltime",
    "result",
  ];
  const results: Record<string, unknown> = {};
  for (const type of offsetTypes) {
    results[type] = await processOffsetType(type, matches, teamById, now);
  }

  // 2. 1日の終わりダイジェスト：今日の最終試合終了から30分後 ±2.5分
  results["digest"] = await processDigest(matches, teamById, now);

  return NextResponse.json({
    ok: true,
    now: now.toISOString(),
    results,
  });
}

// ============= 各タイプ処理 =============

/** 試合のキックオフ + オフセットで発火する系の処理 */
async function processOffsetType(
  type: NotificationType,
  matches: Match[],
  teamById: Map<string, Team>,
  now: Date,
): Promise<{ candidates: number; pushed: number; failed: number; skipped: number }> {
  const offset = OFFSET_MINUTES[type];
  if (offset === null) return { candidates: 0, pushed: 0, failed: 0, skipped: 0 };
  const offsetMs = offset * 60 * 1000;
  const windowMs = TICK_WINDOW_MINUTES * 60 * 1000;

  const candidates = matches.filter((m) => {
    const target = new Date(m.kickoffJST).getTime() + offsetMs;
    const diff = target - now.getTime();
    return diff >= -windowMs && diff <= windowMs;
  });

  // result タイプは結果が確定している試合だけ
  const filtered =
    type === "result"
      ? candidates.filter((m) => m.status === "finished" && m.result)
      : candidates;

  let pushed = 0;
  let failed = 0;
  let skipped = 0;

  for (const m of filtered) {
    const firedKey = K.matchFiredType(m.id, type);
    const already = await redis.get(firedKey);
    if (already) {
      skipped += 1;
      continue;
    }

    // 配信対象を集める：ベルマーク経由 + 推しチーム経由
    const home = teamById.get(m.homeTeamId);
    const away = teamById.get(m.awayTeamId);
    const [bellHashes, favHomeHashes, favAwayHashes] = await Promise.all([
      redis.smembers<string[]>(K.matchSubs(m.id)),
      redis.smembers<string[]>(K.favSubs(m.homeTeamId)),
      redis.smembers<string[]>(K.favSubs(m.awayTeamId)),
    ]);
    const allHashes = new Set<string>([
      ...(bellHashes ?? []),
      ...(favHomeHashes ?? []),
      ...(favAwayHashes ?? []),
    ]);
    if (allHashes.size === 0) continue;

    const payload =
      type === "result"
        ? buildResultPayload(m, home, away)
        : buildPayload(type, m, home, away);

    for (const h of allHashes) {
      const r = await sendToSub(h, type, payload, now);
      if (r === "pushed") pushed += 1;
      else if (r === "failed") failed += 1;
    }

    await redis.set(firedKey, "1", { ex: 6 * 60 * 60 }); // 6h TTL
  }

  return { candidates: filtered.length, pushed, failed, skipped };
}

/**
 * 1日の最終試合終了 + 30分後 ±2.5分 に、各購読者の推しチームの
 * 「明日の試合」をまとめてプレビュー送信する。
 *
 * - 「今日」と「明日」は JST 基準。
 * - 最終キックオフ + 110分（標準試合長）+ 30分 = 最後の試合終了から30分後を発火時刻とする。
 * - その時刻が来たら、各購読者の推しチームが明日プレイする試合をまとめて送信。
 * - 明日試合が無い人にはスキップ。
 */
async function processDigest(
  matches: Match[],
  teamById: Map<string, Team>,
  now: Date,
): Promise<{ runs: boolean; sent: number; reason?: string }> {
  // JST の本日（now の現在 JST 年月日）
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayJST = jstNow.toISOString().slice(0, 10);

  // 今日キックオフがある試合
  const todays = matches.filter((m) => {
    const k = new Date(m.kickoffJST);
    const jk = new Date(k.getTime() + 9 * 60 * 60 * 1000);
    return jk.toISOString().slice(0, 10) === todayJST;
  });

  if (todays.length === 0) {
    return { runs: false, sent: 0, reason: "no matches today" };
  }

  // 今日の最終キックオフ時刻 + 110min(試合終了) + 30min(余裕) = 発火時刻
  const lastKickoff = Math.max(
    ...todays.map((m) => new Date(m.kickoffJST).getTime()),
  );
  const triggerMs = lastKickoff + 110 * 60 * 1000 + 30 * 60 * 1000;
  const windowMs = TICK_WINDOW_MINUTES * 60 * 1000;
  const diff = triggerMs - now.getTime();
  if (Math.abs(diff) > windowMs) {
    return { runs: false, sent: 0, reason: "not yet (or already past window)" };
  }

  // 明日 JST の年月日
  const tomorrowJST = new Date(jstNow.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const tomorrows = matches.filter((m) => {
    const k = new Date(m.kickoffJST);
    const jk = new Date(k.getTime() + 9 * 60 * 60 * 1000);
    return jk.toISOString().slice(0, 10) === tomorrowJST;
  });

  // 明日試合をしうる全チームの fav 購読者を集める
  const favHashesByTeam = new Map<string, string[]>();
  for (const t of tomorrows) {
    for (const teamId of [t.homeTeamId, t.awayTeamId]) {
      if (!favHashesByTeam.has(teamId)) {
        const arr = (await redis.smembers<string[]>(K.favSubs(teamId))) ?? [];
        favHashesByTeam.set(teamId, arr);
      }
    }
  }
  const allHashes = new Set<string>();
  for (const arr of favHashesByTeam.values()) {
    for (const h of arr) allHashes.add(h);
  }

  let sent = 0;
  for (const h of allHashes) {
    const firedKey = K.morningFired(todayJST, h); // key名は流用（YYYY-MM-DD単位の重複防止）
    const already = await redis.get(firedKey);
    if (already) continue;

    const favs = (await redis.smembers<string[]>(K.subFavs(h))) ?? [];
    const favSet = new Set(favs);
    const myTomorrows = tomorrows.filter(
      (m) => favSet.has(m.homeTeamId) || favSet.has(m.awayTeamId),
    );
    if (myTomorrows.length === 0) continue;

    const payload = buildDigestPayload(
      myTomorrows.map((m) => ({
        match: m,
        home: teamById.get(m.homeTeamId),
        away: teamById.get(m.awayTeamId),
      })),
      tomorrowJST,
    );
    const r = await sendToSub(h, "digest", payload, now);
    if (r === "pushed") {
      sent += 1;
      await redis.set(firedKey, "1", { ex: 25 * 60 * 60 });
    }
  }

  return { runs: true, sent };
}

// ============= sub への送信 =============

async function sendToSub(
  h: string,
  type: NotificationType,
  payload: NotificationPayload,
  now: Date,
): Promise<"pushed" | "failed" | "skipped"> {
  // 設定を取得
  const [subRaw, prefsRaw, spoiler] = await Promise.all([
    redis.get<string>(K.sub(h)),
    redis.get<string>(K.subPrefs(h)),
    redis.get<string>(K.subSpoiler(h)),
  ]);
  if (!subRaw) {
    // ゴミ参照、ベル・推し全 index から削除しておく
    await cleanupSub(h);
    return "skipped";
  }
  const sub: StoredSubscription =
    typeof subRaw === "string" ? JSON.parse(subRaw) : (subRaw as unknown as StoredSubscription);

  let prefs: NotificationPreferences = DEFAULT_PREFERENCES;
  if (prefsRaw) {
    try {
      prefs = typeof prefsRaw === "string" ? JSON.parse(prefsRaw) : (prefsRaw as unknown as NotificationPreferences);
    } catch {
      prefs = DEFAULT_PREFERENCES;
    }
  }
  const spoilerBlock = spoiler === "1";

  // タイプが許可されているか
  if (!isTypeEnabled(type, prefs, spoilerBlock)) return "skipped";

  // 静寂時間ならサイレント
  const quiet = isInQuietHours(now, prefs.quiet);

  try {
    const body = JSON.stringify({ ...payload, silent: quiet });
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
      },
      body,
      quiet ? { TTL: 6 * 60 * 60, urgency: "low" } : undefined,
    );
    return "pushed";
  } catch (e) {
    const status = (e as { statusCode?: number })?.statusCode;
    if (status === 410 || status === 404) {
      await cleanupSub(h);
    }
    return "failed";
  }
}

async function cleanupSub(h: string): Promise<void> {
  const [matches, favs] = await Promise.all([
    redis.smembers<string[]>(K.subMatches(h)),
    redis.smembers<string[]>(K.subFavs(h)),
  ]);
  const pipe = redis.pipeline();
  for (const m of matches ?? []) pipe.srem(K.matchSubs(m), h);
  for (const t of favs ?? []) pipe.srem(K.favSubs(t), h);
  pipe.del(K.subMatches(h));
  pipe.del(K.subFavs(h));
  pipe.del(K.subPrefs(h));
  pipe.del(K.subSpoiler(h));
  pipe.del(K.sub(h));
  await pipe.exec();
}
