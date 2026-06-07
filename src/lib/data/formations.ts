/**
 * 試合前の「想定スタメン」データ。
 *
 * - 本物のスタメンは試合開始 1 時間前にしか確定しないため、ここは「仮」想定
 * - 過去の試合・直近の親善試合・監督の発言などから、編集者が手作業で更新
 * - playerId が curated/auto-generated に存在すれば、ピッチ上のドットをタップして
 *   選手詳細へ遷移できる
 */
import type { PlayerId, TeamId } from "../types";

export type LineupSlot = {
  /** 既存の Player.id があれば設定（クリック可能になる） */
  playerId?: PlayerId;
  /** 表示用の名前（playerId が無くても出る） */
  name: string;
  /** 背番号 */
  number: number;
  /** ロール表記。例: "GK", "右SB", "ボランチ", "右WG", "CF" */
  role: string;
  /**
   * ピッチ上の位置。x=0(左) ~ 100(右), y=0(自陣ゴール) ~ 100(相手ゴール)。
   * Pitch コンポーネントが画面サイズに合わせて配置する。
   */
  x: number;
  y: number;
};

export type PredictedLineup = {
  /** "4-2-3-1" のような表示用フォーメーション */
  formation: string;
  /** 監督名（表示用） */
  manager?: string;
  /** ノート: 「直前の親善試合のスタメンを基に推定」など */
  note?: string;
  slots: LineupSlot[];
};

const JPN_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "森保 一",
  note: "直近の親善試合・予選のスタメンから想定。",
  slots: [
    // GK
    { playerId: "zsuzuki", name: "鈴木 彩艶", number: 1, role: "GK", x: 50, y: 8 },

    // DF (4バック)
    { playerId: "sugawara", name: "菅原 由勢", number: 2, role: "右SB", x: 85, y: 22 },
    { playerId: "itakura", name: "板倉 滉", number: 4, role: "CB", x: 62, y: 20 },
    { playerId: "taniguchi", name: "谷口 彰悟", number: 3, role: "CB", x: 38, y: 20 },
    { playerId: "hito", name: "伊藤 洋輝", number: 21, role: "左SB", x: 15, y: 22 },

    // DM (2枚)
    { playerId: "endo", name: "遠藤 航", number: 6, role: "ボランチ", x: 60, y: 40 },
    { playerId: "tanakaao", name: "田中 碧", number: 7, role: "ボランチ", x: 40, y: 40 },

    // AM (3枚)
    { playerId: "doan", name: "堂安 律", number: 10, role: "右ウイング", x: 82, y: 62 },
    { playerId: "kamada", name: "鎌田 大地", number: 15, role: "トップ下", x: 50, y: 62 },
    { playerId: "kubo", name: "久保 建英", number: 8, role: "左ウイング", x: 18, y: 62 },

    // ST
    { playerId: "ueda", name: "上田 綺世", number: 18, role: "CF", x: 50, y: 85 },
  ],
};

const NED_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "クーマン",
  note: "Euro 2024 以降の基本形を想定。",
  slots: [
    { name: "B. フェルブルッヘン", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ダンフリス", number: 22, role: "右SB", x: 85, y: 22 },
    { name: "デ・リフト", number: 4, role: "CB", x: 62, y: 20 },
    { name: "ファン・ダイク", number: 6, role: "CB（キャプテン）", x: 38, y: 20 },
    { name: "アケ", number: 5, role: "左SB", x: 15, y: 22 },
    { name: "シャーヒ", number: 14, role: "ボランチ", x: 50, y: 42 },
    { name: "F. デ・ヨング", number: 21, role: "インサイドハーフ", x: 30, y: 50 },
    { name: "ライナース", number: 18, role: "インサイドハーフ", x: 70, y: 50 },
    { name: "X. シモンズ", number: 7, role: "右ウイング", x: 85, y: 70 },
    { name: "ガクポ", number: 11, role: "CF", x: 50, y: 80 },
    { name: "F. ロメロ", number: 17, role: "左ウイング", x: 15, y: 70 },
  ],
};

const ESP_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "デ・ラ・フエンテ",
  note: "Euro 2024 優勝時のメンバー構成を想定。",
  slots: [
    { name: "ウナイ・シモン", number: 23, role: "GK", x: 50, y: 8 },
    { name: "カルバハル", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "ル・ノルマン", number: 4, role: "CB", x: 62, y: 20 },
    { name: "ラポルテ", number: 14, role: "CB", x: 38, y: 20 },
    { name: "ククレジャ", number: 24, role: "左SB", x: 15, y: 22 },
    { playerId: "rodri", name: "ロドリ", number: 16, role: "アンカー", x: 50, y: 38 },
    { playerId: "pedri", name: "ペドリ", number: 8, role: "インサイドハーフ", x: 30, y: 52 },
    { name: "ファビアン・ルイス", number: 6, role: "インサイドハーフ", x: 70, y: 52 },
    { playerId: "yamal", name: "ヤマル", number: 19, role: "右ウイング", x: 85, y: 70 },
    { name: "モラタ", number: 7, role: "CF（キャプテン）", x: 50, y: 80 },
    { name: "ウィリアムズ", number: 17, role: "左ウイング", x: 15, y: 70 },
  ],
};

