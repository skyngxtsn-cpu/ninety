/**
 * 試合別コメントスレッド + リアクションの共通型。
 */

export type Comment = {
  id: string;
  matchId: string;
  userId: string;
  nick: string;
  /** 推しチーム旗（投稿時点でのスナップショット、表示用） */
  flag?: string;
  text: string;
  /** 試合開始からの経過分（試合中なら "+45" みたいな表示用） */
  createdAt: number; // unix ms
};

export const REACTION_EMOJIS = ["❤️", "⚡", "💥", "😂", "👀"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export type ReactionCounts = Record<ReactionEmoji, number>;
export type UserReactions = Record<ReactionEmoji, boolean>; // 自分が押してるか

export type CommentsResponse = {
  comments: Comment[];
  reactions: ReactionCounts;
  /** リクエスト時の since カーソル（次回のリクエストにそのまま渡す） */
  cursor: number;
};

export type CreateCommentRequest = {
  userId: string;
  nick: string;
  flag?: string;
  text: string;
};

export type ReactRequest = {
  userId: string;
  emoji: ReactionEmoji;
};
