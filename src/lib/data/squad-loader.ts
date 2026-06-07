/**
 * squads.json（Wikipediaスクレイプ結果）を内部 Player 型に変換する。
 *
 * - 手書きのcurated選手（players.ts）が優先
 * - 残りはここで自動生成
 * - 言語: 日本選手のみフル日本語、他国選手は英名＋カタカナ風クラブ名
 */
import type { Player, PlayerId, TeamId } from "../types";
import squadsRaw from "./squads.json";
import enrichedRaw from "./enriched-players.json";
import { countryJa } from "./i18n";

type EnrichedEntry = {
  tagline?: string;
  story?: string[];
  strengths?: { label: string; rating: number }[];
  whyWatch?: string;
};
const enriched = enrichedRaw as Record<string, EnrichedEntry>;

type RawPlayer = {
  no: string;
  pos: string;
  name: string;
  club: string;
  captain: boolean;
  photo: string | null;
};
type RawSquad = { coach: string | null; players: RawPlayer[] };
type RawSquads = Record<string, RawSquad>;

const squads = squadsRaw as RawSquads;

/** クラブ英→日マッピング（よく出てくる主要クラブ） */
const CLUB_JA: Record<string, string> = {
  "Real Madrid": "レアル・マドリード",
  "Barcelona": "バルセロナ",
  "Atletico Madrid": "アトレティコ・マドリード",
  "Real Sociedad": "レアル・ソシエダ",
  "Manchester City": "マンチェスター・シティ",
  "Manchester United": "マンチェスター・ユナイテッド",
  "Liverpool": "リヴァプール",
  "Arsenal": "アーセナル",
  "Chelsea": "チェルシー",
  "Tottenham": "トッテナム",
  "Tottenham Hotspur": "トッテナム",
  "Aston Villa": "アストン・ヴィラ",
  "Newcastle United": "ニューカッスル",
  "Newcastle": "ニューカッスル",
  "Brighton": "ブライトン",
  "Brighton & Hove Albion": "ブライトン",
  "Crystal Palace": "クリスタル・パレス",
  "West Ham": "ウェストハム",
  "West Ham United": "ウェストハム",
  "Everton": "エヴァートン",
  "Leeds United": "リーズ",
  "Leeds": "リーズ",
  "Bayern Munich": "バイエルン",
  "Borussia Dortmund": "ドルトムント",
  "Bayer Leverkusen": "レバークーゼン",
  "RB Leipzig": "ライプツィヒ",
  "Eintracht Frankfurt": "アイントラハト・フランクフルト",
  "Werder Bremen": "ヴェルダー・ブレーメン",
  "VfB Stuttgart": "シュツットガルト",
  "Stuttgart": "シュツットガルト",
  "Borussia Mönchengladbach": "ボルシアMG",
  "Juventus": "ユヴェントス",
  "Inter Milan": "インテル",
  "Internazionale": "インテル",
  "AC Milan": "ミラン",
  "Milan": "ミラン",
  "Napoli": "ナポリ",
  "Roma": "ローマ",
  "Lazio": "ラツィオ",
  "Atalanta": "アタランタ",
  "Fiorentina": "フィオレンティーナ",
  "Parma": "パルマ",
  "Parma Calcio 1913": "パルマ",
  "PSG": "PSG",
  "Paris Saint-Germain": "PSG",
  "Olympique Lyon": "リヨン",
  "Lyon": "リヨン",
  "Marseille": "マルセイユ",
  "Monaco": "モナコ",
  "Lille": "リール",
  "Reims": "ランス",
  "Stade de Reims": "ランス",
  "Stade Brestois": "ブレスト",
  "Ajax": "アヤックス",
  "AFC Ajax": "アヤックス",
  "PSV Eindhoven": "PSV",
  "PSV": "PSV",
  "Feyenoord": "フェイエノールト",
  "AZ": "AZ",
  "AZ Alkmaar": "AZ",
  "Celtic": "セルティック",
  "Rangers": "レンジャーズ",
  "Porto": "ポルト",
  "FC Porto": "ポルト",
  "Benfica": "ベンフィカ",
  "S.L. Benfica": "ベンフィカ",
  "Sporting CP": "スポルティング",
  "Inter Miami": "インテル・マイアミ",
  "Al-Hilal": "アル・ヒラル",
  "Al Nassr": "アル・ナスル",
  "Genk": "ヘンク",
  "KRC Genk": "ヘンク",
  "Anderlecht": "アンデルレヒト",
  "Club Brugge": "クラブ・ブルージュ",
  "Sint-Truiden": "シント・トロイデン",
  "Galatasaray": "ガラタサライ",
  "Fenerbahce": "フェネルバフチェ",
  "Fenerbahçe": "フェネルバフチェ",
  "Besiktas": "ベシクタシュ",
  "Beşiktaş": "ベシクタシュ",
};

function clubJa(en: string): string {
  return CLUB_JA[en] ?? en;
}

const POS_JA: Record<string, string> = {
  GK: "GK",
  DF: "DF",
  MF: "MF",
  FW: "FW",
};

/** team_code (uppercase fifa) → 注目選手の Player 配列を返す */
export function autoPlayersFromSquads(): Player[] {
  const out: Player[] = [];
  for (const [code, sq] of Object.entries(squads)) {
    const teamId = code.toLowerCase() as TeamId;
    const countryName = countryJa[code] ?? code;
    for (const p of sq.players) {
      const id = `${teamId}-${slugifyName(p.name)}` as PlayerId;
      const club = clubJa(p.club);
      const tagline =
        p.captain
          ? "キャプテン"
          : p.no === "10"
            ? "10番"
            : p.no === "1" && p.pos === "GK"
              ? "守護神"
              : p.pos === "FW"
                ? "ゴールハンター"
                : p.pos === "DF"
                  ? "最終ライン"
                  : "中盤の主役";
      const num = parseInt(p.no, 10) || 0;
      const enrichedEntry = enriched[id];
      out.push({
        id,
        name: p.name,
        nameRomaji: p.name,
        teamId,
        age: 0,
        club,
        position: POS_JA[p.pos] as Player["position"] ?? "MF",
        number: num,
        story:
          enrichedEntry?.story && enrichedEntry.story.length >= 3
            ? (enrichedEntry.story.slice(0, 3) as [string, string, string])
            : [
                `${countryName}代表の${posLabel(p.pos)}、${p.name}。`,
                `所属は${club}。${p.captain ? "チームを率いるキャプテン。" : ""}`,
                `2026 W杯本選メンバー、${countryName}の主力の一人。`,
              ],
        tagline: enrichedEntry?.tagline ?? tagline,
        strengths: enrichedEntry?.strengths,
        whyWatch: enrichedEntry?.whyWatch,
        photoUrl: p.photo ?? undefined,
      });
    }
  }
  return out;
}

/** 監督名取得（生成元: Wikipedia） */
export function getCoachFromSquad(teamCode: string): string | null {
  return squads[teamCode.toUpperCase()]?.coach ?? null;
}

/** チームの注目選手ID（curatedになければ自動生成IDを返す） */
export function autoStarPlayerIds(teamCode: string, limit = 5): string[] {
  const code = teamCode.toUpperCase();
  const sq = squads[code];
  if (!sq) return [];
  const teamId = code.toLowerCase();
  return sq.players
    .slice(0, limit)
    .map((p) => `${teamId}-${slugifyName(p.name)}`);
}

function posLabel(pos: string): string {
  return (
    { GK: "ゴールキーパー", DF: "ディフェンダー", MF: "ミッドフィルダー", FW: "フォワード" }[pos] ?? pos
  );
}

function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}