const SWE_LINEUP: PredictedLineup = {
  formation: "4-4-2",
  manager: "トマソン",
  note: "北欧らしい縦に速い 4-4-2 を想定。",
  slots: [
    { name: "オルセン", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ルストレム", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "リンデロフ", number: 3, role: "CB", x: 62, y: 20 },
    { name: "ヨーンソン", number: 4, role: "CB", x: 38, y: 20 },
    { name: "アウグスティンソン", number: 5, role: "左SB", x: 15, y: 22 },
    { name: "アヌア", number: 7, role: "右SH", x: 80, y: 50 },
    { name: "S. ラーション", number: 8, role: "ボランチ", x: 60, y: 45 },
    { name: "オルソン", number: 6, role: "ボランチ", x: 40, y: 45 },
    { name: "クルセフスキ", number: 10, role: "左SH", x: 20, y: 50 },
    { name: "イサク", number: 11, role: "CF", x: 60, y: 82 },
    { name: "ギェケレシュ", number: 9, role: "CF", x: 40, y: 82 },
  ],
};

const TUN_LINEUP: PredictedLineup = {
  formation: "4-1-4-1",
  manager: "カデリ",
  note: "堅守カウンターの 4-1-4-1 を想定。",
  slots: [
    { name: "ダーメン", number: 1, role: "GK", x: 50, y: 8 },
    { name: "デルマン", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "ターラビ", number: 4, role: "CB", x: 62, y: 20 },
    { name: "ブレーニ", number: 5, role: "CB", x: 38, y: 20 },
    { name: "アブディ", number: 14, role: "左SB", x: 15, y: 22 },
    { name: "スカイリ", number: 6, role: "アンカー", x: 50, y: 40 },
    { name: "ライドゥニ", number: 8, role: "右IH", x: 78, y: 55 },
    { name: "メジブリ", number: 10, role: "インサイドハーフ", x: 60, y: 60 },
    { name: "サスィ", number: 13, role: "インサイドハーフ", x: 40, y: 60 },
    { name: "メサクニ", number: 7, role: "左IH", x: 22, y: 55 },
    { name: "ジェバリ", number: 9, role: "CF", x: 50, y: 82 },
  ],
};

// ============= 残り 43 カ国の想定スタメン =============
// 出典: 直近の親善試合・予選・各国メディア報道に基づく編集者推定。
// 試合開始 1h 前に発表される実スタメンで上書きされる予定。

const MEX_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "アギーレ",
  slots: [
    { name: "オチョア", number: 13, role: "GK", x: 50, y: 8 },
    { name: "サンチェス", number: 4, role: "右SB", x: 85, y: 22 },
    { name: "モンテス", number: 5, role: "CB", x: 62, y: 20 },
    { name: "アラウホ", number: 3, role: "CB", x: 38, y: 20 },
    { name: "ガジャルド", number: 23, role: "左SB", x: 15, y: 22 },
    { name: "アルバレス", number: 4, role: "アンカー", x: 50, y: 40 },
    { name: "アントゥナ", number: 22, role: "右IH", x: 70, y: 52 },
    { name: "ロドリゲス", number: 10, role: "左IH", x: 30, y: 52 },
    { name: "ベガ", number: 11, role: "右WG", x: 85, y: 70 },
    { name: "ヒメネス", number: 9, role: "CF", x: 50, y: 80 },
    { name: "ロサノ", number: 17, role: "左WG", x: 15, y: 70 },
  ],
};

const RSA_LINEUP: PredictedLineup = {
  formation: "3-4-2-1",
  manager: "ブロウス",
  slots: [
    { name: "ウィリアムズ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "モバトゥ", number: 3, role: "CB右", x: 70, y: 20 },
    { name: "モドゥパ", number: 5, role: "CB", x: 50, y: 18 },
    { name: "シャブララ", number: 4, role: "CB左", x: 30, y: 20 },
    { name: "ンゴモア", number: 2, role: "右WB", x: 88, y: 45 },
    { name: "モフォケン", number: 6, role: "ボランチ", x: 60, y: 50 },
    { name: "ムドゥナ", number: 8, role: "ボランチ", x: 40, y: 50 },
    { name: "ペイル", number: 16, role: "左WB", x: 12, y: 45 },
    { name: "ジロロ", number: 10, role: "シャドー", x: 65, y: 68 },
    { name: "アペレ", number: 22, role: "シャドー", x: 35, y: 68 },
    { name: "モカエン", number: 9, role: "CF", x: 50, y: 82 },
  ],
};

const KOR_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "ホン・ミョンボ",
  slots: [
    { name: "キム・スンギュ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ソル・ヨンウ", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "キム・ミンジェ", number: 4, role: "CB", x: 62, y: 20 },
    { name: "チョン・スンヒョン", number: 6, role: "CB", x: 38, y: 20 },
    { name: "イ・ミョンジェ", number: 14, role: "左SB", x: 15, y: 22 },
    { name: "ファン・インボム", number: 8, role: "ボランチ", x: 60, y: 40 },
    { name: "パク・ヨンウ", number: 7, role: "ボランチ", x: 40, y: 40 },
    { name: "ファン・ヒチャン", number: 11, role: "右AM", x: 82, y: 62 },
    { name: "イ・ジェソン", number: 17, role: "トップ下", x: 50, y: 62 },
    { name: "ソン・フンミン", number: 10, role: "左AM", x: 18, y: 62 },
    { name: "チョ・ギュソン", number: 9, role: "CF", x: 50, y: 85 },
  ],
};

const CZE_LINEUP: PredictedLineup = {
  formation: "3-4-2-1",
  manager: "ハシェク",
  slots: [
    { name: "ヤロシュ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "クレイチー", number: 4, role: "CB右", x: 70, y: 20 },
    { name: "フバ", number: 5, role: "CB", x: 50, y: 18 },
    { name: "ボラハロフスキー", number: 3, role: "CB左", x: 30, y: 20 },
    { name: "コウファル", number: 6, role: "右WB", x: 88, y: 45 },
    { name: "ソウチェク", number: 8, role: "ボランチ", x: 60, y: 50 },
    { name: "プロヴォト", number: 16, role: "ボランチ", x: 40, y: 50 },
    { name: "ジュラセク", number: 19, role: "左WB", x: 12, y: 45 },
    { name: "シック", number: 14, role: "シャドー", x: 65, y: 68 },
    { name: "フロジェク", number: 9, role: "シャドー", x: 35, y: 68 },
    { name: "クフタ", number: 7, role: "CF", x: 50, y: 82 },
  ],
};

const CAN_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "マーシュ",
  slots: [
    { name: "セント・クレア", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ジョンストン", number: 19, role: "右SB", x: 85, y: 22 },
    { name: "ヴィタリア", number: 4, role: "CB", x: 62, y: 20 },
    { name: "コルネリウス", number: 2, role: "CB", x: 38, y: 20 },
    { name: "デイヴィス", number: 22, role: "左SB", x: 15, y: 22 },
    { name: "オスホースト", number: 5, role: "アンカー", x: 50, y: 40 },
    { name: "コーン", number: 13, role: "右IH", x: 70, y: 52 },
    { name: "クーネ", number: 11, role: "左IH", x: 30, y: 52 },
    { name: "ブッカナン", number: 7, role: "右WG", x: 85, y: 70 },
    { name: "デイビッド", number: 20, role: "CF", x: 50, y: 80 },
    { name: "ラリン", number: 17, role: "左WG", x: 15, y: 70 },
  ],
};

const BIH_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "バルバレズ",
  slots: [
    { name: "ヴァシリ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "コラシナツ", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "ハジロウィッチ", number: 4, role: "CB", x: 62, y: 20 },
    { name: "アルナウトヴィッチ", number: 5, role: "CB", x: 38, y: 20 },
    { name: "ハジバジッチ", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "ピャニッチ", number: 8, role: "ボランチ", x: 60, y: 40 },
    { name: "ガリッチ", number: 6, role: "ボランチ", x: 40, y: 40 },
    { name: "クルタロヴィッチ", number: 10, role: "右AM", x: 82, y: 62 },
    { name: "デミロヴィッチ", number: 17, role: "トップ下", x: 50, y: 62 },
    { name: "アヒマートヴィッチ", number: 11, role: "左AM", x: 18, y: 62 },
    { name: "ジェコ", number: 9, role: "CF", x: 50, y: 85 },
  ],
};

const QAT_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "サンチェス",
  slots: [
    { name: "メシャール", number: 1, role: "GK", x: 50, y: 8 },
    { name: "コアキ", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "ハサン", number: 16, role: "CB", x: 62, y: 20 },
    { name: "アル・ラウィ", number: 5, role: "CB", x: 38, y: 20 },
    { name: "アハマド", number: 14, role: "左SB", x: 15, y: 22 },
    { name: "アスサ", number: 6, role: "アンカー", x: 50, y: 40 },
    { name: "アル・ハイドス", number: 10, role: "右IH", x: 70, y: 52 },
    { name: "ボウディアフ", number: 12, role: "左IH", x: 30, y: 52 },
    { name: "アフィフ", number: 11, role: "右WG", x: 85, y: 70 },
    { name: "アリ", number: 19, role: "CF", x: 50, y: 80 },
    { name: "ムンタリ", number: 9, role: "左WG", x: 15, y: 70 },
  ],
};

