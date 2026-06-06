import type { Player } from "../types";
import { autoPlayersFromSquads } from "./squad-loader";

/**
 * 手書き（curated）選手リスト。深掘りした story を持つ主力。
 * 出典: Wikipedia "2026 FIFA World Cup squads" (2026-05-15 発表)
 * 写真: TheSportsDB (cutout PNG)
 *
 * 残り 200+ 名は squads.json から自動で補完される（同IDがあればこちらが優先）。
 */
export const curatedPlayers: Player[] = [
  // 日本（W杯2026最終メンバー）
  {
    id: "kubo",
    name: "久保 建英",
    nameRomaji: "Takefusa Kubo",
    teamId: "jpn",
    age: 24,
    club: "レアル・ソシエダ",
    position: "MF",
    number: 8,
    story: [
      "日本代表の攻撃の中心。「和製メッシ」と呼ばれた天才。",
      "ドリブルとラストパスでチャンスを作り続ける万能型。",
      "スペインで結果を残し、今大会のキーマンと目される。",
    ],
    tagline: "攻撃の指揮棒",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/bb8sw01762709094.png",
    birthPlace: "川崎市 (神奈川)",
    birthDate: "2001-06-04",
    heightCm: 173,
    preferredFoot: "L",
    caps: 49,
    internationalGoals: 7,
    strengths: [
      { label: "テクニック", rating: 5 },
      { label: "ドリブル", rating: 5 },
      { label: "ラストパス", rating: 4.5 },
      { label: "シュート", rating: 4 },
      { label: "守備", rating: 2.5 },
    ],
    careerPath: [
      { period: "2011-2015", club: "川崎フロンターレ U-12/U-15", note: "Jリーグ下部組織" },
      { period: "2015-2018", club: "FCバルセロナ U-12〜B", note: "10歳でラ・マシアへ" },
      { period: "2018-2019", club: "FC東京", note: "Jリーグデビュー、17歳" },
      { period: "2019-2022", club: "レアル・マドリードCV → 各クラブ・ローン", note: "マジョルカ / ヘタフェ / ビジャレアル" },
      { period: "2022-現在", club: "レアル・ソシエダ", note: "CLにも出場、エースに" },
    ],
    signatureMoment: {
      title: "2022 W杯ドイツ戦の右足アシスト",
      body:
        "0-1ビハインドの後半、途中出場の堂安が決めた同点弾の起点となるロングフィードを供給。日本サッカー史に残る番狂わせの立役者の一人に。",
    },
    whyWatch:
      "「ボールを足元に置いた瞬間が世界一綺麗」——その一瞬の止め蹴りを見るだけで、サッカーの技術の凄みがわかる選手。",
  },
  {
    id: "endo",
    name: "遠藤 航",
    nameRomaji: "Wataru Endo",
    teamId: "jpn",
    age: 33,
    club: "リヴァプール",
    position: "MF",
    number: 6,
    story: [
      "日本代表キャプテン、プレミア王者リヴァプールの中盤の番人。",
      "ボール奪取と統率力で、激戦区で完全に主軸を担う存在。",
      "「デュエル王」と呼ばれる対人の強さで日本の心臓を守る。",
    ],
    tagline: "誇り高きキャプテン",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/eawsfp1757087920.png",
    birthPlace: "湯河原町 (神奈川)",
    birthDate: "1993-02-09",
    heightCm: 178,
    preferredFoot: "R",
    caps: 73,
    internationalGoals: 4,
    strengths: [
      { label: "デュエル", rating: 5 },
      { label: "ボール奪取", rating: 5 },
      { label: "戦術理解", rating: 4.5 },
      { label: "リーダーシップ", rating: 5 },
      { label: "技術", rating: 3.5 },
    ],
    careerPath: [
      { period: "2011-2015", club: "湘南ベルマーレ", note: "Jリーグデビュー" },
      { period: "2015-2018", club: "浦和レッズ", note: "ACL制覇 (2017)" },
      { period: "2018-2019", club: "シントトロイデン", note: "ベルギーで欧州デビュー" },
      { period: "2019-2023", club: "VfBシュトゥットガルト", note: "ブンデスでデュエル王、ベテラン主軸に" },
      { period: "2023-現在", club: "リヴァプール", note: "プレミアリーグ・CL の舞台へ" },
    ],
    signatureMoment: {
      title: "2023年クロップ「彼は世界最高のデュエラーだ」",
      body:
        "リヴァプール加入1年目に怪我人続出の中盤で先発、空中戦・対人で圧倒。世界トップクラスの監督から異例の高評価を受け、プレミア王者の主力に。",
    },
    whyWatch:
      "派手なプレーではなく「ピッチで戦う姿勢」が分かる選手。1対1で潰される姿が一度もない90分を、最後まで見届けて欲しい。",
  },
  {
    id: "doan",
    name: "堂安 律",
    nameRomaji: "Ritsu Doan",
    teamId: "jpn",
    age: 27,
    club: "アイントラハト・フランクフルト",
    position: "MF",
    number: 10,
    story: [
      "前回大会、ドイツ戦・スペイン戦で歴史的ゴールを決めた男。",
      "右サイドからのカットインと強烈な左足が必殺武器。",
      "ブンデスで磨かれた決定力で、ここぞの場面を作る。",
    ],
    tagline: "番狂わせの主役",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/6526j01762287692.png",
    birthPlace: "尼崎市 (兵庫)",
    birthDate: "1998-06-16",
    heightCm: 172,
    preferredFoot: "L",
    caps: 65,
    internationalGoals: 11,
    strengths: [
      { label: "ミドルシュート", rating: 5 },
      { label: "ドリブル", rating: 4.5 },
      { label: "判断力", rating: 4.5 },
      { label: "メンタル", rating: 5 },
      { label: "守備", rating: 3.5 },
    ],
    careerPath: [
      { period: "2017-2019", club: "ガンバ大阪", note: "Jリーグデビュー、U-20W杯出場" },
      { period: "2019-2020", club: "フローニンゲン", note: "オランダで欧州デビュー" },
      { period: "2020-2023", club: "PSV", note: "オランダ王者の主力に" },
      { period: "2023-現在", club: "アイントラハト・フランクフルト", note: "ブンデスで二桁ゴール" },
    ],
    signatureMoment: {
      title: "2022 W杯ドイツ戦の同点弾",
      body:
        "0-1ビハインドの後半、途中出場直後に左から右足を強振。ドイツゴール左隅へ突き刺さり、世紀の番狂わせの口火を切った。",
    },
    whyWatch:
      "「ここぞ」の場面で必ず仕事をする。長距離砲のシュートが本気で枠を捉える時の威力は世界クラス。試合終盤、彼の足元にボールが来た瞬間に注目。",
  },
  {
    id: "kamada",
    name: "鎌田 大地",
    nameRomaji: "Daichi Kamada",
    teamId: "jpn",
    age: 29,
    club: "クリスタル・パレス",
    position: "MF",
    number: 15,
    story: [
      "高い技術と判断力で攻撃をつなぐ、プレミアで戦う司令塔。",
      "落ち着いた展開とラストパスでチームのテンポを作る。",
      "前線と中盤をつなぐ「攻撃のスイッチ」の役割。",
    ],
    tagline: "司令塔",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/xajscx1761492482.png",
  },
  {
    id: "maeda",
    name: "前田 大然",
    nameRomaji: "Daizen Maeda",
    teamId: "jpn",
    age: 28,
    club: "セルティック",
    position: "MF",
    number: 11,
    story: [
      "止まらないスピードと運動量、走れる前線の異端児。",
      "スコットランドでゴール量産、「走るFW」として欠かせない存在。",
      "前回大会クロアチア戦でゴール、大舞台に強い。",
    ],
    tagline: "止まらない走力",
    photoUrl: "https://www.thesportsdb.com/images/media/player/cutout/oohjhs1777019949.png",
  },
  {
    id: "tomiyasu",
    name: "冨安 健洋",
    nameRomaji: "Takehiro Tomiyasu",
    teamId: "jpn",
    age: 27,
    club: "アヤックス",
    position: "DF",
    number: 22,
    story: [
      "両サイドとセンターをこなす万能DF。",
      "対人と判断力は世界クラス、欧州主要リーグで揉まれた経験豊富。",
      "強豪と戦う日本の最後の砦。",
    ],
    tagline: "守備の支柱",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/sfhhub1694204158.png",
  },
  {
    id: "ueda",
    name: "上田 綺世",
    nameRomaji: "Ayase Ueda",
    teamId: "jpn",
    age: 27,
    club: "フェイエノールト",
    position: "FW",
    number: 18,
    story: [
      "オランダで結果を残した日本の本格派センターフォワード。",
      "高さと足元の技術を併せ持つ、現代型ストライカー。",
      "代表でも実績を残し、エースの座を確立しつつある。",
    ],
    tagline: "決定力",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/5ezc8v1758188908.png",
    birthPlace: "鹿嶋市 (茨城)",
    birthDate: "1998-08-28",
    heightCm: 182,
    preferredFoot: "R",
    caps: 32,
    internationalGoals: 11,
    strengths: [
      { label: "シュート精度", rating: 5 },
      { label: "ポストプレー", rating: 4.5 },
      { label: "空中戦", rating: 4 },
      { label: "ファーストタッチ", rating: 4.5 },
      { label: "走力", rating: 3.5 },
    ],
    careerPath: [
      { period: "2017-2020", club: "法政大学", note: "大学サッカー強豪校" },
      { period: "2020-2022", club: "鹿島アントラーズ", note: "Jリーグデビュー、エース格に" },
      { period: "2022-2023", club: "セルクル・ブルッヘ", note: "ベルギーで欧州デビュー" },
      { period: "2023-現在", club: "フェイエノールト", note: "オランダ屈指のCFに成長" },
    ],
    signatureMoment: {
      title: "2024 アジアカップ得点ランキング上位",
      body: "苦戦した日本代表で1人気を吐き、空中戦と左右両足で得点を量産。「日本のエースは上田」を世界に示した。",
    },
    whyWatch: "「9番らしい9番」が日本代表に久しぶりに登場。ペナルティ内での落ち着きが、これまでの日本のFWと一線を画す。",
  },
  {
    id: "sugawara",
    name: "菅原 由勢",
    nameRomaji: "Yukinari Sugawara",
    teamId: "jpn",
    age: 25,
    club: "ヴェルダー・ブレーメン",
    position: "DF",
    number: 2,
    story: [
      "ブンデスで主軸を張る右サイドバック。",
      "攻撃参加のクオリティが高く、サイドの起点になる。",
      "若くして代表の主力に定着した新世代の象徴。",
    ],
    tagline: "攻撃的右SB",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/9znmfg1763666295.png",
  },
  {
    id: "itakura",
    name: "板倉 滉",
    nameRomaji: "Ko Itakura",
    teamId: "jpn",
    age: 29,
    club: "アヤックス",
    position: "DF",
    number: 4,
    story: [
      "対人に強く、ビルドアップにも参加できる現代型CB。",
      "オランダの名門アヤックスで主力を担うレベル。",
      "日本の最終ラインを統率する声と判断のリーダー。",
    ],
    tagline: "守備の指揮者",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/v3ptg81759497926.png",
  },
  {
    id: "taniguchi",
    name: "谷口 彰悟",
    nameRomaji: "Shogo Taniguchi",
    teamId: "jpn",
    age: 34,
    club: "シント・トロイデン",
    position: "DF",
    number: 3,
    story: [
      "ベテランCB、ラインの統率と空中戦に絶対の安定感。",
      "前回大会も主力として戦った経験豊富な守備の柱。",
      "落ち着いたパス回しで後ろからゲームを作る。",
    ],
    tagline: "ベテランCB",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/jo3sz21767196242.png",
  },
  {
    id: "hito",
    name: "伊藤 洋輝",
    nameRomaji: "Hiroki Ito",
    teamId: "jpn",
    age: 26,
    club: "バイエルン",
    position: "DF",
    number: 21,
    story: [
      "バイエルンで戦う左利きのDF、左SBもCBもこなす万能型。",
      "長いフィードと落ち着きのある守備対応が持ち味。",
      "ヨーロッパ最高峰のクラブで揉まれた左サイドの要。",
    ],
    tagline: "左の万能DF",
  },
  {
    id: "tanakaao",
    name: "田中 碧",
    nameRomaji: "Ao Tanaka",
    teamId: "jpn",
    age: 27,
    club: "リーズ",
    position: "MF",
    number: 7,
    story: [
      "判断と運動量で中盤を支えるダブルボランチの片翼。",
      "プレミアのリーズで戦う経験を本選にぶつける。",
      "ボール奪取と展開の両方ができる、遠藤の相棒。",
    ],
    tagline: "中盤の相棒",
  },
  {
    id: "zsuzuki",
    name: "鈴木 彩艶",
    nameRomaji: "Zion Suzuki",
    teamId: "jpn",
    age: 23,
    club: "パルマ",
    position: "GK",
    number: 1,
    story: [
      "日本代表の守護神、長身を生かしたセービングが武器。",
      "セリエAパルマで主力GKとして揉まれた経験を持つ。",
      "若くして正GKの座を掴み、新世代の象徴となった存在。",
    ],
    tagline: "最後の砦",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/24eahn1759780929.png",
  },

  // ドイツ
  {
    id: "wirtz",
    name: "ヴィルツ",
    teamId: "ger",
    age: 23,
    club: "リヴァプール",
    position: "MF",
    number: 10,
    story: [
      "ドイツの未来を背負う10番、創造性の塊。",
      "狭いスペースでの判断とラストパスが武器。",
      "「次のメッシ候補」と評される世代を代表する才能。",
    ],
    tagline: "10番の創造主",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/8t6bzo1757088899.png",
    birthPlace: "プルマースエンド (西ドイツ)",
    birthDate: "2003-05-03",
    heightCm: 176,
    preferredFoot: "R",
    caps: 36,
    internationalGoals: 7,
    strengths: [
      { label: "創造性", rating: 5 },
      { label: "ラストパス", rating: 5 },
      { label: "テクニック", rating: 5 },
      { label: "シュート", rating: 4 },
      { label: "フィジカル", rating: 3.5 },
    ],
    careerPath: [
      { period: "2010-2020", club: "バイエル・レバークーゼン・アカデミー" },
      { period: "2020-2025", club: "バイエル・レバークーゼン", note: "2024 ブンデス無敗優勝の中核に" },
      { period: "2025-現在", club: "リヴァプール", note: "ドイツ史上最高額の移籍金で移籍" },
    ],
    signatureMoment: {
      title: "2024 ブンデス無敗優勝の象徴",
      body:
        "レバークーゼンを史上初のブンデス無敗優勝に導いた創造の中心。終盤の同点弾・決勝弾を量産する「ラストミニッツの王」と呼ばれた。",
    },
    whyWatch:
      "狭いところで一瞬の判断で局面を変えるラストパスの天才。彼が前を向いた瞬間、ゴールキーパーの心拍数が上がるタイプの選手。",
  },
  {
    id: "musiala",
    name: "ムシアラ",
    teamId: "ger",
    age: 23,
    club: "バイエルン",
    position: "MF",
    number: 14,
    story: [
      "細身から繰り出すドリブルが芸術的なアタッカー。",
      "イングランド育ちでドイツを選んだ「逆輸入の宝石」。",
      "重心の低さで世界中のDFを翻弄する。",
    ],
    tagline: "踊るドリブル",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/vbkv611756416067.png",
  },
  {
    id: "havertz",
    name: "ハフェルツ",
    teamId: "ger",
    age: 27,
    club: "アーセナル",
    position: "FW",
    number: 9,
    story: [
      "長身ながら足元の技術が高い万能FW。",
      "落ちて受けても、最前線でも仕事ができる。",
      "ドイツの「決められる9番」として期待を背負う。",
    ],
    tagline: "万能の9番",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/hem4r91694204364.png",
  },

  // スペイン
  {
    id: "yamal",
    name: "ヤマル",
    teamId: "esp",
    age: 18,
    club: "バルセロナ",
    position: "FW",
    number: 19,
    story: [
      "16歳でEuro優勝、世界が目を奪う10代の怪物。",
      "右サイドからのカットインと左足が必殺。",
      "「メッシ以来」の天才と呼ばれる超新星。",
    ],
    tagline: "10代の覇王",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/m9n4ja1761512633.png",
    birthPlace: "マタロ (スペイン・カタルーニャ)",
    birthDate: "2007-07-13",
    heightCm: 180,
    preferredFoot: "L",
    caps: 26,
    internationalGoals: 8,
    strengths: [
      { label: "ドリブル", rating: 5 },
      { label: "シュート", rating: 5 },
      { label: "テクニック", rating: 5 },
      { label: "創造性", rating: 5 },
      { label: "守備", rating: 2 },
    ],
    careerPath: [
      { period: "2014-2023", club: "FCバルセロナ ラ・マシア", note: "7歳でアカデミー入り" },
      { period: "2023-現在", club: "FCバルセロナ", note: "15歳でトップデビュー、史上最年少記録多数" },
    ],
    signatureMoment: {
      title: "Euro 2024 準決勝フランス戦の決勝弾",
      body:
        "16歳のヤマルが右サイドから左足を一閃。クルトワも届かないトップコーナーに突き刺さるスーパーゴール。スペインを優勝に導く伝説の始まり。",
    },
    whyWatch:
      "「歴代最年少◯◯」を毎週更新する怪物。右サイドでボールを持って内側にカットインした瞬間が、世界中の人がスクリーンに釘付けになる瞬間。",
  },
  {
    id: "rodri",
    name: "ロドリ",
    teamId: "esp",
    age: 29,
    club: "マンチェスター・シティ",
    position: "MF",
    number: 16,
    story: [
      "バロンドール受賞、世界最高峰のアンカー。",
      "ボール奪取と配球で試合を完全に支配する。",
      "彼がいれば負けない、そう言わせる存在。",
    ],
    tagline: "支配の中心",
  },
  {
    id: "pedri",
    name: "ペドリ",
    teamId: "esp",
    age: 23,
    club: "バルセロナ",
    position: "MF",
    number: 8,
    story: [
      "中盤の魔術師。ボールを失わないテクニシャン。",
      "若くしてバルサとスペインの心臓となった逸材。",
      "判断の速さで現代サッカーの基準を上書きする。",
    ],
    tagline: "中盤の魔術師",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/srwppu1424795582.png",
  },

  // セネガル
  {
    id: "sarr",
    name: "サール",
    teamId: "sen",
    age: 28,
    club: "クリスタル・パレス",
    position: "FW",
    number: 18,
    story: [
      "プレミアで爆発したスピードスター。",
      "右サイドからの突破とゴールが武器。",
      "マネ後のセネガル攻撃を背負う新エース。",
    ],
    tagline: "爆速エース",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/1abo611761492444.png",
  },

  // ブラジル
  {
    id: "vinicius",
    name: "ヴィニシウス",
    teamId: "bra",
    age: 26,
    club: "レアル・マドリード",
    position: "FW",
    number: 7,
    story: [
      "世界最高クラスの左ウィンガー。",
      "1対1で剥がしてゴールまで持っていける異次元の個。",
      "ブラジル6度目の星のために、今大会で結果を残したい。",
    ],
    tagline: "左の魔術師",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/ejuxsh1750271859.png",
    birthPlace: "サン・ゴンサロ (リオデジャネイロ)",
    birthDate: "2000-07-12",
    heightCm: 176,
    preferredFoot: "R",
    caps: 39,
    internationalGoals: 6,
    strengths: [
      { label: "1対1の突破", rating: 5 },
      { label: "スピード", rating: 5 },
      { label: "ドリブル", rating: 5 },
      { label: "シュート", rating: 4 },
      { label: "メンタル", rating: 4.5 },
    ],
    careerPath: [
      { period: "2017-2018", club: "フラメンゴ", note: "ブラジル名門で14歳デビュー" },
      { period: "2018-現在", club: "レアル・マドリード", note: "CL 3度制覇 (2022/2024/2025想定), Bランドール候補常連" },
    ],
    signatureMoment: {
      title: "2022 CL 決勝でリヴァプール撃破",
      body:
        "後半右からカットインして突き刺した左足シュートが決勝戦の唯一のゴール。レアル・マドリードに 14 度目のヨーロッパ王者をもたらす立役者となった。",
    },
    whyWatch:
      "「世界一速い左ウィンガー」の代名詞。ボールを持ったとき、世界中のサイドバックが彼に抜かれる映像を見てきたはず。同じ瞬間がW杯でも見られる。",
  },

  // アルゼンチン
  {
    id: "messi",
    name: "メッシ",
    teamId: "arg",
    age: 38,
    club: "インテル・マイアミ",
    position: "FW",
    number: 10,
    story: [
      "歴代最高選手の最後の舞台になる可能性が高い大会。",
      "前回大会で念願のW杯を獲り、ついに完全燃焼へ。",
      "ボールを持つだけで観客が息をのむ、神話の主役。",
    ],
    tagline: "ラスト・ダンス",
    photoUrl: "https://r2.thesportsdb.com/images/media/player/cutout/e0i2051750317027.png",
    birthPlace: "ロサリオ (アルゼンチン)",
    birthDate: "1987-06-24",
    heightCm: 170,
    preferredFoot: "L",
    caps: 191,
    internationalGoals: 112,
    strengths: [
      { label: "創造性", rating: 5 },
      { label: "ドリブル", rating: 5 },
      { label: "FK / セットプレー", rating: 5 },
      { label: "ラストパス", rating: 5 },
      { label: "リーダーシップ", rating: 5 },
    ],
    careerPath: [
      { period: "2000-2021", club: "FCバルセロナ", note: "ラ・マシア出身、10度のラ・リーガ、4度のCL" },
      { period: "2021-2023", club: "パリ・サンジェルマン", note: "リーグ1優勝×2、Bランドール 7・8 個目を獲得" },
      { period: "2023-現在", club: "インテル・マイアミ", note: "MLSへ、世界中で「メッシを見たい人」のためのクラブに" },
    ],
    signatureMoment: {
      title: "2022 W杯決勝、35年ぶりのアルゼンチン世界制覇",
      body:
        "フランスとの死闘の末、PK戦で勝利。3度目のW杯決勝でついに頂点。「最高選手の称号」と「W杯トロフィー」が一直線で揃った瞬間。",
    },
    whyWatch:
      "サッカーの神様、最後の舞台。ボールを持って歩くだけで観客が黙る——その異常な存在感を、生で（または中継で）見られる最後のチャンス。",
  },
];

