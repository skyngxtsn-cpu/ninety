export type StoredSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type SubscribeRequest = {
  subscription: StoredSubscription;
  matchIds: string[];
};

export type UnsubscribeRequest = {
  endpoint: string;
};

export type SyncRequest = {
  subscription: StoredSubscription;
  matchIds: string[];
};
