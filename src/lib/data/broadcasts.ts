/**
 * W杯2026 日本での放送・配信情報。
 *
 * 出典:
 *  - JFA 公式（日本代表戦）: https://www.jfa.jp/samuraiblue/worldcup_2026/tv.html
 *  - Goal.com 全試合番組表（2026-06-06 更新）:
 *    https://assets.goal.com/images/v3/blta707c3fd9206fd97/20260606更新_W杯2026全試合の番組表.jpg
 *
 * - DAZN は全104試合を配信（DEFAULT）
 * - 一部試合のみ地上波・BSが追加（MATCH_OVERRIDES）
 * - ABEMA は W杯2026 の放送・配信権なし（公式資料に記載なし）
 *
 * 注: BS4K（NHK BS 4K）は全試合放送だが、4Kチューナーが必要なため
 *  本アプリの表示からは除外している。
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
  brand: string;
  text: "white" | "black";
  glyph: string;
  url?: string;
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
 */
export const DEFAULT_BROADCASTS: BroadcastChannelId[] = ["DAZN"];

/**
 * 試合ごとの放送局上書き。
 * キーは Match.id (= `${OpenFootball date}-${team1Id}-${team2Id}`)。
 *
 * 全データは Goal.com「W杯2026全試合の番組表（2026-06-06 更新）」より転記。
 * DAZN は全試合配信なのでデフォルトに任せ、地上波/BS が追加されている試合のみ
 * MATCH_OVERRIDES に列挙する（DAZN + 追加局）。
 */
