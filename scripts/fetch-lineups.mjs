#!/usr/bin/env node
/**
 * football-data.org から W杯 2026 試合のスタメンを取得して
 * src/lib/data/lineup-overrides-auto.json に書き出す。
 *
 * 仕様:
 *   - キックオフ ± 2 時間内の試合を対象（pre-match lineup と試合中のスタメン両方）
 *   - 既存 JSON に書かれた試合は再取得しない（差分のみ）
 *   - football-data.org の lineup は試合 1h 前から提供開始
 *   - レート制限: 10 req/分（無料枠）→ 6秒間隔で安全
 *
 * 必要環境変数: FOOTBALL_DATA_API_KEY
 *
 * 使い方:
 *   FOOTBALL_DATA_API_KEY=... node scripts/fetch-lineups.mjs
 *
 * GitHub Actions で 5 分ごとに走らせる前提（push-tick.yml と同様）
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const OUT_PATH = path.join(ROOT, "src/lib/data/lineup-overrides-auto.json");
const RESULTS_PATH = path.join(ROOT, "src/lib/data/match-results-auto.json");
const SQUADS_PATH = path.join(ROOT, "src/lib/data/squads.json");

const apiKey = process.env.FOOTBALL_DATA_API_KEY;
if (!apiKey) {
  console.error("FOOTBALL_DATA_API_KEY が未設定");
  process.exit(1);
}

const COMPETITION = "WC"; // FIFA World Cup
const BASE = "https://api.football-data.org/v4";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fdRequest(path, _retried = false) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": apiKey },
  });
  if (res.status === 429 && !_retried) {
    // Wait the time the API tells us, plus 2s buffer, then retry once
    const t = await res.text();
    const match = /Wait (\d+) seconds/.exec(t);
    const waitSec = match ? Number(match[1]) + 2 : 62;
    console.log(`    ⏳ rate limit, sleeping ${waitSec}s before retry`);
    await sleep(waitSec * 1000);
    return fdRequest(path, true);
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

/** team 名 → 内部 teamId (jpn, ned, ...) のマッピング */
const TEAM_NAME_TO_ID = {
  Mexico: "mex",
  "South Africa": "rsa",
  "Korea Republic": "kor",
  "South Korea": "kor",
  "Czech Republic": "cze",
  Czechia: "cze",
  Canada: "can",
  "Bosnia and Herzegovina": "bih",
  "Bosnia & Herzegovina": "bih",
  "Bosnia-Herzegovina": "bih",
  Qatar: "qat",
  Switzerland: "sui",
  Brazil: "bra",
  Morocco: "mar",
  Haiti: "hai",
  Scotland: "sco",
  USA: "usa",
  "United States": "usa",
  Paraguay: "par",
  Australia: "aus",
  Turkey: "tur",
  Türkiye: "tur",
  Germany: "ger",
  "Curaçao": "cuw",
  Curacao: "cuw",
  "Ivory Coast": "civ",
  "Côte d'Ivoire": "civ",
  Ecuador: "ecu",
  Netherlands: "ned",
  Japan: "jpn",
  Sweden: "swe",
  Tunisia: "tun",
  Belgium: "bel",
  Egypt: "egy",
  Iran: "irn",
  "IR Iran": "irn",
  "New Zealand": "nzl",
  Spain: "esp",
  "Cape Verde": "cpv",
  "Cape Verde Islands": "cpv",
  "Saudi Arabia": "ksa",
  Uruguay: "uru",
  France: "fra",
  Senegal: "sen",
  Iraq: "irq",
  Norway: "nor",
  Argentina: "arg",
  Algeria: "alg",
  Austria: "aut",
  Jordan: "jor",
  Portugal: "por",
  "DR Congo": "cod",
  "Congo DR": "cod",
  "Democratic Republic of the Congo": "cod",
  Uzbekistan: "uzb",
  Colombia: "col",
  England: "eng",
  Croatia: "cro",
  Ghana: "gha",
  Panama: "pan",
};

function teamIdFromName(name) {
  return TEAM_NAME_TO_ID[name?.trim()] ?? null;
}

/** football-data.org のマッチID → 試合ID（"2026-06-11-mex-rsa"形式） */
function makeMatchKey(fdMatch) {
  const date = (fdMatch.utcDate ?? "").slice(0, 10);
  const home = teamIdFromName(fdMatch.homeTeam?.name);
  const away = teamIdFromName(fdMatch.awayTeam?.name);
  if (!date || !home || !away) return null;
  return `${date}-${home}-${away}`;
}

/**
 * position 文字列から x/y 座標を推定。
 * formation 文字列（"4-2-3-1"等）と各選手の position を組み合わせる。
 *
 * football-data.org の position カテゴリ:
 *  - Goalkeeper
 *  - Centre-Back / Left-Back / Right-Back / Defender
 *  - Defensive Midfield / Central Midfield / Attacking Midfield / Midfielder
 *  - Left Winger / Right Winger / Left Midfield / Right Midfield
 *  - Centre-Forward / Left Forward / Right Forward / Forward
 */
