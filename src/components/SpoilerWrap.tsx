"use client";

import { useState, type ReactNode } from "react";
import { useSpoilerBlock } from "../lib/preferences";

/**
 * ネタバレ防止モード ON のとき、子要素を「●●●」で覆う。
 * タップすると一時的に中身を表示。
 */
export function SpoilerWrap({
  children,
  hint = "結果を見る",
  size = "md",
}: {
  children: ReactNode;
  hint?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { blocked, hydrated } = useSpoilerBlock();
  const [revealed, setRevealed] = useState(false);

  // ハイドレート前は素のまま表示（フラッシュ防止）
  if (!hydrated || !blocked || revealed) {
    return <>{children}</>;
  }

  const padding =
    size === "lg" ? "px-3 py-1.5" : size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";
  const text = size === "lg" ? "text-[14px]" : size === "sm" ? "text-[10px]" : "text-[12px]";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setRevealed(true);
      }}
      aria-label={hint}
      className={`inline-flex items-center gap-1 rounded-md bg-white/10 border border-white/15 ${padding} ${text} text-white/70 hover:bg-white/15 transition leading-none`}
    >
      <span className="font-mono tracking-tighter">●●●</span>
    </button>
  );
}
