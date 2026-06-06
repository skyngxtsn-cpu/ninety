/**
 * W杯2026 日本での放送・配信情報。
 *
 * - ABEMA は全 104 試合の無料配信が決定済み（2022カタール大会と同様の確認済モデル）
 * - DAZN は全試合のサブスク配信
 * - NHK 総合 / NHK BS / 民放 4社（TBS / テレ朝 / フジ / 日テレ）が地上波/BSで一部試合を放送
 *
 * 実際の正式な放送スケジュールは大会開幕約1ヶ月前にFIFA / 放送局から発表される。
 * このファイルは「推定」を含むので、発表され次第更新する。
 */

export type BroadcastChannelId =
  | "NHK_G" // NHK 総合
  | "NHK_BS" // NHK BS
  | "TBS"
  | "TEREASA" // テレビ朝日
  | "FUJI"
  | "NTV"
  | "ABEMA"
  | "DAZN"
  | "U-NEXT"
  | "NHK_PLUS"
  | "TVER";

export type BroadcastTier = "free" | "subscription" | "with-account";

export type BroadcastType = "terrestrial" | "bs" | "streaming";

export type BroadcastChannel = {
  id: BroadcastChannelId;
  name: string;
  shortName: string;
  type: BroadcastType;
  tier: BroadcastTier;
  /** ブランドカラー（HEX） */
  brand: string;
  /** テキストカラー（白か黒） */
  text: "white" | "black";
  /** ロゴ用の絵文字 or 短文字（実画像が無い場合のフォールバック） */
  glyph: string;
  /** ウェブの視聴URL（任意） */
  url?: string;
  /** モバイルアプリへのディープリンク（任意） */
  appUrl?: string;
};

export const CHANNELS: Record<BroadcastChannelId, BroadcastChannel> = {
  NHK_G: {
    id: "NHK_G",
    name: "NHK 総合",
    shortName: "NHK 総合",
    type: "terrestrial",
    tier: "free",
    brand: "#003580",
    text: "white",
    glyph: "📺",
    url: "https://www.nhk.or.jp/",
  },
  NHK_BS: {
    id: "NHK_BS",
    name: "NHK BS",
    shortName: "NHK BS",
    type: "bs",
    tier: "free",
    brand: "#0066aa",
    text: "white",
    glyph: "🛰",
    url: "https://www.nhk.or.jp/bs/",
  },
  TBS: {
    id: "TBS",
    name: "TBSテレビ",
    shortName: "TBS",
    type: "terrestrial",
    tier: "free",
    brand: "#243a76",
    text: "white",
    glyph: "📺",
    url: "https://www.tbs.co.jp/",
  },
  TEREASA: {
    id: "TEREASA",
    name: "テレビ朝日",
    shortName: "テレ朝",
    type: "terrestrial",
    tier: "free",
    brand: "#1469b1",
    text: "white",
    glyph: "📺",
    url: "https://www.tv-asahi.co.jp/",
  },
  FUJI: {
    id: "FUJI",
    name: "フジテレビ",
    shortName: "フジ",
    type: "terrestrial",
    tier: "free",
    brand: "#0d4685",
    text: "white",
    glyph: "📺",
    url: "https://www.fujitv.co.jp/",
  },
  NTV: {
    id: "NTV",
    name: "日本テレビ",
    shortName: "日テレ",
    type: "terrestrial",
    tier: "free",
    brand: "#c8102e",
    text: "white",
    glyph: "📺",
    url: "https://www.ntv.co.jp/",
  },
  ABEMA: {
    id: "ABEMA",
    name: "ABEMA",
    shortName: "ABEMA",
    type: "streaming",
    tier: "free",
    brand: "#00d22d",
    text: "black",
    glyph: "▶",
    url: "https://abema.tv/",
    appUrl: "abema://",
  },
  DAZN: {
    id: "DAZN",
    name: "DAZN",
    shortName: "DAZN",
    type: "streaming",
    tier: "subscription",
    brand: "#f8f900",
    text: "black",
    glyph: "D",
    url: "https://www.dazn.com/ja-JP/",
  },
  "U-NEXT": {
    id: "U-NEXT",
    name: "U-NEXT",
    shortName: "U-NEXT",
    type: "streaming",
    tier: "subscription",
    brand: "#000000",
    text: "white",
    glyph: "U",
    url: "https://video.unext.jp/",
  },
  NHK_PLUS: {
    id: "NHK_PLUS",
    name: "NHKプラス",
    shortName: "NHK+",
    type: "streaming",
    tier: "with-account",
    brand: "#003580",
    text: "white",
    glyph: "+",
    url: "https://plus.nhk.jp/",
  },
  TVER: {
    id: "TVER",
    name: "TVer",
    shortName: "TVer",
    type: "streaming",
    tier: "free",
    brand: "#23a839",
    text: "white",
    glyph: "T",
    url: "https://tver.jp/",
  },
};

/**
 * W杯2026 デフォルトの放送セット。
 * ABEMA は全試合無料配信、DAZN は全試合サブスク配信。
 * NHK系・民放は match-augment.ts や下記 override から個別に追加。
 */
export const DEFAULT_BROADCASTS: BroadcastChannelId[] = ["ABEMA", "DAZN"];

/**
 * 「この試合だけ NHK 総合放送」というような上書き。
 * キーは Match.id（OpenFootball 由来）。
 *
 * 注: 正式発表前なので推定。発表され次第更新。
 */
export const MATCH_OVERRIDES: Record<string, BroadcastChannelId[]> = {
  // 日本戦（全てNHK系で確実に放送される慣例）
  "2026-06-14-ned-jpn": ["NHK_G", "ABEMA", "DAZN"],
  "2026-06-20-tun-jpn": ["NHK_BS", "TBS", "ABEMA", "DAZN"],
  "2026-06-25-jpn-swe": ["NHK_G", "ABEMA", "DAZN"],

  // 開幕戦
  "2026-06-11-mex-rsa": ["NHK_G", "ABEMA", "DAZN"],

  // 注目カード
  "2026-06-13-bra-mar": ["NHK_BS", "ABEMA", "DAZN"],
  "2026-06-13-hai-sco": ["ABEMA", "DAZN"],

  // 決勝関連は擬似 ID、書き換え予定
};

/** Match.id から放送リストを返す */
export function broadcastsForMatch(matchId: string): BroadcastChannelId[] {
  return MATCH_OVERRIDES[matchId] ?? DEFAULT_BROADCASTS;
}

export function getChannel(id: BroadcastChannelId): BroadcastChannel {
  return CHANNELS[id];
}

export function getChannels(ids: BroadcastChannelId[]): BroadcastChannel[] {
  return ids.map(getChannel);
}
