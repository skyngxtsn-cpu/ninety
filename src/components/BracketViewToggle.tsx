import Link from "next/link";
import type { BracketRound } from "../lib/data/bracket";

type Props = {
  view: "tabs" | "tree";
  round: BracketRound;
  basePath: string;
};

export function BracketViewToggle({ view, round, basePath }: Props) {
  const listHref = `${basePath}?round=${round}`;
  const treeHref = `${basePath}?round=${round}&view=tree`;
  return (
    <div className="flex items-center gap-1.5">
      <Link
        href={listHref}
        scroll={false}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
          view === "tabs"
            ? "bg-white text-black"
            : "bg-white/8 text-white/70 hover:bg-white/12"
        }`}
        aria-label="リスト表示"
      >
        <ListIcon />
        リスト
      </Link>
      <Link
        href={treeHref}
        scroll={false}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
          view === "tree"
            ? "bg-white text-black"
            : "bg-white/8 text-white/70 hover:bg-white/12"
        }`}
        aria-label="ブラケット表示"
      >
        <TreeIcon />
        ブラケット
      </Link>
    </div>
  );
}

function ListIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="2.4" rx="0.8" fill="currentColor" />
      <rect x="2" y="6.8" width="12" height="2.4" rx="0.8" fill="currentColor" />
      <rect x="2" y="10.6" width="12" height="2.4" rx="0.8" fill="currentColor" />
    </svg>
  );
}

function TreeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="4" height="2.2" rx="0.6" fill="currentColor" />
      <rect x="1" y="10.5" width="4" height="2.2" rx="0.6" fill="currentColor" />
      <rect x="6" y="6.5" width="4" height="2.2" rx="0.6" fill="currentColor" />
      <rect x="11" y="6.5" width="4" height="2.2" rx="0.6" fill="currentColor" />
    </svg>
  );
}