function layoutFromFormation(formation, players) {
  // 既定 4-2-3-1 のテンプレート
  const TEMPLATES = {
    "4-3-3": [
      ["GK", 50, 8],
      ["RB", 85, 22],
      ["RCB", 62, 20],
      ["LCB", 38, 20],
      ["LB", 15, 22],
      ["DM", 50, 40],
      ["RM", 70, 52],
      ["LM", 30, 52],
      ["RW", 85, 70],
      ["ST", 50, 80],
      ["LW", 15, 70],
    ],
    "4-2-3-1": [
      ["GK", 50, 8],
      ["RB", 85, 22],
      ["RCB", 62, 20],
      ["LCB", 38, 20],
      ["LB", 15, 22],
      ["DM1", 60, 40],
      ["DM2", 40, 40],
      ["RAM", 82, 62],
      ["CAM", 50, 62],
      ["LAM", 18, 62],
      ["ST", 50, 85],
    ],
    "4-4-2": [
      ["GK", 50, 8],
      ["RB", 85, 22],
      ["RCB", 62, 20],
      ["LCB", 38, 20],
      ["LB", 15, 22],
      ["RM", 80, 50],
      ["RCM", 60, 45],
      ["LCM", 40, 45],
      ["LM", 20, 50],
      ["RST", 60, 82],
      ["LST", 40, 82],
    ],
    "3-4-3": [
      ["GK", 50, 8],
      ["RCB", 70, 20],
      ["CCB", 50, 18],
      ["LCB", 30, 20],
      ["RWB", 88, 45],
      ["RCM", 60, 50],
      ["LCM", 40, 50],
      ["LWB", 12, 45],
      ["RW", 70, 78],
      ["ST", 50, 82],
      ["LW", 30, 78],
    ],
    "3-5-2": [
      ["GK", 50, 8],
      ["RCB", 70, 20],
      ["CCB", 50, 18],
      ["LCB", 30, 20],
      ["RWB", 88, 45],
      ["RCM", 65, 52],
      ["CAM", 50, 50],
      ["LCM", 35, 52],
      ["LWB", 12, 45],
      ["RST", 60, 82],
      ["LST", 40, 82],
    ],
  };
  const tpl = TEMPLATES[formation] ?? TEMPLATES["4-2-3-1"];

  // ポジションカテゴリ別に分類
  const gks = players.filter((p) => /Goalkeeper/i.test(p.position ?? ""));
  const defs = players.filter((p) => /(Back|Defender|Defence)/i.test(p.position ?? ""));
  const mids = players.filter((p) => /(Midfield|Midfielder)/i.test(p.position ?? ""));
  const fwds = players.filter(
    (p) => /(Forward|Winger|Striker)/i.test(p.position ?? ""),
  );

  // テンプレートのスロットを満たすように配置
  const slots = [];
  const usedIds = new Set();
  function pickFrom(pool, used) {
    return pool.find((p) => !used.has(p.id));
  }

  for (const [role, x, y] of tpl) {
    let pool;
    if (role === "GK") pool = gks;
    else if (role.includes("B")) pool = defs;
    else if (role.includes("ST") || role.includes("W") || role === "CF") pool = fwds;
    else pool = mids;

    let p = pickFrom(pool, usedIds);
    if (!p) {
      // フォールバック: どこからでもいいから残り選手
      p = pickFrom(players, usedIds);
    }
    if (!p) {
      slots.push({ name: "?", number: 0, role, x, y });
      continue;
    }
    usedIds.add(p.id);
    slots.push({
      name: p.name,
      number: p.shirtNumber ?? 0,
      role: shortRole(role),
      x,
      y,
    });
  }
  return slots;
}

function shortRole(slotRole) {
  const map = {
    GK: "GK",
    RB: "右SB",
    LB: "左SB",
    RCB: "CB",
    LCB: "CB",
    CCB: "CB",
    RWB: "右WB",
    LWB: "左WB",
    DM: "アンカー",
    DM1: "ボランチ",
    DM2: "ボランチ",
    RCM: "ボランチ",
    LCM: "ボランチ",
    RM: "右SH",
    LM: "左SH",
    CAM: "トップ下",
    RAM: "右AM",
    LAM: "左AM",
    RW: "右WG",
    LW: "左WG",
    ST: "CF",
    RST: "CF",
    LST: "CF",
  };
  return map[slotRole] ?? slotRole;
}

