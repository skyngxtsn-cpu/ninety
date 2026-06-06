import Link from "next/link";
import type { BracketRound } from "../lib/data/bracket";
import { ROUND_LABEL_JA } from "../lib/data/i18n";

type Props = {
  active: BracketRound;
  view: "tabs" | "tree";
  basePath: string;
};

const ROUNDS: BracketRound[] = ["R32", "R16", "QF", "SF", "FINAL"];

export function BracketTabs({ active, view, basePath }: Props) {
  return (
    <nav className="overflow-x-auto scrollbar-none -mx-4 px-4 mb-4">
      <div className="flex gap-2 pr-4 snap-x">
        {ROUNDS.map((r) => {
          const isActive = r === active;
          const href = `${basePath}?round=${r}${view === "tree" ? "&view=tree" : ""}`;
          return (
            <Link
              key={r}
              href={href}
              scroll={false}
              className={`shrink-0 snap-start px-3.5 py-1.5 rounded-full text-[12px] font-semibold tracking-tight transition ${
                isActive
                  ? "bg-white text-black shadow-[0_4px_12px_-2px_rgba(255,255,255,0.25)]"
                  : "bg-white/8 text-white/75 hover:bg-white/12"
              }`}
            >
              {ROUND_LABEL_JA[r]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
