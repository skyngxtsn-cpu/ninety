import type { Team, TeamId } from "../types";
import { getOFTeams } from "../openfootball";
import { countryJa } from "./i18n";
import { getCoachFromSquad, autoStarPlayerIds } from "./squad-loader";

/**
 * 「手書きで深掘り」したチーム情報（日本＋日本のグループF相手＋注目国）。
 * 他の37カ国はOpenFootballのデータからフォールバック生成する。
 */
type CuratedTeam = Omit<Team, "shortName" | "flag" | "group">;

const curated: Record<string, CuratedTeam> = {
  jpn: {
    id: "jpn",
    name: "日本",
    fifaRank: 17,
    primary: "#bc002d",
    secondary: "#0a1a3a",
    story: [
      "アジアの強豪で、組織的な守備と俊敏な前線が武器。",
      "前回大会ではドイツ・スペインを撃破し世界を驚かせた。",
      "ヨーロッパで戦う選手が多く、技術と規律のチーム。",
    ],
    playStyle: "ハイプレス＋カウンター",
    coach: "森保 一",
    coachQuote: "「前回大会の続きをやろう。リスペクトと、確かな自信を持って臨む。」",
    hype: "前回ドイツ・スペインを撃破した「組織のチーム」が、今度は本気でベスト8の壁を越える。",
    starPlayerIds: ["kubo", "endo", "doan", "kamada", "maeda", "tomiyasu", "ueda", "zsuzuki"],
  },
  ned: {
    id: "ned",
    name: "オランダ",
    fifaRank: 7,
    primary: "#ae1c28",
    secondary: "#fb8500",
    story: [
      "「無冠の帝王」、決勝で3度敗れた悲劇のオレンジ軍団。",
      "トータルフットボールの伝統を継ぐ技術派の強豪。",
      "デ・ヨング、ファン・ダイクら世界クラスが軸。",
    ],
    playStyle: "ビルドアップ＋ポジショナル",
    coach: "クーマン",
    coachQuote: "「我々はチャンピオンになるために来た。それ以下の目標は持たない。」",
    hype: "「無冠の帝王」と呼ばれ続けたオレンジ軍団。デ・ヨングの中盤とフィルジル・ファン・ダイクの統率で、本気の優勝を狙う。",
    starPlayerIds: [],
  },
  swe: {
    id: "swe",
    name: "スウェーデン",
    fifaRank: 25,
    primary: "#005293",
    secondary: "#fecc02",
    story: [
      "予選を勝ち上がった北欧の伝統国。",
      "イサクとギェケレシュという欧州屈指のFWを擁する。",
      "高さとフィジカルでアジア勢には脅威となる。",
    ],
    playStyle: "フィジカル＋直線的な縦攻撃",
    coach: "トマソン",
    coachQuote: "「我々の道は険しい。だが、北欧の誇りを背負って戦う準備はできている。」",
    hype: "イサクとギェケレシュ、欧州屈指の決定力を持つ2大FWを擁する北欧勢。グループF最後の刺客。",
    starPlayerIds: [],
  },
  tun: {
    id: "tun",
    name: "チュニジア",
    fifaRank: 41,
    primary: "#e70013",
    secondary: "#ffffff",
    story: [
      "北アフリカのカウンター上手、堅守速攻型。",
      "ヨーロッパ育ちのMFが多く、規律ある守備が持ち味。",
      "前回大会ではフランスを撃破した実績あり。",
    ],
    playStyle: "ローブロック＋カウンター",
    coach: "カデリ",
    coachQuote: "「我々は何度もアフリカの誇りを背負って戦ってきた。今回も諦めない。」",
    hype: "前回大会フランスを撃破した堅守の伏兵。日本が突破を掴むには必ず倒さねばならない壁。",
    starPlayerIds: [],
  },
  ger: {
    id: "ger",
    name: "ドイツ",
    fifaRank: 9,
    primary: "#1b1b1b",
    secondary: "#ffce00",
    story: [
      "W杯通算4回優勝の伝統国。サッカー界の超大国。",
      "ポゼッションと縦に速い攻撃のハイブリッドが現代版。",
      "前回大会の屈辱を晴らすため、世代交代を経て臨む。",
    ],
    playStyle: "高い位置取り＋ビルドアップ",
    coach: "ナーゲルスマン",
    coachQuote: "「我々は再びサッカーの頂点に立つ。世代交代は完了した。」",
    hype: "前回大会のグループステージ敗退の屈辱を晴らす世代交代軍団。ヴィルツとムシアラの新世代が躍動。",
    starPlayerIds: ["wirtz", "musiala", "havertz"],
  },
  esp: {
    id: "esp",
    name: "スペイン",
    fifaRank: 8,
    primary: "#aa151b",
    secondary: "#f1bf00",
    story: [
      "細かいパス回し「ティキタカ」でボールを支配する芸術派。",
      "Euro 2024王者として乗り込む現在のヨーロッパ最強。",
      "若き才能ヤマルの登場で攻撃の威力が一段増した。",
    ],
    playStyle: "ポゼッション＋ショートパス",
    coach: "デ・ラ・フエンテ",
    coachQuote: "「我々のサッカーは美しく、勝つ。両方を諦めない。」",
    hype: "Euro 2024王者として乗り込む現在のヨーロッパ最強。10代の覇王ヤマルがW杯のステージで何を見せるか。",
    starPlayerIds: ["yamal", "rodri", "pedri"],
  },
  bra: {
    id: "bra",
    name: "ブラジル",
    fifaRank: 5,
    primary: "#009739",
    secondary: "#fedd00",
    story: [
      "W杯最多5回優勝、サッカー王国。",
      "個の技術はいまも世界トップ、優勝候補の常連。",
      "ヴィニシウスとロドリゴの2大スターが攻撃を牽引。",
    ],
    playStyle: "個＋自由なアタッキング",
    coach: "ドリヴァル",
    coachQuote: "「6つ目の星を獲りに来た。それ以外の理由でブラジルに監督はいない。」",
    hype: "W杯最多5回優勝のサッカー王国が、ヴィニシウスとロドリゴを軸に「ヘキサ（6度目の優勝）」を目指す。",
    starPlayerIds: ["vinicius"],
  },
  arg: {
    id: "arg",
    name: "アルゼンチン",
    fifaRank: 1,
    primary: "#75aadb",
    secondary: "#ffffff",
    story: [
      "前回大会王者にしてFIFAランク1位。",
      "メッシ最後のW杯になる可能性がある最注目チーム。",
      "守備の組織と中盤の創造性が高いレベルで両立。",
    ],
    playStyle: "堅守速攻＋個の打開",
    coach: "スカローニ",
    coachQuote: "「我々は連覇を守りに来た。歴史を作る。」",
    hype: "前回大会王者にしてFIFAランク1位。メッシ最後のW杯になる可能性が高い、世界中が注目するチーム。",
    starPlayerIds: ["messi"],
  },
  fra: {
    id: "fra",
    name: "フランス",
    fifaRank: 2,
    primary: "#0055a4",
    secondary: "#ef4135",
    story: [
      "現代サッカーの覇権を握る世界最強格。",
      "エムバペを中心に、層の厚さは大会随一。",
      "前回決勝の敗戦を雪辱しに来る最有力候補。",
    ],
    playStyle: "個の爆発力＋堅守",
    coach: "デシャン",
    coachQuote: "「我々は最終目標から逆算してW杯に来ている。決勝で会おう。」",
    hype: "エムバペを中心に、層の厚さは大会随一。前回決勝の敗戦を雪辱しに来る最有力候補。",
    starPlayerIds: [],
  },
  eng: {
    id: "eng",
    name: "イングランド",
    fifaRank: 4,
    primary: "#ffffff",
    secondary: "#001489",
    story: [
      "1966年以来の悲願に挑むサッカーの母国。",
      "ベリンガム、サカ、フォーデン…世代最高のタレントが揃う。",
      "Euro 2024決勝で敗北、今度こそ獲りに来る。",
    ],
    playStyle: "ポゼッション＋プレッシング",
    coach: "トゥヘル",
    coachQuote: "「Football's coming home. 我々は60年待った。今こそ獲る時だ。」",
    hype: "1966年以来の悲願に挑むサッカーの母国。ベリンガム、サカ、フォーデン世代のタレントが集結。",
    starPlayerIds: [],
  },
  por: {
    id: "por",
    name: "ポルトガル",
    fifaRank: 6,
    primary: "#006600",
    secondary: "#ff0000",
    story: [
      "Cロナウド最後の挑戦と、新世代の融合がテーマ。",
      "個の質はトップレベル、攻撃陣の層が異常に厚い。",
      "Euro 2016以来のメジャー王座奪還を狙う。",
    ],
    playStyle: "サイドアタック＋個",
    coach: "マルティネス",
    coachQuote: "「Cロナウドの最後の挑戦を、無冠で終わらせるわけにはいかない。」",
    hype: "Cロナウド最後のW杯と、新世代の融合がテーマ。攻撃陣の層の厚さは大会屈指。",
    starPlayerIds: [],
  },
  sen: {
    id: "sen",
    name: "セネガル",
    fifaRank: 19,
    primary: "#00853f",
    secondary: "#fdef42",
    story: [
      "アフリカ最強格。身体能力とスピードで殴り合いに強い。",
      "アフリカネイションズカップ王者の経験を持つ常連国。",
      "個の力で勝負を決めることができる、油断できない相手。",
    ],
    playStyle: "フィジカル＋カウンター",
    coach: "ペペ・ペップ",
    starPlayerIds: ["sarr"],
  },
  mar: {
    id: "mar",
    name: "モロッコ",
    fifaRank: 13,
    primary: "#c1272d",
    secondary: "#006233",
    story: [
      "前回大会、アフリカ勢初のベスト4を達成した旋風の主役。",
      "堅守からの組み立てが完成度高く、もはや伏兵ではない。",
      "ヨーロッパ育ちのタレントが多数、地力は本物。",
    ],
    playStyle: "堅守＋速いビルドアップ",
    coach: "ルグエン",
    coachQuote: "「前回はベスト4。今回は、それを超える景色を見に来た。」",
    hype: "前回大会、アフリカ勢初のベスト4を達成した旋風の主役。もはや「伏兵」ではなく実力派強豪。",
    starPlayerIds: [],
  },
  usa: {
    id: "usa",
    name: "アメリカ",
    fifaRank: 16,
    primary: "#002868",
    secondary: "#bf0a30",
    story: [
      "開催国の一つ。ホームで初のベスト8入りを狙う。",
      "プリシッチを中心に欧州主要リーグで戦う若手が揃う。",
      "サッカーが「主役」になる4年間の集大成。",
    ],
    playStyle: "ハイテンポ＋トランジション",
    coach: "ポチェッティーノ",
    starPlayerIds: [],
  },
  mex: {
    id: "mex",
    name: "メキシコ",
    fifaRank: 14,
    primary: "#006847",
    secondary: "#ce1126",
    story: [
      "共催国。ベスト16の壁を破れるかが永遠のテーマ。",
      "アステカで戦える、世界屈指の熱狂サポーター。",
      "新世代主導で、ベスト8入りに本気で挑む大会。",
    ],
    playStyle: "ポゼッション＋サイド攻撃",
    coach: "アギーレ",
    starPlayerIds: [],
  },
  can: {
    id: "can",
    name: "カナダ",
    fifaRank: 27,
    primary: "#d52b1e",
    secondary: "#ffffff",
    story: [
      "共催国でホスト、現地の熱量は最高潮。",
      "アルフォンソ・デイヴィスを軸に攻撃力は急成長。",
      "前回初出場、今回が真の試金石となる。",
    ],
    playStyle: "縦に速いトランジション",
    coach: "マーシュ",
    starPlayerIds: [],
  },
  cro: {
    id: "cro",
    name: "クロアチア",
    fifaRank: 11,
    primary: "#171796",
    secondary: "#ff0000",
    story: [
      "前回3位、その前は準優勝の不思議な「ラスボス」。",
      "中盤の質が世界トップクラス、しぶとさは大会随一。",
      "モドリッチ世代最後のW杯になる可能性。",
    ],
    playStyle: "中盤支配＋ロングカウンター",
    coach: "ダリッチ",
    starPlayerIds: [],
  },
};

