/**
 * W杯2026 日本での放送・配信情報。
 *
 * 出典: JFA 公式 https://www.jfa.jp/samuraiblue/worldcup_2026/tv.html
 *  - 日本代表戦の放送・配信局はこのページに準拠。
 *  - 日本代表以外の試合の放送情報は2026-06-07時点では公式発表なし。
 *    そのため、デフォルトは「DAZN（全104試合配信予定）」のみ。
 *
 * 重要: 過去のデータで ABEMA を全試合無料配信としていたが、
 *  W杯2026 についての ABEMA の配信権は公式発表で確認できないため削除。
 *
 * 日本代表トーナメント進出時：
 *  - R32 (6/28〜7/3): フジテレビ + NHK BS + DAZN
 *  - R16以降 (7/4〜7/19): NHK総合 + DAZN
 *  → Japan の進出が確定した時点で MATCH_OVERRIDES に追加する。
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
 * DAZN が全104試合配信予定。
 * 地上波・BS の個別放送は MATCH_OVERRIDES から追加する。
 *
 * 注: 過去のデータに ABEMA が含まれていたが、JFA公式の放送情報に
 *  ABEMA の記載が無いため除外。確定情報が出れば追加する。
 */
export const DEFAULT_BROADCASTS: BroadcastChannelId[] = ["DAZN"];

/**
 * 試合ごとの放送局上書き。
 * キーは Match.id（OpenFootball 由来、kickoff の UTC 日付ベース）。
 *
 * 日本代表戦は JFA 公式 (https://www.jfa.jp/samuraiblue/worldcup_2026/tv.html) 準拠。
 * 日本以外の試合は確定情報が出るまで DEFAULT_BROADCASTS のまま。
 */
export const MATCH_OVERRIDES: Record<string, BroadcastChannelId[]> = {
  // 日本戦（JFA公式準拠、2026-06-07 時点）
  // 6/15(月) 5:00 JST 日本 vs オランダ — グループF 第1節
  "2026-06-14-ned-jpn": ["NHK_G", "DAZN"],
  // 6/21(日) 13:00 JST 日本 vs チュニジア — グループF 第2節
  "2026-06-20-tun-jpn": ["NTV", "NHK_BS", "DAZN"],
  // 6/26(金) 8:00 JST 日本 vs スウェーデン — グループF 第3節
  "2026-06-25-jpn-swe": ["NHK_G", "DAZN"],

  // 日本進出時のトーナメント:
  //   R32 (6/28〜7/3): フジ + NHK BS + DAZN
  //   R16以降 (7/4〜7/19): NHK総合 + DAZN
  // → 進出が決まった時点で具体の Match.id に対して上書きを追加する。
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
