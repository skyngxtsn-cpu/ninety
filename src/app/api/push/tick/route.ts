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
  buildTournamentPayload,
  type NotificationPayload,
} from "../../../../lib/push/payload";
import { getAllMatches, getAllTeams } from "../../../../lib/data";
import { getBracketMatches } from "../../../../lib/data/bracket";
import { TIER1_TEAM_IDS } from "../../../../lib/push/tier1";
import type { Match, Team } from "../../../../lib/types";
import lineupAutoRaw from "../../../../lib/data/lineup-overrides-auto.json";

type AutoLineupEntry = { fetchedAt?: string };
const lineupAuto = lineupAutoRaw as Record<string, AutoLineupEntry>;

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

  // 3. トーナメント次戦カード確定通知
  const matchById = new Map(matches.map((m) => [m.id, m]));
  results["tournament"] = await processTournament(teamById, matchById, now);

  // 4. スタメン発表通知（lineup-overrides-auto.json の fetchedAt から検知）
  results["lineup"] = await processLineup(matches, teamById, now);

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

  // 候補対象の購読者を集める：
  //   - 今日 / 明日 のいずれかにチームの試合がある fav 購読者
  //   - 今日終了 OR 明日キックオフ の試合いずれにも該当しなければスキップ
  const candidateTeamIds = new Set<string>();
  for (const t of todays) {
    candidateTeamIds.add(t.homeTeamId);
    candidateTeamIds.add(t.awayTeamId);
  }
  for (const t of tomorrows) {
    candidateTeamIds.add(t.homeTeamId);
    candidateTeamIds.add(t.awayTeamId);
  }
  const allHashes = new Set<string>();
  for (const teamId of candidateTeamIds) {
    const arr = (await redis.smembers<string[]>(K.favSubs(teamId))) ?? [];
    for (const h of arr) allHashes.add(h);
  }

  // 今日終了した「試合」一覧（後で振り返り材料に使う）
  const todayFinished = todays.filter(
    (m) => m.status === "finished" && m.result,
  );

  let sent = 0;
  for (const h of allHashes) {
    const firedKey = K.morningFired(todayJST, h);
    const already = await redis.get(firedKey);
    if (already) continue;

    const favs = (await redis.smembers<string[]>(K.subFavs(h))) ?? [];
    const favSet = new Set(favs);

    // 振り返り = 推しチームの今日試合 + Tier-1 国の今日試合
    const recap = todayFinished
      .filter(
        (m) =>
          favSet.has(m.homeTeamId) ||
          favSet.has(m.awayTeamId) ||
          TIER1_TEAM_IDS.has(m.homeTeamId) ||
          TIER1_TEAM_IDS.has(m.awayTeamId),
      )
      .sort(
        (a, b) =>
          new Date(a.kickoffJST).getTime() - new Date(b.kickoffJST).getTime(),
      );

    // 明日のプレビュー = 推しチームの明日試合
    const preview = tomorrows
      .filter(
        (m) => favSet.has(m.homeTeamId) || favSet.has(m.awayTeamId),
      )
      .sort(
        (a, b) =>
          new Date(a.kickoffJST).getTime() - new Date(b.kickoffJST).getTime(),
      );

    // どちらも空ならスキップ
    if (recap.length === 0 && preview.length === 0) continue;

    // 購読者のネタバレ防止モード状態
    const spoiler = await redis.get<string>(K.subSpoiler(h));
    const spoilerBlock = spoiler === "1";

    const payload = buildDigestPayload({
      todayRecap: recap.map((m) => ({
        match: m,
        home: teamById.get(m.homeTeamId),
        away: teamById.get(m.awayTeamId),
      })),
      tomorrowPreview: preview.map((m) => ({
        match: m,
        home: teamById.get(m.homeTeamId),
        away: teamById.get(m.awayTeamId),
      })),
      forTomorrowJSTDate: tomorrowJST,
      spoilerBlock,
    });
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

/**
 * トーナメント次戦カード確定通知。
 * 両 slot がチーム解決済みになっている KO 試合について、
 * その試合に推しチームが入っている購読者にプッシュ。
 * (matchId, favTeamId) ごとに重複排除。
 */
async function processTournament(
  teamById: Map<string, Team>,
  matchById: Map<string, Match>,
  now: Date,
): Promise<{ processed: number; pushed: number; skipped: number }> {
  const bracket = await getBracketMatches();
  let processed = 0;
  let pushed = 0;
  let skipped = 0;

  for (const bm of bracket) {
    // 両側がチーム解決済みでないとカードは「確定」していない
    if (bm.home.kind !== "team" || bm.away.kind !== "team") continue;
    const homeId = bm.home.teamId;
    const awayId = bm.away.teamId;
    processed += 1;

    // 各チームの推し購読者 → 相手の情報付きで通知
    for (const [favId, oppId] of [
      [homeId, awayId],
      [awayId, homeId],
    ] as const) {
      const subHashes =
        (await redis.smembers<string[]>(K.favSubs(favId))) ?? [];
      if (subHashes.length === 0) continue;

      for (const h of subHashes) {
        // 二重発火防止：マッチ+推しチーム単位
        const firedKey = K.matchFiredType(`${bm.id}_${favId}`, "tournament");
        const already = await redis.get(firedKey);
        if (already) {
          skipped += 1;
          continue;
        }

        // 購読者のネタバレ防止モード状態を取得
        const spoiler = await redis.get<string>(K.subSpoiler(h));
        const spoilerBlock = spoiler === "1";

        // 対応する Match から会場・放送局を取得（fallback で bm から venue 取れる）
        const m = matchById.get(bm.id);
        const payload = buildTournamentPayload({
          bracketMatchId: bm.id,
          favTeam: teamById.get(favId),
          opponent: teamById.get(oppId),
          stage: roundLabel(bm.round),
          kickoffJST: bm.kickoffJST,
          venue: m?.venue ?? bm.venue,
          broadcasts: m?.broadcasts,
          spoilerBlock,
        });

        const r = await sendToSub(h, "tournament", payload, now);
        if (r === "pushed") {
          pushed += 1;
          // 30日 TTL（W杯全期間カバー）
          await redis.set(firedKey, "1", { ex: 30 * 24 * 60 * 60 });
        }
      }
    }
  }

  return { processed, pushed, skipped };
}

/**
 * スタメン発表通知。
 * lineup-overrides-auto.json の各エントリの fetchedAt を見て、
 * 直近 15 分以内に更新されたものを「新スタメン到着」と判定し、
 * 該当試合の購読者（ベルマーク or 推しチーム参戦）にプッシュ。
 * 1 試合につき 1 度だけ発火（fired フラグで重複防止）。
 */
async function processLineup(
  matches: Match[],
  teamById: Map<string, Team>,
  now: Date,
): Promise<{ pushed: number; skipped: number }> {
  const nowMs = now.getTime();
  const windowMs = 15 * 60 * 1000;
  let pushed = 0;
  let skipped = 0;

  const matchById = new Map(matches.map((m) => [m.id, m]));

  for (const [matchId, entry] of Object.entries(lineupAuto)) {
    if (!entry.fetchedAt) continue;
    const fetchedMs = new Date(entry.fetchedAt).getTime();
    if (Number.isNaN(fetchedMs)) continue;
    if (nowMs - fetchedMs > windowMs) continue; // 古いものはスキップ
    const m = matchById.get(matchId);
    if (!m) continue;
    // 試合終了済みは送らない
    if (m.status === "finished") continue;

    const firedKey = K.matchFiredType(matchId, "lineup");
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
    if (allHashes.size === 0) {
      // 送信先なし。fired フラグは立てて再評価しない
      await redis.set(firedKey, "1", { ex: 6 * 60 * 60 });
      continue;
    }

    const payload = buildPayload("lineup", m, home, away);
    for (const h of allHashes) {
      const r = await sendToSub(h, "lineup", payload, now);
      if (r === "pushed") pushed += 1;
    }
    await redis.set(firedKey, "1", { ex: 6 * 60 * 60 });
  }

  return { pushed, skipped };
}

function roundLabel(r: string): string {
  switch (r) {
    case "R32":
      return "ラウンド32";
    case "R16":
      return "ラウンド16";
    case "QF":
      return "準々決勝";
    case "SF":
      return "準決勝";
    case "FINAL":
      return "決勝";
    case "THIRD":
      return "3位決定戦";
    default:
      return r;
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