const FLAGS_FALLBACK: Record<string, string> = {
  JPN: "🇯🇵", NED: "🇳🇱", SWE: "🇸🇪", TUN: "🇹🇳",
  GER: "🇩🇪", ESP: "🇪🇸", BRA: "🇧🇷", ARG: "🇦🇷",
  FRA: "🇫🇷", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", POR: "🇵🇹", SEN: "🇸🇳",
  MAR: "🇲🇦", USA: "🇺🇸", MEX: "🇲🇽", CAN: "🇨🇦", CRO: "🇭🇷",
};

function autoTeam(of: { name: string; fifa_code: string; flag_icon: string; group: string }): Team {
  const id = of.fifa_code.toLowerCase();
  const coachName = getCoachFromSquad(of.fifa_code);
  return {
    id,
    name: countryJa[of.fifa_code] ?? of.name,
    shortName: of.fifa_code,
    flag: of.flag_icon || FLAGS_FALLBACK[of.fifa_code] || "⚽",
    fifaRank: 0,
    group: of.group.charAt(0) as Team["group"],
    primary: "#2c3441",
    secondary: "#7a8395",
    story: [
      `W杯本戦に出場する${countryJa[of.fifa_code] ?? of.name}。`,
      "予選を勝ち上がった実力を本選で示せるかが見どころ。",
      "個の力と組織のバランスで勝負を狙う。",
    ],
    playStyle: "—",
    coach: coachName ?? "—",
    starPlayerIds: autoStarPlayerIds(of.fifa_code, 5),
  };
}