const SUI_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "ヤキン",
  slots: [
    { name: "コブール", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ヴィッドマー", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "アカンジ", number: 5, role: "CB", x: 62, y: 20 },
    { name: "シェア", number: 4, role: "CB", x: 38, y: 20 },
    { name: "ロドリゲス", number: 13, role: "左SB", x: 15, y: 22 },
    { name: "フロイラー", number: 8, role: "ボランチ", x: 60, y: 40 },
    { name: "ジャカ", number: 10, role: "ボランチ", x: 40, y: 40 },
    { name: "ヴァルガス", number: 17, role: "右AM", x: 82, y: 62 },
    { name: "シャキリ", number: 23, role: "トップ下", x: 50, y: 62 },
    { name: "ンゴンゴ", number: 11, role: "左AM", x: 18, y: 62 },
    { name: "エンボロ", number: 7, role: "CF", x: 50, y: 85 },
  ],
};

const BRA_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "アンチェロッティ",
  slots: [
    { name: "アリソン", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ダニーロ", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "マルキーニョス", number: 4, role: "CB（キャプテン）", x: 62, y: 20 },
    { name: "G. マガリャンイス", number: 3, role: "CB", x: 38, y: 20 },
    { name: "ヴェンデル", number: 6, role: "左SB", x: 15, y: 22 },
    { name: "カゼミーロ", number: 5, role: "ボランチ", x: 60, y: 40 },
    { name: "ブルーノ・ギマランイス", number: 17, role: "ボランチ", x: 40, y: 40 },
    { name: "ロドリゴ", number: 7, role: "右AM", x: 82, y: 62 },
    { name: "ラフィーニャ", number: 19, role: "トップ下", x: 50, y: 62 },
    { playerId: "vinicius", name: "ヴィニシウス", number: 10, role: "左AM", x: 18, y: 62 },
    { name: "リシャルリソン", number: 9, role: "CF", x: 50, y: 85 },
  ],
};

const MAR_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "ルグラギ",
  slots: [
    { name: "ブヌ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ハキミ", number: 2, role: "右SB（キャプテン）", x: 85, y: 22 },
    { name: "サイス", number: 5, role: "CB", x: 62, y: 20 },
    { name: "アゲルド", number: 6, role: "CB", x: 38, y: 20 },
    { name: "マズラウィ", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "アムラバト", number: 4, role: "アンカー", x: 50, y: 40 },
    { name: "ウナヒ", number: 8, role: "右IH", x: 70, y: 52 },
    { name: "ウーザイン", number: 13, role: "左IH", x: 30, y: 52 },
    { name: "アクラフ", number: 7, role: "右WG", x: 85, y: 70 },
    { name: "エン・ネシリ", number: 19, role: "CF", x: 50, y: 80 },
    { name: "ジエシュ", number: 10, role: "左WG", x: 15, y: 70 },
  ],
};

