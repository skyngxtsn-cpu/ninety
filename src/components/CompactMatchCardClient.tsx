"use client";

import Link from "next/link";
import { useReminderMatches } from "../lib/useReminderMatches";

type Props = {
  matchId: string;
  involvesFavorite: boolean;
  children: React.ReactNode;
};

/**
 * CompactMatchCard をリンクでラップしつつ、
 * 「お気に入り（観たい）」状態をクライアント側で読んでリングを当てる。
 * 推しチーム参戦・お気に入りどちらもゴールド系で統一する。
 */
export function CompactMatchCardClient({
  matchId,
  involvesFavorite,
  children,
}: Props) {
  const { isReminded, hydrated } = useReminderMatches();
  const favorited = hydrated && isReminded(matchId);

  const className = involvesFavorite
    ? "border-[var(--accent-2)]/55 bg-[var(--accent-2)]/[0.06] hover:bg-[var(--accent-2)]/[0.10]"
    : favorited
      ? "border-[var(--accent-2)]/45 bg-[var(--accent-2)]/[0.035] hover:bg-[var(--accent-2)]/[0.07]"
      : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]";

  return (
    <Link
      href={`/matches/${matchId}`}
      className={`block rounded-2xl border transition-colors p-3 ${className}`}
    >
      {children}
    </Link>
  );
}
