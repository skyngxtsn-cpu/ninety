import { AppHeader } from "../../components/AppHeader";
import { getAllTeams } from "../../lib/data/teams";
import { SettingsClient, OtherSettings } from "./SettingsClient";
import { SpoilerToggle } from "../../components/SpoilerToggle";
import { NotificationCard } from "../../components/NotificationCard";

export default async function SettingsPage() {
  const teams = await getAllTeams();
  const allTeams = teams
    .map((t) => ({
      id: t.id,
      shortName: t.shortName,
      name: t.name,
      flag: t.flag,
      group: t.group,
    }))
    .sort((a, b) => a.group.localeCompare(b.group));

  return (
    <>
      <AppHeader title="設定" />

      <div className="px-4 pt-3">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--text-dim)]">
          Preferences
        </p>
        <h1 className="pt-1 text-[24px] font-bold tracking-tight leading-tight text-gradient">
          見逃さない準備を。
        </h1>
      </div>

      <SettingsClient allTeams={allTeams} />

      <SpoilerToggle />
      <NotificationCard />

      <OtherSettings />
    </>
  );
}