const HAI_LINEUP: PredictedLineup = {
  formation: "4-4-2",
  manager: "アンソニー",
  slots: [
    { name: "プラケ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "サンチェス", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "ベゴンドジ", number: 4, role: "CB", x: 62, y: 20 },
    { name: "ガブリエル", number: 5, role: "CB", x: 38, y: 20 },
    { name: "ゴアン", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "ピエール", number: 7, role: "右SH", x: 80, y: 50 },
    { name: "デルバ", number: 8, role: "ボランチ", x: 60, y: 45 },
    { name: "サンウ", number: 6, role: "ボランチ", x: 40, y: 45 },
    { name: "アレキサンドル", number: 11, role: "左SH", x: 20, y: 50 },
    { name: "ピエール=ガブリエル", number: 9, role: "CF", x: 60, y: 82 },
    { name: "ベラルド", number: 10, role: "CF", x: 40, y: 82 },
  ],
};

const SCO_LINEUP: PredictedLineup = {
  formation: "3-4-2-1",
  manager: "クラーク",
  slots: [
    { name: "ガン", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ハンリー", number: 5, role: "CB右", x: 70, y: 20 },
    { name: "マッケナ", number: 6, role: "CB", x: 50, y: 18 },
    { name: "ティアニー", number: 3, role: "CB左", x: 30, y: 20 },
    { name: "ハイケンス", number: 2, role: "右WB", x: 88, y: 45 },
    { name: "マクトミネイ", number: 4, role: "ボランチ", x: 60, y: 50 },
    { name: "ギルモア", number: 8, role: "ボランチ", x: 40, y: 50 },
    { name: "ロバートソン", number: 14, role: "左WB（キャプテン）", x: 12, y: 45 },
    { name: "クリスティ", number: 10, role: "シャドー", x: 65, y: 68 },
    { name: "マッギン", number: 7, role: "シャドー", x: 35, y: 68 },
    { name: "アダムス", number: 9, role: "CF", x: 50, y: 82 },
  ],
};

const USA_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "ポチェッティーノ",
  slots: [
    { name: "ターナー", number: 1, role: "GK", x: 50, y: 8 },
    { name: "デスト", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "リチャーズ", number: 5, role: "CB", x: 62, y: 20 },
    { name: "ロブソン", number: 3, role: "CB", x: 38, y: 20 },
    { name: "ロビンソン", number: 12, role: "左SB", x: 15, y: 22 },
    { name: "アダムス", number: 4, role: "アンカー", x: 50, y: 40 },
    { name: "マッケニー", number: 8, role: "右IH", x: 70, y: 52 },
    { name: "ムーザ", number: 6, role: "左IH", x: 30, y: 52 },
    { name: "ライナ", number: 7, role: "右WG", x: 85, y: 70 },
    { name: "プリシッチ", number: 10, role: "左WG（キャプテン）", x: 15, y: 70 },
    { name: "ペピ", number: 9, role: "CF", x: 50, y: 80 },
  ],
};

const PAR_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "アルファロ",
  slots: [
    { name: "ヒメネス", number: 1, role: "GK", x: 50, y: 8 },
    { name: "アルデレテ", number: 4, role: "右SB", x: 85, y: 22 },
    { name: "アラルコン", number: 3, role: "CB", x: 62, y: 20 },
    { name: "ロハス", number: 5, role: "CB", x: 38, y: 20 },
    { name: "エスピノラ", number: 6, role: "左SB", x: 15, y: 22 },
    { name: "クバス", number: 7, role: "アンカー", x: 50, y: 40 },
    { name: "ビジャサンティ", number: 10, role: "右IH", x: 70, y: 52 },
    { name: "ボバディジャ", number: 8, role: "左IH", x: 30, y: 52 },
    { name: "アルミロン", number: 11, role: "右WG", x: 85, y: 70 },
    { name: "サナブリア", number: 9, role: "CF", x: 50, y: 80 },
    { name: "エンシソ", number: 19, role: "左WG", x: 15, y: 70 },
  ],
};

const AUS_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "アーノルド",
  slots: [
    { name: "ライアン", number: 1, role: "GK", x: 50, y: 8 },
    { name: "アタンソフスキー", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "サウター", number: 4, role: "CB", x: 62, y: 20 },
    { name: "ローイズ", number: 6, role: "CB", x: 38, y: 20 },
    { name: "ベホイチ", number: 16, role: "左SB", x: 15, y: 22 },
    { name: "アーバイン", number: 22, role: "ボランチ", x: 60, y: 40 },
    { name: "ムイ", number: 13, role: "ボランチ", x: 40, y: 40 },
    { name: "レッキー", number: 7, role: "右AM", x: 82, y: 62 },
    { name: "デブニー", number: 8, role: "トップ下", x: 50, y: 62 },
    { name: "ヴェルザー", number: 10, role: "左AM", x: 18, y: 62 },
    { name: "デューク", number: 9, role: "CF", x: 50, y: 85 },
  ],
};

const TUR_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "モンテッラ",
  slots: [
    { name: "チャクル", number: 1, role: "GK", x: 50, y: 8 },
    { name: "チェリク", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "デミラル", number: 4, role: "CB", x: 62, y: 20 },
    { name: "アクギュン", number: 14, role: "CB", x: 38, y: 20 },
    { name: "カーディオール", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "ヤジュジュ", number: 6, role: "アンカー", x: 50, y: 40 },
    { name: "カリュメンドル", number: 17, role: "右IH", x: 70, y: 52 },
    { name: "チャルハノール", number: 10, role: "左IH（キャプテン）", x: 30, y: 52 },
    { name: "アクトゥルクオール", number: 22, role: "右WG", x: 85, y: 70 },
    { name: "ユルディズ", number: 21, role: "CF", x: 50, y: 80 },
    { name: "ギュレル", number: 7, role: "左WG", x: 15, y: 70 },
  ],
};

const GER_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "ナーゲルスマン",
  slots: [
    { name: "テア・シュテーゲン", number: 1, role: "GK", x: 50, y: 8 },
    { name: "キミッヒ", number: 6, role: "右SB（キャプテン）", x: 85, y: 22 },
    { name: "リューディガー", number: 2, role: "CB", x: 62, y: 20 },
    { name: "タァ", number: 4, role: "CB", x: 38, y: 20 },
    { name: "ラウム", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "アンドリッヒ", number: 23, role: "ボランチ", x: 60, y: 40 },
    { name: "ゲロチ", number: 14, role: "ボランチ", x: 40, y: 40 },
    { name: "ザネ", number: 19, role: "右AM", x: 82, y: 62 },
    { playerId: "wirtz", name: "ヴィルツ", number: 17, role: "トップ下", x: 50, y: 62 },
    { name: "ミュージアラ", number: 10, role: "左AM", x: 18, y: 62 },
    { name: "クライントマー", number: 9, role: "CF", x: 50, y: 85 },
  ],
};

const CUW_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "アドフォカート",
  slots: [
    { name: "ロマー", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ベルクハウス", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "ピーターズ", number: 4, role: "CB", x: 62, y: 20 },
    { name: "シンクハウト", number: 5, role: "CB", x: 38, y: 20 },
    { name: "バカイマ", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "ヴァン・ウィンクル", number: 8, role: "アンカー", x: 50, y: 40 },
    { name: "サンビーニョ", number: 10, role: "右IH", x: 70, y: 52 },
    { name: "ロンメダル", number: 6, role: "左IH", x: 30, y: 52 },
    { name: "バフカネス", number: 7, role: "右WG", x: 85, y: 70 },
    { name: "ジェンマール", number: 9, role: "CF", x: 50, y: 80 },
    { name: "クルゼン", number: 11, role: "左WG", x: 15, y: 70 },
  ],
};