function buildLineup(team, lineupArr) {
  if (!lineupArr || lineupArr.length === 0) return null;
  // football-data.org returns starters + bench. 先発 = lineup, 控え = bench
  // ただし API 仕様で「lineup」が先発全員含むので 11 人取れる
  const starters = lineupArr.slice(0, 11);
  const formation = team.formation ?? "4-2-3-1";
  const slots = layoutFromFormation(formation, starters);
  return {
    formation,
    manager: team.coach?.name ?? undefined,
    slots,
  };
}

async function main() {
  // 既存の auto JSON
  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(OUT_PATH, "utf8"));
  } catch {
    existing = {};
  }
  let existingResults = {};
  try {
    existingResults = JSON.parse(await fs.readFile(RESULTS_PATH, "utf8"));
  } catch {
    existingResults = {};
  }

  // スコープ: 直近 24h + 翌 6h（env で範囲上書き可）
  // 空文字も無視（`??` だけでなく `||` も使用）
  const dateFrom =
    (process.env.LINEUP_FROM || "").trim() ||
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dateTo =
    (process.env.LINEUP_TO || "").trim() ||
    new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString().slice(0, 10);

  console.log(`Fetching W杯 fixtures for ${dateFrom} 〜 ${dateTo}`);

  let fixturesData;
  try {
    fixturesData = await fdRequest(
      `/competitions/${COMPETITION}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
    );
  } catch (err) {
    console.error("Failed to fetch fixtures:", err.message);
    process.exit(1);
  }
  const matches = fixturesData.matches ?? [];
  console.log(`Found ${matches.length} matches in window`);

  let updated = 0;
  let skipped = 0;
  let resultsChanged = 0; // 結果 JSON が変わった件数（push-tick 即時起動判定用）
  for (const m of matches) {
    const key = makeMatchKey(m);
    if (!key) {
      console.log(`  skip (unknown team): ${m.homeTeam?.name} vs ${m.awayTeam?.name}`);
      continue;
    }
    // 既に lineup を取得済みかつ confirmed なら再取得しない
    if (existing[key]?.source === "auto" && existing[key]?.home?.slots?.length >= 11) {
      skipped += 1;
      continue;
    }
    console.log(`  fetching ${key} (FD id ${m.id})`);
    try {
      const detailData = await fdRequest(`/matches/${m.id}`);
      const md = detailData.match ?? detailData;
      const homeLineup = md.homeTeam?.lineup ?? [];
      const awayLineup = md.awayTeam?.lineup ?? [];

      // === スコア・ステータスを取得して match-results-auto.json に保存 ===
      // status: SCHEDULED / TIMED / IN_PLAY / PAUSED / FINISHED / SUSPENDED / POSTPONED 等
      const fdStatus = md.status ?? m.status;
      const score = md.score?.fullTime ?? {}; // 規定時間 (90 分) 終了時点のスコア
      const halftime = md.score?.halfTime ?? {};
      // 決勝T のみで使う延長 / PK 情報。普通のグループ試合では null。
      const extraTime = md.score?.extraTime ?? null; // 延長戦終了時点の累計
      const penalties = md.score?.penalties ?? null; // PK 戦の勝負シュート
      const duration = md.score?.duration ?? "REGULAR"; // REGULAR / EXTRA_TIME / PENALTY_SHOOTOUT
      const winner = md.score?.winner ?? null; // HOME_TEAM / AWAY_TEAM / DRAW
      if (
        fdStatus === "FINISHED" ||
        fdStatus === "IN_PLAY" ||
        fdStatus === "PAUSED"
      ) {
        // 試合イベント: 得点・カード・交代
        const goals = (md.goals ?? []).map((g) => ({
          minute: g.minute ?? null,
          injuryTime: g.injuryTime ?? null,
          type: g.type ?? "REGULAR", // REGULAR / OWN / PENALTY
          team: teamIdFromName(g.team?.name) ?? "",
          scorer: g.scorer?.name ?? "",
          assist: g.assist?.name ?? null,
        }));
        const bookings = (md.bookings ?? []).map((b) => ({
          minute: b.minute ?? null,
          team: teamIdFromName(b.team?.name) ?? "",
          player: b.player?.name ?? "",
          card: b.card ?? "YELLOW",
        }));
        const substitutions = (md.substitutions ?? []).map((s) => ({
          minute: s.minute ?? null,
          team: teamIdFromName(s.team?.name) ?? "",
          playerOut: s.playerOut?.name ?? "",
          playerIn: s.playerIn?.name ?? "",
        }));
        // 冪等にするため、本質的に変わってない時は fetchedAt を更新しない。
        // これがないと 5 分ごとに毎回コミット → Vercel ビルド消費 → デイリー制限。
        const prev = existingResults[key];
        const next = {
          source: "auto",
          status: fdStatus,
          home: score.home,
          away: score.away,
          // 延長戦 / PK 戦情報（決勝Tでのみ意味あり）
          extraHome: extraTime?.home ?? null,
          extraAway: extraTime?.away ?? null,
          penHome: penalties?.home ?? null,
          penAway: penalties?.away ?? null,
          duration,
          winner,
          halfHome: halftime.home,
          halfAway: halftime.away,
          goals,
          bookings,
          substitutions,
        };
        const changed =
          !prev ||
          prev.status !== next.status ||
          prev.home !== next.home ||
          prev.away !== next.away ||
          prev.halfHome !== next.halfHome ||
          prev.halfAway !== next.halfAway ||
          prev.extraHome !== next.extraHome ||
          prev.extraAway !== next.extraAway ||
          prev.penHome !== next.penHome ||
          prev.penAway !== next.penAway ||
          prev.duration !== next.duration ||
          prev.winner !== next.winner ||
          (prev.goals?.length ?? 0) !== next.goals.length ||
          (prev.bookings?.length ?? 0) !== next.bookings.length ||
          (prev.substitutions?.length ?? 0) !== next.substitutions.length;
        if (changed) {
          existingResults[key] = {
            ...next,
            fetchedAt: new Date().toISOString(),
          };
          resultsChanged += 1;
        }
        // 変化なし → 既存エントリそのままで上書きしない（fetchedAt も維持）
      }

      if (homeLineup.length === 0 && awayLineup.length === 0) {
        console.log(`    lineup not yet available (status: ${fdStatus})`);
        continue;
      }
      // 冪等性: 既に同じ人数のスタメンが入っていれば fetchedAt 含め更新しない
      const prevLineup = existing[key];
      const newHome = buildLineup(md.homeTeam, homeLineup);
      const newAway = buildLineup(md.awayTeam, awayLineup);
      const prevHomeCount = prevLineup?.home?.slots?.length ?? 0;
      const prevAwayCount = prevLineup?.away?.slots?.length ?? 0;
      const lineupChanged =
        !prevLineup ||
        prevHomeCount !== (newHome?.slots?.length ?? 0) ||
        prevAwayCount !== (newAway?.slots?.length ?? 0);
      if (!lineupChanged) {
        console.log(`    lineup already up-to-date (skipped)`);
        continue;
      }
      existing[key] = {
        source: "auto",
        fetchedAt: new Date().toISOString(),
        home: newHome,
        away: newAway,
      };
      updated += 1;
      console.log(
        `    ✓ lineup: home ${homeLineup.length} / away ${awayLineup.length} | status: ${fdStatus}`,
      );
    } catch (err) {
      console.error(`    ✗ ${err.message}`);
    }
    await sleep(6000); // rate limit: 10 req/min → 6sec safe
  }

  await fs.writeFile(OUT_PATH, JSON.stringify(existing, null, 2));
  await fs.writeFile(RESULTS_PATH, JSON.stringify(existingResults, null, 2));
  console.log(
    `\nDone: updated=${updated}, skipped=${skipped}, total lineups=${Object.keys(existing).length}, total results=${Object.keys(existingResults).length}`,
  );

  // === Redis 直接書き込み ===
  // Vercel デプロイ完了を待たずに push-tick が即読めるように、
  // Upstash Redis に直接 results JSON を保存する。
  // データ駆動の通知 (goal / result / halftime score) の遅延を激減させる。
  const hasAnyChange = updated > 0 || resultsChanged > 0;
  const redisUrl = process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;
  if (redisUrl && redisToken && hasAnyChange) {
    try {
      // results
      const res1 = await fetch(`${redisUrl}/set/match:results:auto`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(existingResults),
      });
      console.log(`Redis results SET: ${res1.status}`);
      // lineups
      const res2 = await fetch(`${redisUrl}/set/match:lineups:auto`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(existing),
      });
      console.log(`Redis lineups SET: ${res2.status}`);
    } catch (err) {
      console.error(`✗ Redis SET threw: ${err.message}`);
    }
  } else if (hasAnyChange) {
    console.log("(Redis env vars not set, skipping Redis write)");
  }

  // === push-tick 即時起動 ===
  // 変更があった場合のみ、Vercel の /api/push/tick を直接叩いて
  // cron 待ちなく通知を配信。これで「変更検知 → 通知配信」が秒単位に。
  const siteUrl = (process.env.SITE_URL || "https://ninety-sand.vercel.app").replace(/\/+$/, "");
  const tickSecret = process.env.TICK_SECRET;
  if (tickSecret && hasAnyChange) {
    try {
      const res = await fetch(`${siteUrl}/api/push/tick`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tickSecret}` },
      });
      console.log(`✓ push-tick triggered: ${res.status}`);
    } catch (err) {
      console.error(`✗ push-tick threw: ${err.message}`);
    }
  } else if (!hasAnyChange) {
    console.log("(no change, skipping push-tick trigger)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
