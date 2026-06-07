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

async function fdRequest(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": apiKey },
  });
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

  // スコープ: 今 ± 6 時間以内の試合（env で範囲上書き可）
  const dateFrom =
    process.env.LINEUP_FROM ??
    new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dateTo =
    process.env.LINEUP_TO ??
    new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString().slice(0, 10);

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
      const score = md.score?.fullTime ?? {};
      const halftime = md.score?.halfTime ?? {};
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
        existingResults[key] = {
          source: "auto",
          status: fdStatus,
          home: score.home,
          away: score.away,
          halfHome: halftime.home,
          halfAway: halftime.away,
          goals,
          bookings,
          substitutions,
          fetchedAt: new Date().toISOString(),
        };
      }

      if (homeLineup.length === 0 && awayLineup.length === 0) {
        console.log(`    lineup not yet available (status: ${fdStatus})`);
        continue;
      }
      const entry = {
        source: "auto",
        fetchedAt: new Date().toISOString(),
        home: buildLineup(md.homeTeam, homeLineup),
        away: buildLineup(md.awayTeam, awayLineup),
      };
      existing[key] = entry;
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
