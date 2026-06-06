import type { Story } from "../types";
import { getAllTeams } from "./teams";
import { getPlayer } from "./players";

/**
 * 手書きストーリー（重要・特集）。
 * 自動生成では出せない、編集者がプッシュしたい類の話を入れる。
 */
const CURATED: Story[] = [
  {
    id: "s-jpn-ned",
    kind: "match",
    matchId: "2026-06-14-ned-jpn",
    flagTeams: ["ned", "jpn"],
    kicker: "なぜ注目",
    title: "強敵オランダ、初戦。",
    body:
      "前回大会でドイツ・スペインを撃破した日本。本選最初の試金石は、トータルフットボールのオランダ。",
    gradient: ["#bc002d", "#ae1c28"],
  },
  {
    id: "s-doan-revival",
    kind: "player",
    playerId: "doan",
    kicker: "番狂わせ再び",
    title: "歴史を作った男、再び。",
    body:
      "前回大会、ドイツ戦・スペイン戦で2大番狂わせの立役者となった堂安律。次の伝説は、いつ生まれるか。",
    gradient: ["#0a1a3a", "#ffce00"],
  },
  {
    id: "s-bra-arg",
    kind: "match",
    matchId: "2026-06-23-arg-bra",
    flagTeams: ["bra", "arg"],
    kicker: "クラシコ",
    title: "南米サッカーの頂点を決める夜。",
    body: "メッシの最後の挑戦、ヴィニシウスの覚醒。グループ首位を懸けた誇り高き90分。",
    gradient: ["#009739", "#75aadb"],
  },
  {
    id: "s-yamal",
    kind: "player",
    playerId: "yamal",
    kicker: "10代の覇王",
    title: "ヤマル、世界を獲りに来た。",
    body: "16歳でEuro優勝。次に世界を獲るのは、いつ、誰か。彼の答えは「今、自分」。",
    gradient: ["#aa151b", "#f1bf00"],
  },
  {
    id: "s-messi-last",
    kind: "player",
    playerId: "messi",
    kicker: "Last Dance",
    title: "メッシのラストダンス。",
    body:
      "前回大会でついに世界王者となった神話の主役。最後の舞台で、もう一度、奇跡を起こせるか。",
    gradient: ["#75aadb", "#ffffff"],
  },
];

/**
 * 自動生成: curated 選手から「タグライン特集」を作る。
 * tagline + 写真 + 所属チームのカラー。
 */
async function generatePlayerStories(): Promise<Story[]> {
  const ids = [
    "kubo",
    "endo",
    "ueda",
    "maeda",
    "vinicius",
    "wirtz",
    "musiala",
    "rodri",
    "pedri",
  ];
  const teams = await getAllTeams();
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));
  const stories: Story[] = [];
  for (const id of ids) {
    const p = getPlayer(id);
    if (!p) continue;
    const team = teamMap[p.teamId];
    if (!team) continue;
    stories.push({
      id: `s-auto-player-${id}`,
      kind: "player",
      playerId: id,
      photoUrl: p.photoUrl,
      kicker: p.tagline,
      title: p.name,
      body: p.story[0],
      gradient: [team.primary, team.secondary],
    });
  }
  return stories;
}

/**
 * 自動生成: 各curatedチームの「監督の意気込み」をストーリー化。
 */
async function generateCoachStories(): Promise<Story[]> {
  const teams = await getAllTeams();
  return teams
    .filter((t) => t.coachQuote)
    .map(
      (t): Story => ({
        id: `s-coach-${t.id}`,
        kind: "coach",
        teamId: t.id,
        kicker: `${t.flag} ${t.name} 監督`,
        title: `「${t.coach}」の意気込み`,
        body: t.coachQuote!,
        gradient: [t.primary, t.secondary],
      }),
    );
}

/**
 * 自動生成: 各curatedチームの「ここを推せ」(hype) をストーリー化。
 */
async function generateTeamHypeStories(): Promise<Story[]> {
  const teams = await getAllTeams();
  return teams
    .filter((t) => t.hype)
    .map(
      (t): Story => ({
        id: `s-hype-${t.id}`,
        kind: "team",
        teamId: t.id,
        kicker: `${t.flag} ${t.name}`,
        title: "ここを推せ",
        body: t.hype!,
        gradient: [t.primary, t.secondary],
      }),
    );
}

/**
 * Today's Stories の全リスト（手書き + 自動生成）。
 * server component の await で呼ぶ前提。
 */
export async function getAllStories(): Promise<Story[]> {
  const [playerStories, coachStories, hypeStories] = await Promise.all([
    generatePlayerStories(),
    generateCoachStories(),
    generateTeamHypeStories(),
  ]);
  // バリエーション混在: curated → player → coach → hype の順で並べる
  return [
    ...CURATED,
    ...playerStories,
    ...coachStories,
    ...hypeStories,
  ];
}

/** 互換: 既存のホーム実装で `stories` を直接 import している箇所のための fallback */
export const stories: Story[] = CURATED;
