import Link from "next/link";
import { AppHeader } from "../../components/AppHeader";
import { SectionHeader } from "../../components/SectionHeader";
import {
  getAllGroups,
  getTeamSync,
  getAllTeams,
  nextOpponentScenarios,
} from "../../lib/data";
import type { Group } from "../../lib/types";
import { getFavoriteTeamsFromCookie } from "../../lib/getFavoritesFromCookie";

export default async function StandingsPage() {
  const allTeams = await getAllTeams(); // 同期取得用キャッシュを温める
  const groups = await getAllGroups();
  const favoriteIds = await getFavoriteTeamsFromCookie();
  const favoriteTeams = allTeams.filter((t) => favoriteIds.includes(t.id));
  // 各推しチームのシナリオを並列計算
  const scenariosByTeam = await Promise.all(
    favoriteTeams.map(async (t) => ({
      team: t,
      scenarios: await nextOpponentScenarios(t.id),
    })),
  );
  return (
    <>
      <AppHeader title="順位表＆トーナメント" />

      <div className="px-4 pt-3">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--text-dim)]">
          Group Stage
        </p>
        <h1 className="pt-1 text-[24px] font-bold tracking-tight leading-tight text-gradient">
          このまま行けば、どうなる？
        </h1>
      </div>

      <div className="mt-5 space-y-5 px-4">
        {groups.map((g) => (
          <GroupBlock key={g.name} group={g} />
        ))}
      </div>

      {scenariosByTeam.length > 0 && (
        <>
          <SectionHeader
            kicker="If..."
            title={
              scenariosByTeam.length === 1
                ? `${scenariosByTeam[0].team.name}が決勝Tに進んだら？`
                : "推しチームが決勝Tに進んだら？"
            }
          />
          <div className="mx-4 space-y-3">
            {scenariosByTeam.map(({ team, scenarios }) => (
              <div
                key={team.id}
                className="glass-strong rounded-2xl p-5 space-y-4"
              >
                {scenariosByTeam.length > 1 && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[22px] leading-none">{team.flag}</span>
                    <p className="text-[14px] font-semibold tracking-tight">
                      {team.name}
                    </p>
                    <span className="text-[10px] text-white/45">
                      グループ{team.group}
                    </span>
                  </div>
                )}
                {scenarios.length === 0 ? (
                  <p className="text-[12px] text-white/55">
                    対戦シナリオは現在計算中…
                  </p>
                ) : (
                  scenarios.map((s) => (
                    <div key={s.rank} className="flex items-center gap-3">
                      <div
                        className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-[14px] font-bold ${
                          s.rank === 1
                            ? "bg-gradient-to-br from-[#ffb020] to-[#ff7a00]"
                            : "bg-gradient-to-br from-white/15 to-white/5 border border-white/10"
                        }`}
                      >
                        {s.rank}位
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-white/55">
                          {team.name}が{team.group}組{s.rank}位通過なら
                        </p>
                        <p className="text-[14px] font-semibold mt-0.5">
                          → {s.opponent}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
            <p className="text-[10px] text-white/40 px-1">
              ※ FIFA 2026 のR32対戦規則から想定した参考対戦カード
            </p>
          </div>
        </>
      )}

      <SectionHeader kicker="Knockout" title="決勝トーナメント" />
      <Link
        href="/tournament"
        className="mx-4 relative block rounded-2xl overflow-hidden border border-[var(--border-strong)] glow-ring"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #ff3b30 0%, #ffb020 50%, #007aff 100%)",
            opacity: 0.45,
          }}
        />
        <div className="absolute inset-0 hero-shade" />
        <div className="relative p-5 flex items-center gap-4">
          <div className="text-[36px] leading-none drop-shadow">🏆</div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-widest uppercase text-white/70">
              Tournament
            </p>
            <p className="text-[16px] font-bold tracking-tight leading-tight">
              勝ち上がりを、先に見る。
            </p>
            <p className="text-[11px] text-white/75 mt-1 leading-relaxed">
              ベスト32 〜 決勝。日本が来うる枠もハイライト。
            </p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path
              d="M9 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </Link>

      <div className="h-12" />
    </>
  );
}

function GroupBlock({ group }: { group: Group }) {
  const sorted = group.rows
    .slice()
    .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ff3b30] to-[#ffb020] flex items-center justify-center text-[12px] font-bold">
            {group.name}
          </span>
          <span className="text-[14px] font-semibold tracking-tight">
            グループ {group.name}
          </span>
        </div>
        <span className="text-[10px] text-white/40">
          {Math.max(...group.rows.map((r) => r.played))}試合消化
        </span>
      </div>
      <div className="grid grid-cols-[22px_1fr_28px_28px_28px_28px_40px] gap-2 px-4 py-2 text-[10px] text-white/45 border-b border-white/8">
        <span>#</span>
        <span>チーム</span>
        <span className="text-right">勝</span>
        <span className="text-right">分</span>
        <span className="text-right">負</span>
        <span className="text-right">±</span>
        <span className="text-right">勝点</span>
      </div>
      {sorted.map((row, i) => {
        const t = getTeamSync(row.teamId);
        if (!t) return null;
        return (
          <Link
            key={row.teamId}
            href={`/teams/${t.id}`}
            className="grid grid-cols-[22px_1fr_28px_28px_28px_28px_40px] gap-2 px-4 py-3 text-[12px] items-center hover:bg-white/[0.04] transition-colors"
          >
            <span
              className={`text-[11px] font-bold ${
                i < 2 ? "text-[var(--accent-2)]" : "text-white/30"
              }`}
            >
              {i + 1}
            </span>
            <span className="flex items-center gap-2 min-w-0">
              <span className="text-base">{t.flag}</span>
              <span className="truncate">{t.name}</span>
            </span>
            <span className="text-right tabular-nums">{row.w}</span>
            <span className="text-right tabular-nums">{row.d}</span>
            <span className="text-right tabular-nums">{row.l}</span>
            <span className="text-right tabular-nums text-white/70">
              {row.gf - row.ga > 0 ? "+" : ""}
              {row.gf - row.ga}
            </span>
            <span className="text-right tabular-nums font-bold">{row.pts}</span>
          </Link>
        );
      })}
    </div>
  );
}
