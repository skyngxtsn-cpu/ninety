import { NextResponse } from "next/server";
import webpush from "web-push";
import type { StoredSubscription } from "../../../../lib/push/types";
import type { NotificationType } from "../../../../lib/push/notification-types";
import {
  buildPayload,
  buildResultPayload,
  buildDigestPayload,
  buildTournamentPayload,
  buildGoalPayload,
} from "../../../../lib/push/payload";
import { getAllMatches, getAllTeams } from "../../../../lib/data";

export const runtime = "nodejs";

/**
 * デバッグ用：指定タイプの通知を自分の端末に即送る。
 * フロントから現在の購読オブジェクトと type を渡してもらい、
 * 実データの試合をサンプルとして使った payload を送信する。
 */
export async function POST(req: Request) {
  let body: {
    subscription?: StoredSubscription;
    type?: NotificationType | "default";
  };
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

  // サンプル用：最初の予定試合を拾う
  const [matches, teams] = await Promise.all([getAllMatches(), getAllTeams()]);
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const sample =
    matches.find((m) => m.status !== "finished") ?? matches[0];
  if (!sample) {
    return NextResponse.json({ error: "no sample match" }, { status: 500 });
  }
  const home = teamById.get(sample.homeTeamId);
  const away = teamById.get(sample.awayTeamId);

  const type = body.type ?? "default";

  let payload;
  switch (type) {
    case "pre-3h":
    case "pre-1h":
    case "pre-15m":
    case "lineup":
    case "kickoff":
    case "halftime":
    case "fulltime":
      payload = buildPayload(type, sample, home, away);
      break;
    case "goal":
      payload = buildGoalPayload(
        sample,
        home,
        away,
        1, // テスト用スコア
        0,
        {
          minute: 33,
          injuryTime: null,
          type: "REGULAR",
          team: sample.homeTeamId,
          scorer: "（テスト選手）",
          assist: null,
        },
      );
      break;
    case "result": {
      // テストなので適当なスコアをでっち上げ
      const fake = {
        ...sample,
        result: {
          ...(sample.result ?? {
            whyTrending: "",
            summary30s: "",
            manOfTheMatchId: "",
            nextImplication: "",
          }),
          home: 2,
          away: 1,
        },
      };
      payload = buildResultPayload(fake, home, away);
      break;
    }
    case "tournament":
      payload = buildTournamentPayload({
        bracketMatchId: sample.id,
        favTeam: home,
        opponent: away,
        stage: "準々決勝",
        kickoffJST: sample.kickoffJST,
        venue: sample.venue,
        broadcasts: sample.broadcasts as string[],
        spoilerBlock: false,
      });
      break;
    case "digest": {
      const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const sampleMatches = matches.slice(0, 3).map((m) => ({
        match: m,
        home: teamById.get(m.homeTeamId),
        away: teamById.get(m.awayTeamId),
      }));
      payload = buildDigestPayload({
        todayRecap: [],
        tomorrowPreview: sampleMatches,
        forTomorrowJSTDate: tomorrowDate,
        spoilerBlock: false,
      });
      break;
    }
    default:
      payload = {
        title: "🔔 90 — テスト通知",
        body: "通知の設定は正常に動いています。",
        url: "/reminders",
        tag: "test-notification",
        type: "pre-15m" as NotificationType,
        matchId: "test",
      };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
      },
      JSON.stringify(payload),
    );
    return NextResponse.json({ ok: true, payload });
  } catch (e) {
    const status = (e as { statusCode?: number })?.statusCode;
    const message = (e as { message?: string })?.message;
    return NextResponse.json(
      { error: "send failed", statusCode: status, message },
      { status: 500 },
    );
  }
}
