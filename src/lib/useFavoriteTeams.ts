"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "ninety.favoriteTeams";
const LEGACY_KEY = "ninety.favoriteTeam"; // 旧: 単一文字列
const COOKIE_NAME = "ninety_fav";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1年

function readLocal(): string[] | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function readLegacy(): string | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (raw === null) return null;
    return JSON.parse(raw) as string;
  } catch {
    return null;
  }
}

function writeCookie(teams: string[]) {
  if (typeof document === "undefined") return;
  const value = teams.join(",");
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

/**
 * 推しチーム複数選択フック。
 * - localStorage `ninety.favoriteTeams: string[]` が source of truth
 * - 旧キー `ninety.favoriteTeam` (単一文字列) からの自動マイグレーション
 * - 変更時は Cookie `ninety_fav` にも同期（SSR で初回描画から個別化するため）
 */
export function useFavoriteTeams(): {
  teams: string[];
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
  set: (ids: string[]) => void;
  clear: () => void;
  hydrated: boolean;
} {
  const [teams, setTeamsState] = useState<string[]>(["jpn"]);
  const [hydrated, setHydrated] = useState(false);

  // 起動時に localStorage を読む + マイグレ
  useEffect(() => {
    const fromNew = readLocal();
    if (fromNew !== null) {
      setTeamsState(fromNew);
      writeCookie(fromNew);
      setHydrated(true);
      return;
    }
    const legacy = readLegacy();
    if (legacy && typeof legacy === "string") {
      const migrated = [legacy];
      try {
        window.localStorage.setItem(KEY, JSON.stringify(migrated));
        window.localStorage.removeItem(LEGACY_KEY);
      } catch {
        /* ignore */
      }
      setTeamsState(migrated);
      writeCookie(migrated);
      setHydrated(true);
      return;
    }
    // 何も無い → デフォルト ["jpn"]
    writeCookie(["jpn"]);
    setHydrated(true);
  }, []);

  const persist = useCallback((next: string[]) => {
    setTeamsState(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    writeCookie(next);
  }, []);

  const isFavorite = useCallback(
    (id: string) => teams.includes(id),
    [teams],
  );

  const toggle = useCallback(
    (id: string) => {
      persist(teams.includes(id) ? teams.filter((x) => x !== id) : [...teams, id]);
    },
    [teams, persist],
  );

  const set = useCallback(
    (ids: string[]) => {
      persist(Array.from(new Set(ids)));
    },
    [persist],
  );

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  return { teams, isFavorite, toggle, set, clear, hydrated };
}

export const FAVORITE_TEAMS_COOKIE = COOKIE_NAME;
