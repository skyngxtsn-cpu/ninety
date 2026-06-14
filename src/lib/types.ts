export type TeamId = string;
export type PlayerId = string;
export type MatchId = string;

export type Team = {
  id: TeamId;
  name: string;
  shortName: string;
  flag: string;
  fifaRank: number;
  group: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
  primary: string;
  secondary: string;
  /** 3行で「どんなチーム？」 */
  story: [string, string, string];
  playStyle: string;
  coach: string;
  /** 監督の意気込み・代表的なコメント（手書き） */
  coachQuote?: string;
  /** チームの「ここを推せ」初心者向け一行 */
  hype?: string;
  starPlayerIds: PlayerId[];
};

export type Player = {
  id: PlayerId;
  name: string;
  nameRomaji?: string;
  teamId: TeamId;
  age: number;
  club: string;
  position: "GK" | "DF" | "MF" | "FW";
  number: number;
  /** 3行で「この選手は何者？」 */
  story: [string, string, string];
  tagline: string;
  /** TheSportsDB の切り抜き透過PNG（任意） */
  photoUrl?: string;
  // -- 深掘り情報（任意。手書きで主要選手だけ充足する想定）--
  /** 出身地（"川崎市" 等） */
  birthPlace?: string;
  /** 生年月日 ISO "2001-06-04" */
  birthDate?: string;
  /** 身長 cm */
  heightCm?: number;
  /** 利き足 */
  preferredFoot?: "L" | "R" | "B";
  /** 代表キャップ数 */
  caps?: number;
  /** 代表ゴール数 */
  internationalGoals?: number;
  /** 4-5項目の能力評価（0〜5） */
  strengths?: { label: string; rating: number }[];
  /** クラブ移籍歴（古→新の順） */
  careerPath?: { period: string; club: string; note?: string }[];
  /** 名場面 1 つ */
  signatureMoment?: { title: string; body: string };
  /** 「初心者はここを見て」 */
  whyWatch?: string;
};

/** 互換用エイリアス: BroadcastChannelId が正式 */
export type Broadcast = string;

export type MatchStatus = "scheduled" | "live" | "finished";

export type Match = {
  id: MatchId;
  homeTeamId: TeamId;
  awayTeamId: TeamId;
  /** KO 試合で teamId が未確定 (slug 化された "2a", "w74" など) のとき真 */
  homeIsPlaceholder?: boolean;
  awayIsPlaceholder?: boolean;
  /** placeholder の元文字列 ("1E", "W74", "3A/B/C/D/F" 等) */
  homeRaw?: string;
  awayRaw?: string;
  /** JST ISO string */
  kickoffJST: string;
  stage: string;
  venue: string;
  broadcasts: Broadcast[];
  status: MatchStatus;
  /** 直感的な煽り（ホーム視点） */
  hook: string;
  meaning: {
    homeWin: string;
    draw: string;
    awayWin: string;
  };
  storylines: [string, string, string];
  keyPlayerIds: [PlayerId, PlayerId, PlayerId];
  /** モック簡易フォーメーション */
  lineups?: {
    home: { formation: string; starters: PlayerId[]; bench: PlayerId[] };
    away: { formation: string; starters: PlayerId[]; bench: PlayerId[] };
  };
  /** 試合後 */
  result?: {
    /** 規定 90 分終了時点のスコア */
    home: number;
    away: number;
    /** 延長戦終了時点のスコア（延長戦に入った場合のみ） */
    extraTime?: { home: number; away: number };
    /** PK 戦の勝負シュート結果（PK 戦に入った場合のみ） */
    penalties?: { home: number; away: number };
    /** 勝敗が決まった方式: REGULAR / EXTRA_TIME / PENALTY_SHOOTOUT */
    duration?: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
    /** どちらが勝ったか: home / away / draw */
    winner?: "home" | "away" | "draw";
    /** 手動キュレーション時のみ設定。auto 結果では undefined (UI 側で非表示) */
    whyTrending?: string;
    summary30s?: string;
    manOfTheMatchId?: PlayerId;
    nextImplication?: string;
    highlightUrl?: string;
  };
  /** 試合イベント（得点・カード・交代）。football-data.org から自動取得 */
  events?: {
    goals: {
      minute: number | null;
      injuryTime: number | null;
      /** REGULAR / OWN / PENALTY */
      type: string;
      /** teamId */
      team: string;
      scorer: string;
      assist: string | null;
    }[];
    bookings: {
      minute: number | null;
      team: string;
      player: string;
      /** YELLOW / YELLOW_RED / RED */
      card: string;
    }[];
    substitutions: {
      minute: number | null;
      team: string;
      playerOut: string;
      playerIn: string;
    }[];
  };
};

export type GroupRow = {
  teamId: TeamId;
  played: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
};

export type Group = {
  name: Team["group"];
  rows: GroupRow[];
};

export type StoryKind =
  | "player" // 選手写真をフィーチャー
  | "match" // 試合フィーチャー（旗2つ）
  | "coach" // 監督発言
  | "team" // チームの推し要素
  | "trending" // 話題のカード
  | "countdown"; // カウントダウン系

export type Story = {
  id: string;
  kind: StoryKind;
  matchId?: MatchId;
  playerId?: PlayerId;
  teamId?: TeamId;
  /** 試合フィーチャー時に表示するチームID（home/away） */
  flagTeams?: [TeamId, TeamId];
  kicker: string;
  title: string;
  body: string;
  gradient: [string, string];
  /** 選手・監督・会場写真などの URL（任意） */
  photoUrl?: string;
};
