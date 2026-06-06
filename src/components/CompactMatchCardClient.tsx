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
 * リマインド状態をクライアント側で読んで青リングを当てる。
 * 推しチーム参戦時は金リング優先（リマインドでも金）。
 */
export function CompactMatchCardClient({
  matchId,
  involvesFavorite,
  children,
}: Props) {
  const { isReminded, hydrated } = useReminderMatches();
  const reminded = hydrated && isReminded(matchId);

  const className = involvesFavorite
    ? "border-[var(--accent-2)]/50 bg-[var(--accent-2)]/[0.04] hover:bg-[var(--accent-2)]/[0.08]"
    : reminded
      ? "border-sky-400/50 bg-sky-500/[0.06] hover:bg-sky-500/[0.10]"
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