export const MATCH_OVERRIDES: Record<string, BroadcastChannelId[]> = {
  // ============= グループステージ =============
  // 6/12 JST
  "2026-06-11-mex-rsa": ["NHK_G", "DAZN"], // メキシコvs南アフリカ (開幕戦)
  // "2026-06-11-kor-cze": DAZNのみ

  // 6/13 JST
  "2026-06-12-can-bih": ["NHK_G", "DAZN"], // カナダvsボスニア
  // "2026-06-12-usa-par": DAZNのみ

  // 6/14 JST
  // "2026-06-13-qat-sui": DAZNのみ
  // "2026-06-13-bra-mar": DAZNのみ
  "2026-06-13-hai-sco": ["NHK_G", "DAZN"], // ハイチvsスコットランド
  "2026-06-13-aus-tur": ["NTV", "DAZN"], // 豪vsトルコ

  // 6/15 JST
  "2026-06-14-ger-cuw": ["NHK_G", "DAZN"], // ドイツvsキュラソー
  "2026-06-14-ned-jpn": ["NHK_G", "DAZN"], // オランダvs日本 ★日本戦
  // "2026-06-14-civ-ecu": DAZNのみ
  "2026-06-14-swe-tun": ["NTV", "DAZN"], // スウェーデンvsチュニジア

  // 6/16 JST
  "2026-06-15-esp-cpv": ["NHK_G", "DAZN"], // スペインvsカーボベルデ
  "2026-06-15-bel-egy": ["NHK_G", "DAZN"], // ベルギーvsエジプト
  // "2026-06-15-ksa-uru": DAZNのみ
  // "2026-06-15-irn-nzl": DAZNのみ

  // 6/17 JST
  "2026-06-16-fra-sen": ["FUJI", "DAZN"], // フランスvsセネガル
  // "2026-06-16-irq-nor": DAZNのみ
  "2026-06-16-arg-alg": ["NHK_G", "DAZN"], // アルゼンチンvsアルジェリア
  // "2026-06-16-aut-jor": DAZNのみ

  // 6/18 JST
  "2026-06-17-por-cod": ["FUJI", "DAZN"], // ポルトガルvsDRコンゴ
  // "2026-06-17-eng-cro": DAZNのみ
  // "2026-06-17-gha-pan": DAZNのみ
  // "2026-06-17-uzb-col": DAZNのみ

  // 6/19 JST
  "2026-06-18-cze-rsa": ["NTV", "DAZN"], // チェコvs南アフリカ
  // "2026-06-18-sui-bih": DAZNのみ
  "2026-06-18-can-qat": ["NHK_G", "DAZN"], // カナダvsカタール
  "2026-06-18-mex-kor": ["NHK_G", "DAZN"], // メキシコvs韓国

  // 6/20 JST
  "2026-06-19-usa-aus": ["NHK_G", "DAZN"], // アメリカvsオーストラリア
  "2026-06-19-sco-mar": ["FUJI", "DAZN"], // スコットランドvsモロッコ
  "2026-06-19-bra-hai": ["NHK_G", "DAZN"], // ブラジルvsハイチ
  // "2026-06-19-tur-par": DAZNのみ

  // 6/21 JST
  "2026-06-20-ned-swe": ["NHK_G", "DAZN"], // オランダvsスウェーデン
  "2026-06-20-ger-civ": ["NTV", "DAZN"], // ドイツvsコートジボワール
  // "2026-06-20-ecu-cuw": DAZNのみ
  "2026-06-20-tun-jpn": ["NTV", "NHK_BS", "DAZN"], // チュニジアvs日本 ★日本戦

  // 6/22 JST
  "2026-06-21-esp-ksa": ["NHK_G", "DAZN"], // スペインvsサウジアラビア
  // "2026-06-21-bel-irn": DAZNのみ
  // "2026-06-21-uru-cpv": DAZNのみ
  // "2026-06-21-nzl-egy": DAZNのみ

  // 6/23 JST
  // "2026-06-22-arg-aut": DAZNのみ
  // "2026-06-22-fra-irq": DAZNのみ
  "2026-06-22-nor-sen": ["NHK_G", "DAZN"], // ノルウェーvsセネガル
  // "2026-06-22-jor-alg": DAZNのみ

  // 6/24 JST
  "2026-06-23-por-uzb": ["NHK_G", "DAZN"], // ポルトガルvsウズベキスタン
  // "2026-06-23-eng-gha": DAZNのみ
  "2026-06-23-pan-cro": ["FUJI", "DAZN"], // パナマvsクロアチア
  "2026-06-23-col-cod": ["NTV", "DAZN"], // コロンビアvsDRコンゴ

  // 6/25 JST
  "2026-06-24-sui-can": ["NHK_G", "DAZN"], // スイスvsカナダ
  // "2026-06-24-bih-qat": DAZNのみ
  // "2026-06-24-sco-bra": DAZNのみ
  // "2026-06-24-mar-hai": DAZNのみ
  "2026-06-24-cze-mex": ["NHK_G", "DAZN"], // チェコvsメキシコ
  // "2026-06-24-rsa-kor": DAZNのみ

  // 6/26 JST
  // "2026-06-25-cuw-civ": DAZNのみ
  // "2026-06-25-ecu-ger": DAZNのみ
  "2026-06-25-jpn-swe": ["NHK_G", "DAZN"], // 日本vsスウェーデン ★日本戦
  // "2026-06-25-tun-ned": DAZNのみ
  "2026-06-25-tur-usa": ["NTV", "DAZN"], // トルコvsアメリカ
  // "2026-06-25-par-aus": DAZNのみ

  // 6/27 JST
  "2026-06-26-nor-fra": ["NHK_G", "DAZN"], // ノルウェーvsフランス
  // "2026-06-26-sen-irq": DAZNのみ
  // "2026-06-26-cpv-ksa": DAZNのみ
  "2026-06-26-uru-esp": ["NTV", "DAZN"], // ウルグアイvsスペイン
  // "2026-06-26-egy-irn": DAZNのみ
  "2026-06-26-nzl-bel": ["NTV", "DAZN"], // ニュージーランドvsベルギー

  // 6/28 JST
  // "2026-06-27-pan-eng": DAZNのみ
  // "2026-06-27-cro-gha": DAZNのみ
  "2026-06-27-col-por": ["FUJI", "DAZN"], // コロンビアvsポルトガル
  // "2026-06-27-cod-uzb": DAZNのみ
  // "2026-06-27-alg-aut": DAZNのみ
  "2026-06-27-jor-arg": ["NHK_G", "DAZN"], // ヨルダンvsアルゼンチン

  // ============= ラウンド32 (6/29-7/04 JST) =============
  // num=73-88. DAZN ベース、一部に 日テレ
  "2026-06-30-2e-2i": ["NTV", "DAZN"], // 7/01 2:00 JST E組2位×I組2位 (num=78)
  "2026-07-02-2k-2l": ["NTV", "DAZN"], // 7/03 8:00 JST K組2位×L組2位 (num=83)
  "2026-07-03-1j-2h": ["NTV", "DAZN"], // 7/04 7:00 JST J組1位×H組2位 (num=86)

  // ============= ラウンド16 (7/05-7/08 JST) =============
  // num=89-96. ほぼ DAZN のみ、一部に 日テレ
  "2026-07-06-w83-w84": ["NTV", "DAZN"], // 7/07 4:00 JST (num=93)

  // ============= 準々決勝 (7/10-7/12 JST) =============
  // num=97-100. DAZN のみ

  // ============= 準決勝 (7/15-7/16 JST) =============
  // num=101-102. DAZN のみ

  // ============= 3位決定戦 (7/19 6:00 JST) =============
  // OpenFootball ID: 2026-07-18-L101-L102 → slug → 2026-07-18-l101-l102
  "2026-07-18-l101-l102": ["NHK_G", "DAZN"],

  // ============= 決勝 (7/20 4:00 JST) =============
  // OpenFootball ID: 2026-07-19-W101-W102 → slug → 2026-07-19-w101-w102
  "2026-07-19-w101-w102": ["NHK_G", "DAZN"],
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