const CIV_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "ファエ",
  slots: [
    { name: "サンガレ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "アウラベ", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "ンドリ", number: 4, role: "CB", x: 62, y: 20 },
    { name: "オディアール", number: 5, role: "CB", x: 38, y: 20 },
    { name: "コナテ", number: 14, role: "左SB", x: 15, y: 22 },
    { name: "セリ", number: 8, role: "アンカー", x: 50, y: 40 },
    { name: "セコ・フォファナ", number: 10, role: "右IH", x: 70, y: 52 },
    { name: "サンガレ", number: 6, role: "左IH", x: 30, y: 52 },
    { name: "ペペ", number: 19, role: "右WG", x: 85, y: 70 },
    { name: "オリーズ", number: 11, role: "CF", x: 50, y: 80 },
    { playerId: "sarr", name: "サー", number: 7, role: "左WG", x: 15, y: 70 },
  ],
};

const ECU_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "ベッカリーニ",
  slots: [
    { name: "ガレシオ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "プレシアド", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "トーレス", number: 4, role: "CB", x: 62, y: 20 },
    { name: "イノカリー", number: 5, role: "CB", x: 38, y: 20 },
    { name: "エストゥピニャン", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "カイセド", number: 23, role: "アンカー", x: 50, y: 40 },
    { name: "フランコ", number: 13, role: "右IH", x: 70, y: 52 },
    { name: "ペーチェ", number: 6, role: "左IH", x: 30, y: 52 },
    { name: "プラタ", number: 18, role: "右WG", x: 85, y: 70 },
    { name: "バレンシア", number: 17, role: "CF", x: 50, y: 80 },
    { name: "サラビア", number: 11, role: "左WG", x: 15, y: 70 },
  ],
};

const BEL_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "ガルシア",
  slots: [
    { name: "クルトワ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "カステーニュ", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "ファエス", number: 4, role: "CB", x: 62, y: 20 },
    { name: "デ・カイペル", number: 5, role: "CB", x: 38, y: 20 },
    { name: "テアテ", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "オンヤン", number: 8, role: "ボランチ", x: 60, y: 40 },
    { name: "ティーレマンス", number: 7, role: "ボランチ", x: 40, y: 40 },
    { name: "デ・ブライネ", number: 10, role: "右AM（キャプテン）", x: 82, y: 62 },
    { name: "オペンダ", number: 11, role: "トップ下", x: 50, y: 62 },
    { name: "ドク", number: 19, role: "左AM", x: 18, y: 62 },
    { name: "ルケバキオ", number: 9, role: "CF", x: 50, y: 85 },
  ],
};

const EGY_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "ハッサン",
  slots: [
    { name: "エル・シェナーウィ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ハマディ", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "アシュラフ", number: 5, role: "CB", x: 62, y: 20 },
    { name: "ヘガジ", number: 6, role: "CB", x: 38, y: 20 },
    { name: "アブデルモネム", number: 13, role: "左SB", x: 15, y: 22 },
    { name: "エルネニー", number: 17, role: "アンカー", x: 50, y: 40 },
    { name: "クカ", number: 8, role: "右IH", x: 70, y: 52 },
    { name: "サブリ", number: 10, role: "左IH", x: 30, y: 52 },
    { name: "サラ", number: 11, role: "右WG（キャプテン）", x: 85, y: 70 },
    { name: "モハメド", number: 9, role: "CF", x: 50, y: 80 },
    { name: "トレジゲ", number: 21, role: "左WG", x: 15, y: 70 },
  ],
};

const IRN_LINEUP: PredictedLineup = {
  formation: "3-4-2-1",
  manager: "ガレノエイ",
  slots: [
    { name: "ベイランバンド", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ホセイニ", number: 3, role: "CB右", x: 70, y: 20 },
    { name: "プールアリガンジ", number: 8, role: "CB", x: 50, y: 18 },
    { name: "モハマディ", number: 5, role: "CB左", x: 30, y: 20 },
    { name: "ジャハンバクシュ", number: 7, role: "右WB", x: 88, y: 45 },
    { name: "エザトラヒ", number: 6, role: "ボランチ", x: 60, y: 50 },
    { name: "ヌーラフカン", number: 18, role: "ボランチ", x: 40, y: 50 },
    { name: "ガジザデ", number: 14, role: "左WB", x: 12, y: 45 },
    { name: "アズムン", number: 20, role: "シャドー", x: 65, y: 68 },
    { name: "ターレミ", number: 9, role: "シャドー", x: 35, y: 68 },
    { name: "アンサリファルド", number: 11, role: "CF", x: 50, y: 82 },
  ],
};

const NZL_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "ハイ",
  slots: [
    { name: "クライン", number: 1, role: "GK", x: 50, y: 8 },
    { name: "リード", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "ボクスオール", number: 5, role: "CB", x: 62, y: 20 },
    { name: "アシュリー・ペデルセン", number: 6, role: "CB", x: 38, y: 20 },
    { name: "ペイン", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "アール", number: 4, role: "アンカー", x: 50, y: 40 },
    { name: "ベヴァン", number: 8, role: "右IH", x: 70, y: 52 },
    { name: "ガレス", number: 7, role: "左IH", x: 30, y: 52 },
    { name: "ガッリック", number: 11, role: "右WG", x: 85, y: 70 },
    { name: "ウッド", number: 9, role: "CF（キャプテン）", x: 50, y: 80 },
    { name: "オレリー", number: 10, role: "左WG", x: 15, y: 70 },
  ],
};

const CPV_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "ロペス",
  slots: [
    { name: "ヴォサ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "テイショス", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "ロジー", number: 5, role: "CB", x: 62, y: 20 },
    { name: "ロベルト", number: 4, role: "CB", x: 38, y: 20 },
    { name: "デイブ", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "ホレイス", number: 6, role: "アンカー", x: 50, y: 40 },
    { name: "リバルド", number: 8, role: "右IH", x: 70, y: 52 },
    { name: "ベベ", number: 10, role: "左IH", x: 30, y: 52 },
    { name: "メンデス", number: 7, role: "右WG", x: 85, y: 70 },
    { name: "セメド", number: 9, role: "CF", x: 50, y: 80 },
    { name: "リエル", number: 11, role: "左WG", x: 15, y: 70 },
  ],
};

