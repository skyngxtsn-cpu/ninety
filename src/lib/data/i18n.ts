/** 48カ国の英→日マッピング（W杯2026本選） */
export const countryJa: Record<string, string> = {
  MEX: "メキシコ",
  RSA: "南アフリカ",
  KOR: "韓国",
  CZE: "チェコ",
  CAN: "カナダ",
  BIH: "ボスニア・ヘルツェゴビナ",
  QAT: "カタール",
  SUI: "スイス",
  BRA: "ブラジル",
  MAR: "モロッコ",
  HAI: "ハイチ",
  SCO: "スコットランド",
  USA: "アメリカ",
  PAR: "パラグアイ",
  AUS: "オーストラリア",
  TUR: "トルコ",
  GER: "ドイツ",
  CUW: "キュラソー",
  CIV: "コートジボワール",
  ECU: "エクアドル",
  NED: "オランダ",
  JPN: "日本",
  SWE: "スウェーデン",
  TUN: "チュニジア",
  BEL: "ベルギー",
  EGY: "エジプト",
  IRN: "イラン",
  NZL: "ニュージーランド",
  ESP: "スペイン",
  CPV: "カーボベルデ",
  KSA: "サウジアラビア",
  URU: "ウルグアイ",
  FRA: "フランス",
  SEN: "セネガル",
  IRQ: "イラク",
  NOR: "ノルウェー",
  ARG: "アルゼンチン",
  ALG: "アルジェリア",
  AUT: "オーストリア",
  JOR: "ヨルダン",
  POR: "ポルトガル",
  COD: "コンゴ民主共和国",
  UZB: "ウズベキスタン",
  COL: "コロンビア",
  ENG: "イングランド",
  CRO: "クロアチア",
  GHA: "ガーナ",
  PAN: "パナマ",
};

/** 国名（英）→ 日本語名 */
export function jaName(fifaCode: string, fallback?: string): string {
  return countryJa[fifaCode.toUpperCase()] ?? fallback ?? fifaCode;
}

/** OpenFootballの会場名を読みやすく簡略化（カッコ内省略など） */
export function shortVenue(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, "").trim();
}

/** ラウンド名を日本語に */
export function jaRound(round: string, group?: string): string {
  if (group) return `${group.replace("Group ", "グループ")}`;
  const m = round.match(/Round of (\d+)/);
  if (m) return `ベスト${m[1]}`;
  if (/Quarter/i.test(round)) return "準々決勝";
  if (/Semi/i.test(round)) return "準決勝";
  if (/Final/i.test(round) && /third|3rd/i.test(round)) return "3位決定戦";
  if (/Final/i.test(round)) return "決勝";
  return round;
}

/** BracketRound → 日本語ラベル（タブ表示用、短め） */
export const ROUND_LABEL_JA: Record<string, string> = {
  R32: "ベスト32",
  R16: "ベスト16",
  QF: "準々決勝",
  SF: "準決勝",
  FINAL: "決勝",
  THIRD: "3位決定戦",
};

/**
 * BracketSlot → 日本語ラベル（カードの中の "A組2位" "メキシコ vs 南アフリカ の勝者" などを描画）。
 * lookupTeam で fifa_code 小文字（"jpn"）→ Team を引いて、解決済みなら国名を返す。
 */
type SlotLike =
  | { kind: "team"; teamId: string }
  | { kind: "group-rank"; group: string; rank: 1 | 2 | 3 }
  | { kind: "group-rank-multi"; groups: string[]; rank: 3 }
  | {
      kind: "winner-of";
      sourceMatchNum: number;
      deep?: { home: SlotLike; away: SlotLike };
    }
  | {
      kind: "loser-of";
      sourceMatchNum: number;
      deep?: { home: SlotLike; away: SlotLike };
    };

export function jaSlotLabel(
  slot: SlotLike,
  lookupTeamName: (teamId: string) => string | undefined,
  depth = 0,
): string {
  switch (slot.kind) {
    case "team":
      return lookupTeamName(slot.teamId) ?? slot.teamId.toUpperCase();
    case "group-rank":
      return `${slot.group}組 ${slot.rank}位`;
    case "group-rank-multi":
      return `${slot.groups.join("/")}組 3位`;
    case "winner-of": {
      if (slot.deep && depth < 1) {
        const a = jaSlotLabel(slot.deep.home, lookupTeamName, depth + 1);
        const b = jaSlotLabel(slot.deep.away, lookupTeamName, depth + 1);
        return `${a} vs ${b} の勝者`;
      }
      return `前段勝者 (#${slot.sourceMatchNum})`;
    }
    case "loser-of": {
      if (slot.deep && depth < 1) {
        const a = jaSlotLabel(slot.deep.home, lookupTeamName, depth + 1);
        const b = jaSlotLabel(slot.deep.away, lookupTeamName, depth + 1);
        return `${a} vs ${b} の敗者`;
      }
      return `前段敗者 (#${slot.sourceMatchNum})`;
    }
  }
}
