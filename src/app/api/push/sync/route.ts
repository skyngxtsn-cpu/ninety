import { NextResponse } from "next/server";
import { K, endpointHash, redis } from "../../../../lib/push/redis";
import type { SyncRequest } from "../../../../lib/push/types";

export const runtime = "nodejs";

/**
 * 購読 + リマインド希望試合一覧 + 推しチーム + 通知設定を全部まとめて同期する。
 * クライアントは毎回フルセットを送ってきて、サーバーは差分を計算してインデックスを更新。
 */
export async function POST(req: Request) {
  let body: SyncRequest;
  try {
    body = (await req.json()) as SyncRequest;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const {
    subscription,
    matchIds = [],
    favoriteTeamIds = [],
    preferences,
    spoilerBlock,
  } = body;
  if (!subscription || !subscription.endpoint || !preferences) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const h = await endpointHash(subscription.endpoint);

  // 既存の matches / favs を取得
  const [prevMatchesRaw, prevFavsRaw] = await Promise.all([
    redis.smembers<string[]>(K.subMatches(h)),
    redis.smembers<string[]>(K.subFavs(h)),
  ]);
  const prevMatches = prevMatchesRaw ?? [];
  const prevFavs = prevFavsRaw ?? [];

  const newMatches = new Set(matchIds);
  const newFavs = new Set(favoriteTeamIds);

  const matchesToAdd = matchIds.filter((m) => !prevMatches.includes(m));
  const matchesToRemove = prevMatches.filter((m) => !newMatches.has(m));
  const favsToAdd = favoriteTeamIds.filter((t) => !prevFavs.includes(t));
  const favsToRemove = prevFavs.filter((t) => !newFavs.has(t));

  const pipe = redis.pipeline();

  // 購読本体（JSON 文字列で保存）
  pipe.set(K.sub(h), JSON.stringify(subscription));

  // 通知設定
  pipe.set(K.subPrefs(h), JSON.stringify(preferences));

  // ネタバレ防止モードフラグ
  if (spoilerBlock) {
    pipe.set(K.subSpoiler(h), "1");
  } else {
    pipe.del(K.subSpoiler(h));
  }

  // sub:{h}:matches を完全置換
  pipe.del(K.subMatches(h));
  if (matchIds.length > 0) {
    pipe.sadd(K.subMatches(h), matchIds[0], ...matchIds.slice(1));
  }

  // sub:{h}:favs を完全置換
  pipe.del(K.subFavs(h));
  if (favoriteTeamIds.length > 0) {
    pipe.sadd(K.subFavs(h), favoriteTeamIds[0], ...favoriteTeamIds.slice(1));
  }

  // match→subs index 更新
  for (const m of matchesToAdd) pipe.sadd(K.matchSubs(m), h);
  for (const m of matchesToRemove) pipe.srem(K.matchSubs(m), h);

  // fav→subs index 更新
  for (const t of favsToAdd) pipe.sadd(K.favSubs(t), h);
  for (const t of favsToRemove) pipe.srem(K.favSubs(t), h);

  await pipe.exec();

  return NextResponse.json({
    ok: true,
    endpointHash: h,
    matches: { total: matchIds.length, added: matchesToAdd.length, removed: matchesToRemove.length },
    favorites: { total: favoriteTeamIds.length, added: favsToAdd.length, removed: favsToRemove.length },
  });
}
