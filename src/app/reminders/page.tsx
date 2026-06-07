import { AppHeader } from "../../components/AppHeader";
import {
  RemindersListClient,
  type ReminderMatchSnapshot,
} from "../../components/RemindersListClient";
import { NotificationCard } from "../../components/NotificationCard";
import { SpoilerToggle } from "../../components/SpoilerToggle";
import { getAllMatches, getAllTeams } from "../../lib/data";

export default async function RemindersPage() {
  const [matches, teams] = await Promise.all([getAllMatches(), getAllTeams()]);
  const teamById = new Map(teams.map((t) => [t.id, t]));

  // 全試合のスナップショットを Client に渡す。
  // localStorage の reminderMatches で絞り込みされる。
  const snapshots: ReminderMatchSnapshot[] = matches.map((m) => {
    const home = teamById.get(m.homeTeamId);
    const away = teamById.get(m.awayTeamId);
    // kickoffJST: "YYYY-MM-DDTHH:mm" の前提
    const date = m.kickoffJST.slice(0, 10);
    const timeLabel = m.kickoffJST.slice(11, 16);
    return {
      id: m.id,
      date,
      timeLabel,
      homeFlag: home?.flag ?? "·",
      awayFlag: away?.flag ?? "·",
      homeName: home?.shortName ?? home?.name ?? m.homeTeamId,
      awayName: away?.shortName ?? away?.name ?? m.awayTeamId,
      stage: m.stage,
      venue: m.venue,
      status: m.status,
    };
  });

  return (
    <>
      <AppHeader title="お気に入り" subtitle="観たい試合の一覧" back="/" />
      <SpoilerToggle />
      <NotificationCard />
      <RemindersListClient matches={snapshots} />
    </>
  );
}
