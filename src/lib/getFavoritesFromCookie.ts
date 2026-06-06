import { cookies } from "next/headers";

const COOKIE_NAME = "ninety_fav";
const DEFAULT_TEAMS = ["jpn"];

/**
 * SSR で推しチームを取得。Cookie が空 or 不正 ならデフォルト ["jpn"]。
 * クライアント側は `useFavoriteTeams` の localStorage が source of truth、
 * ここはあくまで初回描画用のシャドウ。
 */
export async function getFavoriteTeamsFromCookie(): Promise<string[]> {
  try {
    const c = (await cookies()).get(COOKIE_NAME)?.value;
    if (!c) return DEFAULT_TEAMS;
    const decoded = decodeURIComponent(c);
    const parts = decoded.split(",").filter(Boolean);
    return parts.length > 0 ? parts : [];
  } catch {
    return DEFAULT_TEAMS;
  }
}
