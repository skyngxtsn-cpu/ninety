import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/cron/dispatch
 *
 * 外部 cron サービス（cron-job.org など）から 5 分間隔で叩かれて、
 * GitHub Actions の fetch-lineups と push-tick の両ワークフローを起動する。
 *
 * GitHub Actions の schedule cron は free tier では 3 時間以上スキップされる
 * ことが多く、W 杯中の試合結果反映・通知に致命的なため、外部からの
 * workflow_dispatch でカバーする。
 *
 * 必須環境変数:
 *   - GITHUB_PAT: repo + workflow scope の personal access token
 *   - CRON_SECRET: ?secret=... で照合する任意のトークン（漏洩対策）
 *
 * 使い方（cron-job.org 等で）:
 *   GET https://ninety-sand.vercel.app/api/cron/dispatch?secret=YOUR_SECRET
 *   5 分ごと
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET 未設定" },
      { status: 500 },
    );
  }
  if (secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    return NextResponse.json(
      { error: "GITHUB_PAT 未設定" },
      { status: 500 },
    );
  }

  const repo = "skyngxtsn-cpu/ninety";
  const workflows = ["fetch-lineups.yml", "push-tick.yml"];

  const results = await Promise.all(
    workflows.map(async (wf) => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${repo}/actions/workflows/${wf}/dispatches`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${pat}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ref: "main" }),
          },
        );
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          return { workflow: wf, ok: false, status: res.status, body: t.slice(0, 200) };
        }
        return { workflow: wf, ok: true, status: res.status };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { workflow: wf, ok: false, error: msg };
      }
    }),
  );

  const allOk = results.every((r) => r.ok);
  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 502 });
}