/** curated と auto を統合し、id 重複時は curated 優先 */
function buildAllPlayers(): Player[] {
  const auto = autoPlayersFromSquads();
  const curatedIds = new Set(curatedPlayers.map((p) => p.id));
  // 名前マッチ（curated 8人＋ヤマル等）で auto から除外する候補
  const curatedNameKeys = new Set(
    curatedPlayers.map((p) => `${p.teamId}|${(p.nameRomaji ?? p.name).toLowerCase()}`)
  );
  const filteredAuto = auto.filter((p) => {
    if (curatedIds.has(p.id)) return false;
    const key = `${p.teamId}|${(p.nameRomaji ?? "").toLowerCase()}`;
    if (curatedNameKeys.has(key)) return false;
    return true;
  });
  return [...curatedPlayers, ...filteredAuto];
}

export const players: Player[] = buildAllPlayers();

export const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

export function getPlayer(id: string): Player | undefined {
  return playerMap[id];
}

export function playersByTeam(teamId: string): Player[] {
  return players.filter((p) => p.teamId === teamId);
}

/** チームの注目選手ID（curated優先、なければ自動補完） */
export function starPlayerIdsForTeam(teamId: string, curated: string[]): string[] {
  if (curated.length > 0) return curated;
  return players.filter((p) => p.teamId === teamId).map((p) => p.id);
}
