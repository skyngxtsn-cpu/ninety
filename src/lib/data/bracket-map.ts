/**
 * FIFA 2026 W杯：knockout 試合番号 → 次ラウンド対応表。
 *
 * OpenFootball JSON より導出:
 *   R32 #73〜#88（16試合）→ R16 #89〜#96（8試合）→ QF #97〜#100 → SF #101〜#102
 *   → Final (擬似 #103) / 3位決定戦 (擬似 #9991)
 *
 * R16 の home/away はそれぞれの試合の team1 / team2 に対応する。
 * 例: R16 #89 "W74 vs W77" → R32 #74 winner は #89 home、 #77 winner は #89 away。
 */

export type BracketRound = "R32" | "R16" | "QF" | "SF" | "THIRD" | "FINAL";

export type NextTransition = {
  nextNum: number;
  /** 次の試合での出場サイド */
  side: "home" | "away";
};

/** sourceMatchNum -> 次の試合番号と出場サイド */
export const NEXT_MATCH: Record<number, NextTransition> = {
  // R32 → R16
  // R16 #89: W74 vs W77
  74: { nextNum: 89, side: "home" },
  77: { nextNum: 89, side: "away" },
  // R16 #90: W73 vs W75
  73: { nextNum: 90, side: "home" },
  75: { nextNum: 90, side: "away" },
  // R16 #91: W76 vs W78
  76: { nextNum: 91, side: "home" },
  78: { nextNum: 91, side: "away" },
  // R16 #92: W79 vs W80
  79: { nextNum: 92, side: "home" },
  80: { nextNum: 92, side: "away" },
  // R16 #93: W83 vs W84
  83: { nextNum: 93, side: "home" },
  84: { nextNum: 93, side: "away" },
  // R16 #94: W81 vs W82
  81: { nextNum: 94, side: "home" },
  82: { nextNum: 94, side: "away" },
  // R16 #95: W86 vs W88
  86: { nextNum: 95, side: "home" },
  88: { nextNum: 95, side: "away" },
  // R16 #96: W85 vs W87
  85: { nextNum: 96, side: "home" },
  87: { nextNum: 96, side: "away" },

  // R16 → QF
  // QF #97: W89 vs W90
  89: { nextNum: 97, side: "home" },
  90: { nextNum: 97, side: "away" },
  // QF #98: W93 vs W94
  93: { nextNum: 98, side: "home" },
  94: { nextNum: 98, side: "away" },
  // QF #99: W91 vs W92
  91: { nextNum: 99, side: "home" },
  92: { nextNum: 99, side: "away" },
  // QF #100: W95 vs W96
  95: { nextNum: 100, side: "home" },
  96: { nextNum: 100, side: "away" },

  // QF → SF
  // SF #101: W97 vs W98
  97: { nextNum: 101, side: "home" },
  98: { nextNum: 101, side: "away" },
  // SF #102: W99 vs W100
  99: { nextNum: 102, side: "home" },
  100: { nextNum: 102, side: "away" },

  // SF → Final (擬似 #9992) / 3位決定戦 (擬似 #9991, 敗者)
  // Final: W101 vs W102 / 3rd place: L101 vs L102
  101: { nextNum: 9992, side: "home" },
  102: { nextNum: 9992, side: "away" },
};

/**
 * 与えられた match num から、Final まで辿るパス（[次の試合, 次の次..., Final]）。
 * 日本のパスハイライト等に使う想定。
 */
export function pathToFinal(fromNum: number): NextTransition[] {
  const path: NextTransition[] = [];
  let cur = fromNum;
  while (NEXT_MATCH[cur]) {
    const next = NEXT_MATCH[cur];
    path.push(next);
    cur = next.nextNum;
  }
  return path;
}
