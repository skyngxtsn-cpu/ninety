import type { NotificationPreferences } from "./notification-types";

export type StoredSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type SyncRequest = {
  subscription: StoredSubscription;
  /** ベルでマークした試合 ID 一覧 */
  matchIds: string[];
  /** 推しチーム ID 一覧（このチームの全試合が自動で通知対象になる） */
  favoriteTeamIds: string[];
  /** 通知設定 */
  preferences: NotificationPreferences;
  /** ネタバレ防止モード ON なら result 通知は強制 OFF */
  spoilerBlock: boolean;
};

export type UnsubscribeRequest = {
  endpoint: string;
};
