import { BracketMiniCard } from "./BracketMiniCard";
import type { BracketMatch, SplitBracket } from "../lib/data/bracket";
import type { Team } from "../lib/types";

type Props = {
  split: SplitBracket;
  teams: Map<string, Team>;
};

/**
 * 横スクロール式トーナメント表（ESPN/FIFA 公式風）。
 *
 * R32 8試合 →  R16 4試合 → QF 2試合 → SF 1試合 → [決勝] ← SF ← QF ← R16 ← R32
 *
 * - 左半分はカード左から右に「→」で進む（接続線は右側に伸びる）
 * - 右半分は逆方向（接続線は左側）
 * - 16行のCSS Grid を使って各カードを縦に正しく配置する
 *
 * カード高さ ≈ 52px、隙間 4px、R32 縦合計 ≈ 16行 × 32px = 512px。
 */
export function BracketKnockoutTree({ split, teams }: Props) {
  return (
    <div className="overflow-x-auto scrollbar-none -mx-4 px-4 pb-3">
      <div className="flex items-stretch min-w-min py-4">
        {/* 左半分: R32 → R16 → QF → SF → */}
        <Column
          matches={split.left.R32}
          side="left"
          rowSpan={2}
          showHeader
          roundLabel="ベスト32"
          teams={teams}
        />
        <Connectors side="left" pairs={4} />

        <Column
          matches={split.left.R16}
          side="left"
          rowSpan={4}
          showHeader
          roundLabel="ベスト16"
          teams={teams}
        />
        <Connectors side="left" pairs={2} />

        <Column
          matches={split.left.QF}
          side="left"
          rowSpan={8}
          showHeader
          roundLabel="準々決勝"
          teams={teams}
        />
        <Connectors side="left" pairs={1} />

        <Column
          matches={split.left.SF}
          side="left"
          rowSpan={16}
          showHeader
          roundLabel="準決勝"
          teams={teams}
        />

        {/* 中央: 決勝 */}
        <FinalCenter final={split.final} teams={teams} />

        {/* 右半分: ← SF ← QF ← R16 ← R32 */}
        <Column
          matches={split.right.SF}
          side="right"
          rowSpan={16}
          showHeader
          roundLabel="準決勝"
          teams={teams}
        />
        <Connectors side="right" pairs={1} />

        <Column
          matches={split.right.QF}
          side="right"
          rowSpan={8}
          showHeader
          roundLabel="準々決勝"
          teams={teams}
        />
        <Connectors side="right" pairs={2} />

        <Column
          matches={split.right.R16}
          side="right"
          rowSpan={4}
          showHeader
          roundLabel="ベスト16"
          teams={teams}
        />
        <Connectors side="right" pairs={4} />

        <Column
          matches={split.right.R32}
          side="right"
          rowSpan={2}
          showHeader
          roundLabel="ベスト32"
          teams={teams}
        />
      </div>
      <p className="text-[10px] text-white/45 mt-3 px-1">
        ← → スワイプで左右を移動。決勝は中央。日本が来うる枠は金リング。
      </p>
    </div>
  );
}

const TOTAL_ROWS = 16;
const ROW_HEIGHT = 32; // px per grid row
const GRID_HEIGHT = TOTAL_ROWS * ROW_HEIGHT;

function Column({
  matches,
  side,
  rowSpan,
  showHeader,
  roundLabel,
  teams,
}: {
  matches: BracketMatch[];
  side: "left" | "right";
  rowSpan: number;
  showHeader: boolean;
  roundLabel: string;
  teams: Map<string, Team>;
}) {
  return (
    <div className="shrink-0 flex flex-col items-stretch px-1">
      {showHeader && (
        <div
          className={`text-[10px] tracking-widest uppercase text-white/55 mb-2 px-1 ${
            side === "right" ? "text-right" : ""
          }`}
        >
          {roundLabel}
        </div>
      )}
      <div
        className="grid"
        style={{
          gridTemplateRows: `repeat(${TOTAL_ROWS}, ${ROW_HEIGHT}px)`,
          height: GRID_HEIGHT,
        }}
      >
        {matches.map((bm, i) => (
          <div
            key={bm.num}
            className="flex items-center"
            style={{
              gridRow: `${i * rowSpan + 1} / span ${rowSpan}`,
            }}
          >
            <BracketMiniCard bm={bm} teams={teams} side={side} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * カラム間の「Lコの字型」連結線。
 * 各ペアが上下2行 × span を持つ。1ペアの中で:
 *   - 上カードから右(or左)へ延びる水平線
 *   - 下カードから右(or左)へ延びる水平線
 *   - その2本を縦線でつなぐ
 *   - 中央から次のカラムへの水平線
 */
function Connectors({
  side,
  pairs,
}: {
  side: "left" | "right";
  pairs: number;
}) {
  const pairHeight = GRID_HEIGHT / pairs;
  return (
    <div
      className="shrink-0 relative"
      style={{ width: 16, marginTop: 20 /* header 分のオフセット */ }}
    >
      <div className="relative" style={{ height: GRID_HEIGHT }}>
        {Array.from({ length: pairs }).map((_, i) => (
          <Pair key={i} side={side} top={i * pairHeight} height={pairHeight} />
        ))}
      </div>
    </div>
  );
}

function Pair({
  side,
  top,
  height,
}: {
  side: "left" | "right";
  top: number;
  height: number;
}) {
  const q = height / 4;
  // 上下のカードはペアの 1/4 と 3/4 の高さ位置にいる想定（grid justify中央）
  // → 上線 y = top + q, 下線 y = top + 3q, 縦線 y = top+q..top+3q, 出線 y = top + 2q
  const lineColor = "rgba(255,255,255,0.18)";
  return (
    <>
      {/* 上カードからの水平線 */}
      <div
        className="absolute"
        style={{
          top: top + q - 0.5,
          [side === "left" ? "left" : "right"]: 0,
          width: "60%",
          height: 1,
          background: lineColor,
        }}
      />
      {/* 下カードからの水平線 */}
      <div
        className="absolute"
        style={{
          top: top + 3 * q - 0.5,
          [side === "left" ? "left" : "right"]: 0,
          width: "60%",
          height: 1,
          background: lineColor,
        }}
      />
      {/* 縦線（上線と下線をつなぐ） */}
      <div
        className="absolute"
        style={{
          top: top + q,
          [side === "left" ? "left" : "right"]: "60%",
          width: 1,
          height: 2 * q,
          background: lineColor,
        }}
      />
      {/* 中央から次列に伸びる出線 */}
      <div
        className="absolute"
        style={{
          top: top + 2 * q - 0.5,
          [side === "left" ? "left" : "right"]: "60%",
          width: "40%",
          height: 1,
          background: lineColor,
        }}
      />
    </>
  );
}

function FinalCenter({
  final,
  teams,
}: {
  final?: BracketMatch;
  teams: Map<string, Team>;
}) {
  return (
    <div
      className="shrink-0 flex flex-col items-center justify-center px-3"
      style={{ minWidth: 160 }}
    >
      <div className="text-[10px] tracking-widest uppercase text-[var(--accent-2)] mb-2 mt-5">
        FINAL
      </div>
      <div className="text-[14px] font-bold tracking-tight text-gradient mb-3">
        🏆 決勝
      </div>
      {final ? (
        <BracketMiniCard bm={final} teams={teams} side="center" big />
      ) : (
        <div className="text-[11px] text-white/45 italic">— TBD —</div>
      )}
      <div className="text-[9.5px] text-white/45 mt-3">
        7/19 (日)
      </div>
    </div>
  );
}
