import { notFound } from "next/navigation";
import { AppHeader } from "../../../../components/AppHeader";
import {
  getMatch,
  getTeam,
  formatKickoffJST,
  getAllTeams,
} from "../../../../lib/data";
import { CommentBoardClient } from "../../../../components/CommentBoardClient";

export default async function MatchCommentsPage(
  props: PageProps<"/matches/[id]/comments">,
) {
  const { id } = await props.params;
  const match = await getMatch(id);
  if (!match) notFound();
  const [home, away, allTeams] = await Promise.all([
    getTeam(match.homeTeamId),
    getTeam(match.awayTeamId),
    getAllTeams(),
  ]);

  const matchup =
    home && away
      ? `${home.flag} ${home.shortName} × ${away.shortName} ${away.flag}`
      : "コメント";
  const sub = `${formatKickoffJST(match.kickoffJST)} JST · ${match.venue}`;

  // 48ヶ国の国旗だけを抜き出して並べる（id 順で安定化）
  const teamFlags = allTeams
    .map((t) => ({ id: t.id, flag: t.flag, shortName: t.shortName }))
    .filter((t) => !!t.flag)
    .sort((a, b) => a.shortName.localeCompare(b.shortName));

  return (
    <>
      <AppHeader back={`/matches/${id}`} title={matchup} subtitle={sub} />
      <CommentBoardClient
        matchId={id}
        status={match.status}
        defaultFlag={home?.flag}
        teamFlags={teamFlags}
      />
    </>
  );
}
