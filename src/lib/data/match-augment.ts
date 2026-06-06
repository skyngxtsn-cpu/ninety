/**
 * OpenFootballの試合データに、初心者向けの「意味」「ストーリー」「注目選手」を
 * 重ねる手書きデータ。組み合わせ（小文字fifa_code, ソート済み）で参照する。
 *
 * 例: 日本 vs オランダ → "jpn-ned"
 */

import type { Broadcast, PlayerId } from "../types";

export type Augmentation = {
  hook: string;
  meaning: { homeWin: string; draw: string; awayWin: string };
  storylines: [string, string, string];
  keyPlayerIds: PlayerId[];
  broadcasts: Broadcast[];
};

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

const data: Record<string, Augmentation> = {
  // 日本のグループF全試合
  [pairKey("jpn", "ned")]: {
    hook: "強敵オランダ、初戦の試金石。",
    meaning: {
      homeWin: "突破に大きく前進。グループF首位浮上もあり得る。",
      draw: "勝点1で五分のスタート。残り2戦で逆算しやすくなる。",
      awayWin: "突破争いが厳しくなる。最終戦が運命の決戦に。",
    },
    storylines: [
      "強豪オランダ相手に、遠藤が支える日本の中盤がどこまで通用するか",
      "久保 vs オランダ守備陣、スペイン仕込みの個の力対決",
      "勝てば前回大会の「ドイツ撃破」級のインパクト",
    ],
    keyPlayerIds: ["kubo", "endo", "tomiyasu"],
    broadcasts: [],
  },
  [pairKey("jpn", "tun")]: {
    hook: "勝てば突破がぐっと近づく一戦。",
    meaning: {
      homeWin: "突破にほぼ手が届く。3戦目の戦い方を選べる立場に。",
      draw: "勝点を持ち越し、最終戦で勝負。",
      awayWin: "突破にかなり厳しい状況。最終戦で勝利が必須。",
    },
    storylines: [
      "アフリカの堅守を破れるか、日本の崩しの完成度",
      "前回大会フランスを撃破したチュニジア、再現許すな",
      "上田・前田の前線が決定機を仕留められるか",
    ],
    keyPlayerIds: ["ueda", "doan", "kubo"],
    broadcasts: [],
  },
  [pairKey("jpn", "swe")]: {
    hook: "突破がかかる、運命の最終戦。",
    meaning: {
      homeWin: "突破ほぼ確定、首位通過の可能性も。",
      draw: "他会場の結果次第で突破決定。",
      awayWin: "突破が極めて厳しくなる。",
    },
    storylines: [
      "イサクとギェケレシュ、北欧の決定力に冨安が立ちはだかる",
      "高さで殴られる前に、技術と機動力で先手を取れるか",
      "前回大会の英雄・堂安が再びドラマを作れるか",
    ],
    keyPlayerIds: ["tomiyasu", "doan", "zsuzuki"],
    broadcasts: [],
  },

  // 注目カード
  [pairKey("bra", "arg")]: {
    hook: "南米クラシコ、ついに来る。",
    meaning: {
      homeWin: "ブラジルが首位浮上、優勝候補としての貫禄を示す。",
      draw: "両国とも突破前進、最終戦次第。",
      awayWin: "アルゼンチン首位浮上、メッシ最後の大会に弾みがつく。",
    },
    storylines: [
      "メッシのW杯ラストダンス、ブラジル相手に",
      "ヴィニシウス vs アルゼンチン守備陣",
      "勝った方がグループ首位通過にぐっと近づく",
    ],
    keyPlayerIds: ["messi", "vinicius"],
    broadcasts: [],
  },
  [pairKey("esp", "por")]: {
    hook: "イベリア半島の隣国対決。",
    meaning: {
      homeWin: "Euro王者の貫禄を示し、優勝候補の地位を確立。",
      draw: "両国の実力が拮抗、最終戦は緊迫の展開に。",
      awayWin: "ポルトガル復活、Cロナウド最後の挑戦に光。",
    },
    storylines: [
      "Cロナウド最後のW杯、若きヤマルとの世代交代対決",
      "イベリア半島同士のプライドの一戦",
      "Euro 2024王者スペインの真価が問われる",
    ],
    keyPlayerIds: ["yamal", "rodri", "pedri"],
    broadcasts: [],
  },
  [pairKey("eng", "fra")]: {
    hook: "優勝候補同士の頂上対決。",
    meaning: {
      homeWin: "イングランド、56年ぶりの本気が現実味を帯びる。",
      draw: "両者ともに勝点を分け合い、最終戦に持ち越し。",
      awayWin: "フランス、優勝への最短ルートが見える。",
    },
    storylines: [
      "前回準々決勝の再戦、イングランドの雪辱戦",
      "個の質トップ同士、誰が決めるかの叩き合いに",
      "勝った方が決勝Tの楽な山を引く",
    ],
    keyPlayerIds: [],
    broadcasts: [],
  },
};

export function getAugmentation(team1Id: string, team2Id: string): Augmentation | undefined {
  return data[pairKey(team1Id, team2Id)];
}

/**
 * augmentationがない試合用の、対戦カードからの自動生成フォールバック。
 * 「とりあえず何か出す」をAIに置き換えるのは将来のステップ。
 */
export function defaultAugmentation(
  team1Name: string,
  team2Name: string,
  isJapanTier1: boolean
): Augmentation {
  const tier = isJapanTier1 ? "日本の突破争いに直結" : "グループの行方を左右する";
  return {
    hook: `${team1Name} vs ${team2Name}、${tier}一戦。`,
    meaning: {
      homeWin: `${team1Name}が勝点3を獲得、突破に前進。`,
      draw: "勝点1を分け合う、互角の展開。",
      awayWin: `${team2Name}が勝点3を獲得、突破に前進。`,
    },
    storylines: [
      `${team1Name}と${team2Name}、W杯本選での真剣勝負`,
      "両国のスター選手たちの個の対決に注目",
      "グループ通過順位を左右する可能性",
    ],
    keyPlayerIds: [],
    broadcasts: [],
  };
}
