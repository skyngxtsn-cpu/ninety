"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  matchId: string;
  /** この件数以上で表示。デフォルト 3 */
  threshold?: number;
  /** "inline"=試合カード用の小型、"chip"=試合詳細用の通常サイズ */
  variant?: "inline" | "chip";
};

/**
 * 試合カードに「💬 N 件」を表示する。
 * 件数が閾値未満なら何も出さない（「inline」モード）。
 * 「chip」モードは件数0でも常に表示。
 */
export function CommentBadge({
  matchId,
  threshold = 3,
  variant = "inline",
}: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let canceled = false;
    fetch(`/api/matches/${matchId}/comments-count`)
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((j: { count?: number }) => {
        if (!canceled) setCount(j.count ?? 0);
      })
      .catch(() => {
        if (!canceled) setCount(0);
      });
    return () => {
      canceled = true;
    };
  }, [matchId]);

  if (count === null) return null;

  if (variant === "inline") {
    if (count < threshold) return null;
    return (
      <Link
        href={`/matches/${matchId}/comments`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-[10px] text-blue-200/85 hover:text-blue-200"
      >
        💬 {count}
      </Link>
    );
  }

  return (
    <Link
      href={`/matches/${matchId}/comments`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-400/30 text-[12px] text-blue-100 hover:bg-blue-500/25 transition"
    >
      <span>💬</span>
      <span className="font-semibold">コメント</span>
      <span className="text-blue-200/85">{count}</span>
    </Link>
  );
}
