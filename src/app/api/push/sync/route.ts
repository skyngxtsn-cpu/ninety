import { NextResponse } from "next/server";
import { K, endpointHash, redis } from "../../../../lib/push/redis";
import type { SyncRequest } from "../../../../lib/push/types";

export const runtime = "nodejs";

/**
 * 購読 + リマインド希望試合一覧を同期する。
 * クライアントは「いま自分がベルでマークしている試合のID一覧」を毎回送ってくる。
 * サーバーは差分を計算して match → subs / sub → matches のセットを更新。
 */
export async function POST(req: Request) {
  let body: SyncRequest;
  try {
    body = (await req.json()) as SyncRequest;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { subscription, matchIds } = body;
  if (!subscription || !subscription.endpoint || !Array.isArray(matchIds)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const h = await endpointHash(subscription.endpoint);
  const newSet = new Set(matchIds);

  // 既存の購読情報を取得
  const prevMatches = await redis.smembers<string[]>(K.subMatches(h));
  const prevSet = new Set(prevMatches ?? []);

  // 差分を計算
  const toAdd = matchIds.filter((m) => !prevSet.has(m));
  const toRemove = (prevMatches ?? []).filter((m) => !newSet.has(m));

  // パイプラインで一括実行
  const pipe = redis.pipeline();

  // subscription 本体を保存（上書き）
  pipe.set(K.sub(h), JSON.stringify(subscription));

  // sub:{h}:matches を完全に置き換え
  pipe.del(K.subMatches(h));
  if (matchIds.length > 0) {
    pipe.sadd(K.subMatches(h), matchIds[0], ...matchIds.slice(1));
  }

  // match→subs の双方向 index を更新
  for (const m of toAdd) {
    pipe.sadd(K.matchSubs(m), h);
  }
  for (const m of toRemove) {
    pipe.srem(K.matchSubs(m), h);
  }

  await pipe.exec();

  return NextResponse.json({
    ok: true,
    endpointHash: h,
    added: toAdd.length,
    removed: toRemove.length,
    total: matchIds.length,
  });
}
