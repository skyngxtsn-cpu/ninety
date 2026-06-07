"use client";

import { useEffect, useState } from "react";

type Props = {
  matchId: string;
  /** この件数以上で「🔥盛り上がってる」表示 */
  threshold?: number;
};

/**
 * 「観たい」を押した人が一定数を超えた試合に「🔥盛り上がってる」を出す。
 * 試合カード一覧から多数同時呼ばれるため、サーバー側で Edge cache してある前提。
 */
export function HotMatchBadge({ matchId, threshold = 10 }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let canceled = false;
    fetch(`/api/matches/${matchId}/watching-count`)
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

  if (count === null || count < threshold) return null;

  return (
    <span
      title={`${count}人が観たい登録中`}
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/35 text-[9.5px] font-semibold text-rose-100 leading-none"
    >
      <span>🔥</span>
      <span>盛り上がってる</span>
    </span>
  );
}
