"use client";

import { useCallback } from "react";
import { usePersistedState } from "./usePersistedState";

const KEY = "ninety.reminderMatches";

/**
 * 「あとで観たい・リマインドする」試合のID集合を管理する。
 * 推しチーム（useFavoriteTeams）とは独立。
 * 任意の試合をベルでマークでき、後で通知の対象にもできる。
 */
export function useReminderMatches(): {
  matches: string[];
  isReminded: (id: string) => boolean;
  toggle: (id: string) => void;
  hydrated: boolean;
} {
  const [matches, setMatches, hydrated] = usePersistedState<string[]>(KEY, []);

  const isReminded = useCallback(
    (id: string) => matches.includes(id),
    [matches],
  );

  const toggle = useCallback(
    (id: string) => {
      setMatches((cur) =>
        cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
      );
    },
    [setMatches],
  );

  return { matches, isReminded, toggle, hydrated };
}
