"use client";

import { useEffect, useState } from "react";

/**
 * localStorage に値を保存・復元するための小さなフック。
 * SSRとマウント前は initial を返し、マウント後に localStorage の値で上書きする。
 */
export function usePersistedState<T>(
  key: string,
  initial: T
): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated];
}