const KSA_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "マンチーニ",
  slots: [
    { name: "アル・オワイス", number: 1, role: "GK", x: 50, y: 8 },
    { name: "アブドゥル・ハミド", number: 12, role: "右SB", x: 85, y: 22 },
    { name: "アル・タンバクティ", number: 5, role: "CB", x: 62, y: 20 },
    { name: "アル・ブライーカン", number: 4, role: "CB", x: 38, y: 20 },
    { name: "アル・シャハラニ", number: 13, role: "左SB", x: 15, y: 22 },
    { name: "アル・ファラジ", number: 7, role: "ボランチ", x: 60, y: 40 },
    { name: "カンノ", number: 8, role: "ボランチ", x: 40, y: 40 },
    { name: "アル・ドサリ", number: 10, role: "右AM（キャプテン）", x: 82, y: 62 },
    { name: "アル・ガンナム", number: 14, role: "トップ下", x: 50, y: 62 },
    { name: "アル・ナジェ", number: 17, role: "左AM", x: 18, y: 62 },
    { name: "アル・シャハーリ", number: 9, role: "CF", x: 50, y: 85 },
  ],
};

const URU_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "ビエルサ",
  slots: [
    { name: "ロチェ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ナンデス", number: 4, role: "右SB", x: 85, y: 22 },
    { name: "ヒメネス", number: 2, role: "CB", x: 62, y: 20 },
    { name: "アラオス", number: 13, role: "CB", x: 38, y: 20 },
    { name: "オリベラ", number: 17, role: "左SB", x: 15, y: 22 },
    { name: "バルベルデ", number: 15, role: "アンカー", x: 50, y: 40 },
    { name: "ベンタンクル", number: 6, role: "右IH", x: 70, y: 52 },
    { name: "ウガルテ", number: 5, role: "左IH", x: 30, y: 52 },
    { name: "ヌネス", number: 19, role: "右WG", x: 85, y: 70 },
    { name: "スアレス", number: 9, role: "CF", x: 50, y: 80 },
    { name: "ペッリストリ", number: 11, role: "左WG", x: 15, y: 70 },
  ],
};

const FRA_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "デシャン",
  slots: [
    { name: "マイニャン", number: 16, role: "GK", x: 50, y: 8 },
    { name: "クンデ", number: 5, role: "右SB", x: 85, y: 22 },
    { name: "サリバ", number: 17, role: "CB", x: 62, y: 20 },
    { name: "ウパメカノ", number: 4, role: "CB", x: 38, y: 20 },
    { name: "T. エルナンデス", number: 22, role: "左SB", x: 15, y: 22 },
    { name: "チュアメニ", number: 8, role: "ボランチ", x: 60, y: 40 },
    { name: "カンテ", number: 13, role: "ボランチ", x: 40, y: 40 },
    { name: "デンベレ", number: 11, role: "右AM", x: 82, y: 62 },
    { name: "グリーズマン", number: 7, role: "トップ下", x: 50, y: 62 },
    { name: "ムバッペ", number: 10, role: "左AM（キャプテン）", x: 18, y: 62 },
    { name: "コロ・ムアニ", number: 12, role: "CF", x: 50, y: 85 },
  ],
};

const SEN_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "シセ",
  slots: [
    { name: "メンディ", number: 16, role: "GK", x: 50, y: 8 },
    { name: "ジャクパ", number: 19, role: "右SB", x: 85, y: 22 },
    { name: "クリバリ", number: 3, role: "CB（キャプテン）", x: 62, y: 20 },
    { name: "シス", number: 17, role: "CB", x: 38, y: 20 },
    { name: "ジョミビン", number: 22, role: "左SB", x: 15, y: 22 },
    { name: "パブ・サール", number: 6, role: "アンカー", x: 50, y: 40 },
    { name: "ガッセ", number: 8, role: "右IH", x: 70, y: 52 },
    { name: "メンディ", number: 10, role: "左IH", x: 30, y: 52 },
    { name: "イスマイラ・サール", number: 9, role: "右WG", x: 85, y: 70 },
    { name: "マネ", number: 14, role: "CF", x: 50, y: 80 },
    { name: "ジャロウ", number: 11, role: "左WG", x: 15, y: 70 },
  ],
};

const IRQ_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "アルナラス",
  slots: [
    { name: "ジャレル", number: 1, role: "GK", x: 50, y: 8 },
    { name: "アル・アムリ", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "イマド", number: 4, role: "CB", x: 62, y: 20 },
    { name: "アシッシ", number: 5, role: "CB", x: 38, y: 20 },
    { name: "アル・ハリディ", number: 14, role: "左SB", x: 15, y: 22 },
    { name: "バヤト", number: 6, role: "ボランチ", x: 60, y: 40 },
    { name: "アリ", number: 8, role: "ボランチ", x: 40, y: 40 },
    { name: "ハサン", number: 10, role: "右AM", x: 82, y: 62 },
    { name: "レソン", number: 17, role: "トップ下", x: 50, y: 62 },
    { name: "サアド", number: 7, role: "左AM", x: 18, y: 62 },
    { name: "アイモン", number: 9, role: "CF", x: 50, y: 85 },
  ],
};

const NOR_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "ソルバッケン",
  slots: [
    { name: "ニランド", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ペデルセン", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "アヤー", number: 5, role: "CB", x: 62, y: 20 },
    { name: "リシュトレム", number: 6, role: "CB", x: 38, y: 20 },
    { name: "メイヤー", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "ベリ", number: 8, role: "アンカー", x: 50, y: 40 },
    { name: "オーゲ", number: 10, role: "右IH", x: 70, y: 52 },
    { name: "ベディン", number: 7, role: "左IH", x: 30, y: 52 },
    { name: "ボベ", number: 11, role: "右WG", x: 85, y: 70 },
    { name: "ハーランド", number: 9, role: "CF（キャプテン）", x: 50, y: 80 },
    { name: "シェルデルプ", number: 17, role: "左WG", x: 15, y: 70 },
  ],
};

const ARG_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "スカローニ",
  slots: [
    { name: "E. マルティネス", number: 23, role: "GK", x: 50, y: 8 },
    { name: "モリーナ", number: 26, role: "右SB", x: 85, y: 22 },
    { name: "ロメロ", number: 13, role: "CB", x: 62, y: 20 },
    { name: "リサンドロ", number: 25, role: "CB", x: 38, y: 20 },
    { name: "タリアフィコ", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "デ・パウル", number: 7, role: "アンカー", x: 50, y: 40 },
    { name: "マッカリスター", number: 20, role: "右IH", x: 70, y: 52 },
    { name: "エンソ・フェルナンデス", number: 24, role: "左IH", x: 30, y: 52 },
    { name: "メッシ", number: 10, role: "右WG（キャプテン）", x: 85, y: 70 },
    { name: "L. マルティネス", number: 22, role: "CF", x: 50, y: 80 },
    { name: "アルバレス", number: 9, role: "左WG", x: 15, y: 70 },
  ],
};

