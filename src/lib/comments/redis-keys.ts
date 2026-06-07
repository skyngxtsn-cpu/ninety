/**
 * Redis キー命名規約（コメント機能用）。
 *
 *  match:{matchId}:comments        SORTED SET ts→commentId
 *  comment:{commentId}             JSON (Comment)
 *  match:{matchId}:react:{emoji}   SET<userId>
 *  user:{userId}:lastpost          STRING ts (レート制限)
 *  user:{userId}:nick              STRING (現在のニック、表示時の上書き用)
 *  report:{commentId}              INCR カウンタ
 */
export const CK = {
  matchComments: (m: string) => `match:${m}:comments`,
  comment: (c: string) => `comment:${c}`,
  matchReact: (m: string, e: string) => `match:${m}:react:${e}`,
  userLastPost: (u: string) => `user:${u}:lastpost`,
  userNick: (u: string) => `user:${u}:nick`,
  reports: (c: string) => `report:${c}`,
};
