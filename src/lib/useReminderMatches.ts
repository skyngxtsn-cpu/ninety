"use client";

import { useCallback } from "react";
import { usePersistedState } from "./usePersistedState";
import { useUserIdentity } from "./useUserIdentity";

const KEY = "ninety.reminderMatches";

/**
 * 「お気に入り（観たい）」試合の ID 集合を管理する。
 * 推しチーム（useFavoriteTeams）とは独立。
 *
 * - 個人リストとして localStorage に保存（既存キー流用）
 * - トグル時にサーバーに匿名集計を送る（fire-and-forget）
 *   → 試合カードの「🔥 盛り上がってる」バッジに使う
 */
export function useReminderMatches(): {
  matches: string[];
  isReminded: (id: string) => boolean;
  toggle: (id: string) => void;
  hydrated: boolean;
} {
  const [matches, setMatches, hydrated] = usePersistedState<string[]>(KEY, []);
  const { ensureIdentity } = useUserIdentity();

  const isReminded = useCallback(
    (id: string) => matches.includes(id),
    [matches],
  );

  const toggle = useCallback(
    (id: string) => {
      const watching = !matches.includes(id);
      setMatches((cur) =>
        cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
      );
      // anonymous 集計サーバーに反映（失敗しても UI 影響なし）
      try {
        const ident = ensureIdentity();
        void fetch(`/api/matches/${id}/watching`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: ident.userId, watching }),
        });
      } catch {
        // ignore
      }
    },
    [matches, setMatches, ensureIdentity],
  );

  return { matches, isReminded, toggle, hydrated };
}
