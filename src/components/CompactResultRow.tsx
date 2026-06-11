import Link from "next/link";
import type { Match } from "../lib/types";
import { getTeam } from "../lib/data/teams";
import { CompactResultRowClient } from "./CompactResultRowClient";

type Props = {
  match: Match;
  favoriteTeamIds: Set<string>;
};

/**
 * スコア中心の見逃した試合行。
 * "🇯🇵 日本 2 - 1 オランダ 🇳🇱"
 * + 推しチームは ❤️
 *
 * server で team を解決して client コンポーネントに渡し、
 * ネタバレ防止モード時はスコア + 勝敗を示すスタイリングの両方を隠す。
 */
export async function CompactResultRow({ match, favoriteTeamIds }: Props) {
  const [home, away] = await Promise.all([
    getTeam(match.homeTeamId),
    getTeam(match.awayTeamId),
  ]);
  if (!home || !away || !match.result) return null;
  const involvesFavorite =
    favoriteTeamIds.has(match.homeTeamId) ||
    favoriteTeamIds.has(match.awayTeamId);

  return (
    <CompactResultRowClient
      matchId={match.id}
      home={{ flag: home.flag, name: home.name }}
      away={{ flag: away.flag, name: away.name }}
      result={{ home: match.result.home, away: match.result.away }}
      involvesFavorite={involvesFavorite}
    />
  );
}
