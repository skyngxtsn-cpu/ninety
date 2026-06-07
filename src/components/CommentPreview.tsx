"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Comment } from "../lib/comments/types";
import { useSpoilerBlock } from "../lib/preferences";

type Props = {
  matchId: string;
  /** 試合のステータス（spoiler 連動） */
  status: "scheduled" | "live" | "finished";
};

/**
 * 試合カード下に「💬 最新コメント1件」をプレビュー表示する。
 * タップで掲示板へ遷移。
 *
 * - ネタバレ防止モード ON + 試合進行中/終了後 → プレビュー本文を伏せ字に
 * - コメント 0 件なら何も出さない
 */
export function CommentPreview({ matchId, status }: Props) {
  const { blocked: spoilerBlock } = useSpoilerBlock();
  const [latest, setLatest] = useState<Comment | null>(null);
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let canceled = false;
    fetch(`/api/matches/${matchId}/comments-preview`)
      .then((r) => (r.ok ? r.json() : { latest: null, count: 0 }))
      .then((j: { latest: Comment | null; count: number }) => {
        if (!canceled) {
          setLatest(j.latest);
          setCount(j.count);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!canceled) setLoaded(true);
      });
    return () => {
      canceled = true;
    };
  }, [matchId]);

  if (!loaded || count === 0 || !latest) return null;

  const blocked = spoilerBlock && status !== "scheduled";

  return (
    <Link
      href={`/matches/${matchId}/comments`}
      onClick={(e) => e.stopPropagation()}
      className="mt-2 flex items-start gap-2 px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/8 hover:bg-white/[0.07] transition"
    >
      <span className="text-[14px] leading-none mt-px shrink-0">
        {latest.flag ?? "💬"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[10.5px] text-white/55 mb-0.5">
          <span className="font-semibold text-white/75 truncate">
            {latest.nick}
          </span>
          {count > 1 && (
            <span className="text-white/45">+{count - 1}件</span>
          )}
          <span className="ml-auto shrink-0 text-white/40">
            タップで掲示板へ →
          </span>
        </div>
        <p
          className={`text-[12px] truncate ${
            blocked ? "italic text-white/40 tracking-widest" : "text-white/85"
          }`}
        >
          {blocked ? "●●●（タップで掲示板へ）" : latest.text}
        </p>
      </div>
    </Link>
  );
}
