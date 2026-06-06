"use client";

import { useCallback } from "react";
import { usePersistedState } from "./usePersistedState";

const KEY = "ninety.favoritePlayers";

export function useFavoritePlayers(): {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
  hydrated: boolean;
} {
  const [favorites, setFavorites, hydrated] = usePersistedState<string[]>(KEY, []);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  const toggle = useCallback(
    (id: string) => {
      setFavorites((cur) =>
        cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
      );
    },
    [setFavorites]
  );

  return { favorites, isFavorite, toggle, hydrated };
}