const ALG_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "プチ",
  slots: [
    { name: "ンビョリ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "アタル", number: 13, role: "右SB", x: 85, y: 22 },
    { name: "ベンラフラ", number: 5, role: "CB", x: 62, y: 20 },
    { name: "マンディ", number: 4, role: "CB", x: 38, y: 20 },
    { name: "ベンサイダ", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "ベンチェジャ", number: 6, role: "アンカー", x: 50, y: 40 },
    { name: "ザフール", number: 8, role: "右IH", x: 70, y: 52 },
    { name: "ベルマディ", number: 10, role: "左IH", x: 30, y: 52 },
    { name: "ベルテ", number: 11, role: "右WG", x: 85, y: 70 },
    { name: "スリマニ", number: 9, role: "CF", x: 50, y: 80 },
    { name: "マヘレズ", number: 7, role: "左WG（キャプテン）", x: 15, y: 70 },
  ],
};

const AUT_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "ロル",
  slots: [
    { name: "シュラーガー", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ポッシュ", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "リンドナー", number: 4, role: "CB", x: 62, y: 20 },
    { name: "アラバ", number: 8, role: "CB（キャプテン）", x: 38, y: 20 },
    { name: "ムウェネ", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "ザイヴァルト", number: 6, role: "ボランチ", x: 60, y: 40 },
    { name: "グリリッチ", number: 10, role: "ボランチ", x: 40, y: 40 },
    { name: "ライマー", number: 7, role: "右AM", x: 82, y: 62 },
    { name: "ザビツァー", number: 14, role: "トップ下", x: 50, y: 62 },
    { name: "バウムガルトナー", number: 19, role: "左AM", x: 18, y: 62 },
    { name: "アルナウトヴィッチ", number: 9, role: "CF", x: 50, y: 85 },
  ],
};

const JOR_LINEUP: PredictedLineup = {
  formation: "3-4-3",
  manager: "アンマール",
  slots: [
    { name: "アブラ・カリミ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ナサル", number: 3, role: "CB右", x: 70, y: 20 },
    { name: "アル・ライリ", number: 5, role: "CB", x: 50, y: 18 },
    { name: "アタ", number: 4, role: "CB左", x: 30, y: 20 },
    { name: "ハッダド", number: 7, role: "右WB", x: 88, y: 45 },
    { name: "アル・タマリ", number: 8, role: "ボランチ", x: 60, y: 50 },
    { name: "アル・ナイマト", number: 6, role: "ボランチ", x: 40, y: 50 },
    { name: "ハンナーン", number: 14, role: "左WB", x: 12, y: 45 },
    { name: "オラエン", number: 11, role: "右WG", x: 70, y: 78 },
    { name: "アル・サイファン", number: 9, role: "CF", x: 50, y: 82 },
    { name: "アズム", number: 10, role: "左WG", x: 30, y: 78 },
  ],
};

const POR_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "マルティネス",
  slots: [
    { name: "ジョゼ・サー", number: 22, role: "GK", x: 50, y: 8 },
    { name: "カンセロ", number: 20, role: "右SB", x: 85, y: 22 },
    { name: "ディアス", number: 3, role: "CB", x: 62, y: 20 },
    { name: "ペペ", number: 4, role: "CB", x: 38, y: 20 },
    { name: "メンデス", number: 5, role: "左SB", x: 15, y: 22 },
    { name: "ヴィティーニャ", number: 23, role: "アンカー", x: 50, y: 40 },
    { name: "B. フェルナンデス", number: 8, role: "右IH", x: 70, y: 52 },
    { name: "B. シルバ", number: 10, role: "左IH", x: 30, y: 52 },
    { name: "B. フェルナンデス", number: 11, role: "右WG", x: 85, y: 70 },
    { name: "C. ロナウド", number: 7, role: "CF（キャプテン）", x: 50, y: 80 },
    { name: "L. ジョルジ", number: 17, role: "左WG", x: 15, y: 70 },
  ],
};

const COD_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "デザビ",
  slots: [
    { name: "ムプンガ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ムベンバ", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "ンタンビ", number: 5, role: "CB", x: 62, y: 20 },
    { name: "シェンガ", number: 6, role: "CB", x: 38, y: 20 },
    { name: "マスゥアク", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "サムウェル", number: 8, role: "アンカー", x: 50, y: 40 },
    { name: "ンサキ", number: 10, role: "右IH", x: 70, y: 52 },
    { name: "ボンガ", number: 6, role: "左IH", x: 30, y: 52 },
    { name: "ジェレミ・ボンガ", number: 11, role: "右WG", x: 85, y: 70 },
    { name: "バカンボ", number: 9, role: "CF", x: 50, y: 80 },
    { name: "ボロンガ", number: 7, role: "左WG", x: 15, y: 70 },
  ],
};

const COL_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "ロレンソ",
  slots: [
    { name: "バスケス", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ムニョス", number: 4, role: "右SB", x: 85, y: 22 },
    { name: "サンチェス", number: 23, role: "CB", x: 62, y: 20 },
    { name: "ロドリ", number: 22, role: "CB", x: 38, y: 20 },
    { name: "モヒカ", number: 17, role: "左SB", x: 15, y: 22 },
    { name: "ロドリゲス", number: 10, role: "アンカー", x: 50, y: 40 },
    { name: "アリアス", number: 6, role: "右IH", x: 70, y: 52 },
    { name: "ロザノ", number: 16, role: "左IH", x: 30, y: 52 },
    { name: "クアドラード", number: 11, role: "右WG", x: 85, y: 70 },
    { name: "ボリージャ", number: 9, role: "CF", x: 50, y: 80 },
    { name: "ディアス", number: 7, role: "左WG", x: 15, y: 70 },
  ],
};

const UZB_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "カパゼ",
  slots: [
    { name: "ユスポフ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "クマロフ", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "アガレフ", number: 4, role: "CB", x: 62, y: 20 },
    { name: "クフタコフ", number: 5, role: "CB", x: 38, y: 20 },
    { name: "ヤルケンビン", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "ホナド", number: 6, role: "ボランチ", x: 60, y: 40 },
    { name: "アブラエフ", number: 8, role: "ボランチ", x: 40, y: 40 },
    { name: "アグディフ", number: 17, role: "右AM", x: 82, y: 62 },
    { name: "シャムロウ", number: 10, role: "トップ下", x: 50, y: 62 },
    { name: "ファイズロフ", number: 14, role: "左AM", x: 18, y: 62 },
    { name: "ワルカフ", number: 9, role: "CF", x: 50, y: 85 },
  ],
};

