import { notFound } from "next/navigation";
import { AppHeader } from "../../../../components/AppHeader";
import { getMatch, getTeam, formatKickoffJST } from "../../../../lib/data";
import { CommentBoardClient } from "../../../../components/CommentBoardClient";

export default async function MatchCommentsPage(
  props: PageProps<"/matches/[id]/comments">,
) {
  const { id } = await props.params;
  const match = await getMatch(id);
  if (!match) notFound();
  const [home, away] = await Promise.all([
    getTeam(match.homeTeamId),
    getTeam(match.awayTeamId),
  ]);

  const matchup =
    home && away
      ? `${home.flag} ${home.shortName} × ${away.shortName} ${away.flag}`
      : "コメント";
  const sub = `${formatKickoffJST(match.kickoffJST)} JST · ${match.venue}`;

  return (
    <>
      <AppHeader back={`/matches/${id}`} title={matchup} subtitle={sub} />
      <CommentBoardClient
        matchId={id}
        status={match.status}
        defaultFlag={home?.flag}
      />
    </>
  );
}
