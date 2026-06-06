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

export const predictedLineups: Record<TeamId, PredictedLineup> = {
  jpn: JPN_LINEUP,
  ned: NED_LINEUP,
  esp: ESP_LINEUP,
  swe: SWE_LINEUP,
  tun: TUN_LINEUP,
};

export function getPredictedLineup(teamId: string): PredictedLineup | undefined {
  return predictedLineups[teamId];
}