const ENG_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "テューシェル",
  slots: [
    { name: "ピックフォード", number: 1, role: "GK", x: 50, y: 8 },
    { name: "アレクサンダー=アーノルド", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "ストーンズ", number: 5, role: "CB", x: 62, y: 20 },
    { name: "コナー・ガラガー", number: 6, role: "CB", x: 38, y: 20 },
    { name: "ルーク・ショウ", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "デクラン・ライス", number: 4, role: "ボランチ", x: 60, y: 40 },
    { name: "ベリンガム", number: 10, role: "ボランチ", x: 40, y: 40 },
    { name: "B. サカ", number: 7, role: "右AM", x: 82, y: 62 },
    { name: "フォーデン", number: 11, role: "トップ下", x: 50, y: 62 },
    { name: "ロドリゴ・ベンテンクール", number: 17, role: "左AM", x: 18, y: 62 },
    { name: "ハリー・ケイン", number: 9, role: "CF（キャプテン）", x: 50, y: 85 },
  ],
};

const CRO_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "ダリッチ",
  slots: [
    { name: "リバコビッチ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "スタニシッチ", number: 19, role: "右SB", x: 85, y: 22 },
    { name: "シュタロ", number: 6, role: "CB", x: 62, y: 20 },
    { name: "グヴァルディオル", number: 20, role: "CB", x: 38, y: 20 },
    { name: "ペリシッチ", number: 4, role: "左SB", x: 15, y: 22 },
    { name: "ブロゾビッチ", number: 11, role: "アンカー", x: 50, y: 40 },
    { name: "モドリッチ", number: 10, role: "右IH（キャプテン）", x: 70, y: 52 },
    { name: "コヴァチッチ", number: 8, role: "左IH", x: 30, y: 52 },
    { name: "クラマリッチ", number: 7, role: "右WG", x: 85, y: 70 },
    { name: "ペトコビッチ", number: 9, role: "CF", x: 50, y: 80 },
    { name: "イヴァン・ペリシッチ", number: 4, role: "左WG", x: 15, y: 70 },
  ],
};

const GHA_LINEUP: PredictedLineup = {
  formation: "4-2-3-1",
  manager: "アディ",
  slots: [
    { name: "アティ・ジゲン", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ラムプティ", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "サリス", number: 5, role: "CB", x: 62, y: 20 },
    { name: "アジバオ", number: 6, role: "CB", x: 38, y: 20 },
    { name: "メンサー", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "クドゥス", number: 8, role: "ボランチ", x: 60, y: 40 },
    { name: "T. パートゥエイ", number: 4, role: "ボランチ", x: 40, y: 40 },
    { name: "アーレン", number: 10, role: "右AM", x: 82, y: 62 },
    { name: "シュトラリー", number: 17, role: "トップ下", x: 50, y: 62 },
    { name: "ジョーダン", number: 11, role: "左AM", x: 18, y: 62 },
    { name: "アユー", number: 9, role: "CF（キャプテン）", x: 50, y: 85 },
  ],
};

const PAN_LINEUP: PredictedLineup = {
  formation: "4-3-3",
  manager: "クリスチアンセン",
  slots: [
    { name: "モスケラ", number: 1, role: "GK", x: 50, y: 8 },
    { name: "ガジャルド", number: 2, role: "右SB", x: 85, y: 22 },
    { name: "デイビス", number: 4, role: "CB", x: 62, y: 20 },
    { name: "コルドバ", number: 5, role: "CB", x: 38, y: 20 },
    { name: "ロドリゲス", number: 3, role: "左SB", x: 15, y: 22 },
    { name: "バルセナス", number: 8, role: "アンカー", x: 50, y: 40 },
    { name: "ゴドイ", number: 6, role: "右IH", x: 70, y: 52 },
    { name: "ゴンザレス", number: 10, role: "左IH", x: 30, y: 52 },
    { name: "コックス", number: 11, role: "右WG", x: 85, y: 70 },
    { name: "ファハルド", number: 9, role: "CF", x: 50, y: 80 },
    { name: "ペレス", number: 7, role: "左WG", x: 15, y: 70 },
  ],
};

export const predictedLineups: Record<TeamId, PredictedLineup> = {
  jpn: JPN_LINEUP,
  ned: NED_LINEUP,
  esp: ESP_LINEUP,
  swe: SWE_LINEUP,
  tun: TUN_LINEUP,
  mex: MEX_LINEUP,
  rsa: RSA_LINEUP,
  kor: KOR_LINEUP,
  cze: CZE_LINEUP,
  can: CAN_LINEUP,
  bih: BIH_LINEUP,
  qat: QAT_LINEUP,
  sui: SUI_LINEUP,
  bra: BRA_LINEUP,
  mar: MAR_LINEUP,
  hai: HAI_LINEUP,
  sco: SCO_LINEUP,
  usa: USA_LINEUP,
  par: PAR_LINEUP,
  aus: AUS_LINEUP,
  tur: TUR_LINEUP,
  ger: GER_LINEUP,
  cuw: CUW_LINEUP,
  civ: CIV_LINEUP,
  ecu: ECU_LINEUP,
  bel: BEL_LINEUP,
  egy: EGY_LINEUP,
  irn: IRN_LINEUP,
  nzl: NZL_LINEUP,
  cpv: CPV_LINEUP,
  ksa: KSA_LINEUP,
  uru: URU_LINEUP,
  fra: FRA_LINEUP,
  sen: SEN_LINEUP,
  irq: IRQ_LINEUP,
  nor: NOR_LINEUP,
  arg: ARG_LINEUP,
  alg: ALG_LINEUP,
  aut: AUT_LINEUP,
  jor: JOR_LINEUP,
  por: POR_LINEUP,
  cod: COD_LINEUP,
  col: COL_LINEUP,
  uzb: UZB_LINEUP,
  eng: ENG_LINEUP,
  cro: CRO_LINEUP,
  gha: GHA_LINEUP,
  pan: PAN_LINEUP,
};

export function getPredictedLineup(teamId: string): PredictedLineup | undefined {
  return predictedLineups[teamId];
}
