"use client";

import {
  DEFAULT_PREFERENCES,
  type NotificationPreferences,
} from "./push/notification-types";
import { usePersistedState } from "./usePersistedState";

const PREF_KEY = "ninety.notificationPrefs";
const SPOILER_KEY = "ninety.spoilerBlock";
const ONBOARD_KEY = "ninety.onboardingDone";
const DEV_KEY = "ninety.developerMode";

export function useNotificationPreferences(): {
  prefs: NotificationPreferences;
  setPrefs: (next: NotificationPreferences | ((p: NotificationPreferences) => NotificationPreferences)) => void;
  hydrated: boolean;
} {
  const [prefs, setPrefs, hydrated] = usePersistedState<NotificationPreferences>(
    PREF_KEY,
    DEFAULT_PREFERENCES,
  );
  return { prefs, setPrefs, hydrated };
}

export function useSpoilerBlock(): {
  blocked: boolean;
  setBlocked: (b: boolean) => void;
  hydrated: boolean;
} {
  const [blocked, setBlocked, hydrated] = usePersistedState<boolean>(
    SPOILER_KEY,
    false,
  );
  return { blocked, setBlocked, hydrated };
}

export function useOnboardingDone(): {
  done: boolean;
  setDone: (b: boolean) => void;
  hydrated: boolean;
} {
  const [done, setDone, hydrated] = usePersistedState<boolean>(
    ONBOARD_KEY,
    false,
  );
  return { done, setDone, hydrated };
}

/**
 * 開発者モード。隠し機能（テスト通知ボタンなど）を表示する。
 * /settings のバージョン表示を 5 回タップで unlock、
 * 同画面の「開発者モード」トグルで自由に ON/OFF。
 */
export function useDeveloperMode(): {
  on: boolean;
  setOn: (b: boolean) => void;
  hydrated: boolean;
} {
  const [on, setOn, hydrated] = usePersistedState<boolean>(DEV_KEY, false);
  return { on, setOn, hydrated };
}
