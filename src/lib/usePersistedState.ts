"use client";

import { useEffect, useState } from "react";

/**
 * localStorage に値を保存・復元するための小さなフック。
 * SSRとマウント前は initial を返し、マウント後に localStorage の値で上書きする。
 *
 * 同タブ内で同一キーを使っている別コンポーネントにも変更が伝播するよう、
 * グローバルなリスナーレジストリを持つ pub/sub を内蔵。
 * （localStorage の "storage" イベントは異なるタブ間でしか発火しないため自前で実装）
 */

type Listener<T> = (next: T) => void;

const listeners = new Map<string, Set<Listener<unknown>>>();

function emit<T>(key: string, value: T): void {
  const set = listeners.get(key);
  if (!set) return;
  for (const fn of set) (fn as Listener<T>)(value);
}

function subscribe<T>(key: string, fn: Listener<T>): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(fn as Listener<unknown>);
  return () => {
    set!.delete(fn as Listener<unknown>);
  };
}

export function usePersistedState<T>(
  key: string,
  initial: T,
): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  // mount 時: localStorage から読み込み + リスナー登録
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
    const unsub = subscribe<T>(key, (next) => setValue(next));
    return unsub;
  }, [key]);

  // value 変更時: localStorage 書き込み + 他リスナーに通知
  // ただし他リスナーから通知されてきた更新でループしないように、
  // 書き込み前後の比較ではなく「ユーザー setter から来たもの」だけ emit する。
  const setAndBroadcast = (next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const computed =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(computed));
      } catch {
        // ignore
      }
      // 他インスタンスに通知（自分の setValue は React のバッチで既に走るのでスキップでも良いが
      // listener Set には自分も含まれている。ここでは無条件 emit し、emit 側で自分も
      // setValue(computed) するので React は同値で no-op、無限ループにはならない）
      emit(key, computed);
      return computed;
    });
  };

  return [value, setAndBroadcast, hydrated];
}
