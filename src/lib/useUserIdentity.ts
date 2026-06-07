"use client";

import { useCallback, useEffect, useState } from "react";

const USER_ID_KEY = "ninety.userId";
const USER_NICK_KEY = "ninety.userNick";

/** デバイス単位の UUID 生成（uuid 依存無しに簡易実装） */
function makeId(): string {
  // crypto.randomUUID は iOS Safari 15+ で使える
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * ランダムニック生成。推しチームの旗を頭に付ける（あれば）。
 */
const NICK_WORDS = [
  "サムライ",
  "シューター",
  "ハットトリック",
  "ファン",
  "ロスタイム",
  "ニアポスト",
  "ラインブレイカー",
  "サポ",
  "観戦民",
  "テクニシャン",
];

export function generateDefaultNick(flag?: string): string {
  const w = NICK_WORDS[Math.floor(Math.random() * NICK_WORDS.length)];
  const n = Math.floor(Math.random() * 900) + 100;
  return `${flag ?? ""}${w}${n}`.trim();
}

export function useUserIdentity(defaultFlag?: string): {
  userId: string | null;
  nick: string | null;
  hydrated: boolean;
  ensureIdentity: (nickOverride?: string) => { userId: string; nick: string };
  setNick: (next: string) => void;
} {
  const [userId, setUserId] = useState<string | null>(null);
  const [nick, setNickState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const uid = window.localStorage.getItem(USER_ID_KEY);
      const nk = window.localStorage.getItem(USER_NICK_KEY);
      if (uid) setUserId(uid);
      if (nk) setNickState(nk);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const ensureIdentity = useCallback(
    (nickOverride?: string): { userId: string; nick: string } => {
      let uid = userId;
      let nk = nick;
      if (!uid) {
        uid = makeId();
        try {
          window.localStorage.setItem(USER_ID_KEY, uid);
        } catch {}
        setUserId(uid);
      }
      if (!nk || nickOverride) {
        nk = nickOverride ?? generateDefaultNick(defaultFlag);
        try {
          window.localStorage.setItem(USER_NICK_KEY, nk);
        } catch {}
        setNickState(nk);
      }
      return { userId: uid, nick: nk };
    },
    [userId, nick, defaultFlag],
  );

  const setNick = useCallback((next: string) => {
    try {
      window.localStorage.setItem(USER_NICK_KEY, next);
    } catch {}
    setNickState(next);
  }, []);

  return { userId, nick, hydrated, ensureIdentity, setNick };
}