let teamsCache: Team[] | null = null;
let teamMapCache: Record<string, Team> | null = null;

export async function getAllTeams(): Promise<Team[]> {
  if (teamsCache) return teamsCache;
  const ofTeams = await getOFTeams();
  const built: Team[] = ofTeams.map((of) => {
    const code = of.fifa_code;
    const c = curated[code.toLowerCase()];
    if (c) {
      // curated は coach と starPlayerIds が空ならsquads由来で補完
      const stars = c.starPlayerIds.length > 0 ? c.starPlayerIds : autoStarPlayerIds(code, 5);
      const coachName =
        c.coach && c.coach !== "—" ? c.coach : getCoachFromSquad(code) ?? c.coach;
      return {
        ...c,
        coach: coachName,
        starPlayerIds: stars,
        shortName: code,
        flag: of.flag_icon || FLAGS_FALLBACK[code] || "⚽",
        group: of.group.charAt(0) as Team["group"],
      };
    }
    return autoTeam(of);
  });
  teamsCache = built;
  teamMapCache = Object.fromEntries(built.map((t) => [t.id, t]));
  return teamsCache;
}

export async function getTeam(id: TeamId): Promise<Team | undefined> {
  await getAllTeams();
  return teamMapCache?.[id];
}

export function getTeamSync(id: TeamId): Team | undefined {
  return teamMapCache?.[id];
}

export async function getTeamsInGroup(group: string): Promise<Team[]> {
  const all = await getAllTeams();
  return all.filter((t) => t.group === group);
}
