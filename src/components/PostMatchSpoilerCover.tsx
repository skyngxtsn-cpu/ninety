"use client";

import { useState, type ReactNode } from "react";
import { useSpoilerBlock } from "../lib/preferences";

/**
 * 試合後コンテンツ（スコア・要約・MotM・次戦影響など）をまとめて
 * ネタバレ防止モード時に大きな「結果を見る」ボタンで覆う。
 */
export function PostMatchSpoilerCover({ children }: { children: ReactNode }) {
  const { blocked, hydrated } = useSpoilerBlock();
  const [revealed, setRevealed] = useState(false);

  if (!hydrated) return null;
  if (!blocked || revealed) return <>{children}</>;

  return (
    <div className="mx-4 mt-5">
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="w-full glass rounded-2xl p-6 text-center hover:bg-white/[0.04] transition border border-amber-400/30"
      >
        <div className="text-[32px] mb-2">👀</div>
        <p className="text-[14px] font-bold text-amber-100 mb-1">
          ネタバレ防止モード中
        </p>
        <p className="text-[11.5px] text-white/65 leading-relaxed">
          試合後の内容（スコア・要約・MotM・次戦影響）が
          <br />
          隠れています。タップで全部表示。
        </p>
        <div className="inline-block mt-4 px-4 py-2 rounded-full bg-amber-400/15 border border-amber-400/30 text-[12px] font-semibold text-amber-100">
          🎬 結果を見る
        </div>
      </button>
    </div>
  );
}
