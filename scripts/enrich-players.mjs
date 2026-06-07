#!/usr/bin/env node
/**
 * 240人分の選手プロフィールを Wikipedia + Gemini で生成する。
 *
 * 入力: src/lib/data/squads.json
 * 出力: src/lib/data/enriched-players.json
 *
 * フロー:
 *   1. 各選手の名前で Wikipedia (English) を検索
 *   2. 記事のintroductoryを取得（bio facts）
 *   3. Gemini に渡して以下を JSON で生成:
 *      - tagline (1 行)
 *      - story (3 行)
 *      - strengths (5 項目 0.5刻みのレーティング)
 *      - whyWatch (1 行)
 *   4. enriched-players.json に書き込み
 *
 * 必要環境変数: GEMINI_API_KEY
 *
 * 使い方:
 *   npm install   # @google/genai を入れる
 *   GEMINI_API_KEY=... node scripts/enrich-players.mjs
 *
 *   或いは .env.local に書いて
 *   node -r dotenv/config scripts/enrich-players.mjs dotenv_config_path=.env.local
 *
 * 再実行: 既存 JSON にあるIDはスキップする (途中で止まっても続きから)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const SQUADS_PATH = path.join(ROOT, "src/lib/data/squads.json");
const OUT_PATH = path.join(ROOT, "src/lib/data/enriched-players.json");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY が未設定です。");
  console.error("export GEMINI_API_KEY=... or set in .env.local");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
// gemini-2.5-flash-lite: 1日 20件くらいで枯渇（新API keyは制限低い）
// gemini-2.5-flash: 5 RPM、別カウンタ持ち、こっちが今日使えそう
const MODEL = "gemini-2.5-flash";

const POS_LABEL = { GK: "ゴールキーパー", DF: "DF", MF: "MF", FW: "FW" };

/** Wikipedia API: 記事タイトルから wikitext の冒頭1段落を取得 */
async function fetchWikipediaIntro(title) {
  const url =
    "https://en.wikipedia.org/api/rest_v1/page/summary/" +
    encodeURIComponent(title.replace(/ /g, "_"));
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.type === "disambiguation") return null;
  return {
    title: data.title,
    extract: data.extract ?? "",
    thumbnail: data.thumbnail?.source ?? null,
    pageUrl: data.content_urls?.desktop?.page ?? null,
  };
}

/** Wikipedia 検索 → 上位ヒット返却 */
async function searchWikipedia(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
    query,
  )}&limit=3&namespace=0&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  // data = [searchTerm, titles[], descriptions[], urls[]]
  return data[1] ?? [];
}

/** "Lionel Messi (Argentina footballer)" などからベスト候補を選ぶ */
async function findBestWikiTitle(playerName, country) {
  // 1st: 直接 summary
  const direct = await fetchWikipediaIntro(playerName);
  if (direct && /football|soccer/i.test(direct.extract))
    return direct;

  // 2nd: search、national footballer keyword 強化
  const hits = await searchWikipedia(`${playerName} ${country} footballer`);
  for (const title of hits) {
    const intro = await fetchWikipediaIntro(title);
    if (intro && /football|soccer/i.test(intro.extract)) return intro;
  }
  // 3rd: plain search
  const hits2 = await searchWikipedia(playerName);
  for (const title of hits2) {
    const intro = await fetchWikipediaIntro(title);
    if (intro && /football|soccer/i.test(intro.extract)) return intro;
  }
  return null;
}

function buildPrompt({ name, club, position, country, wikiExtract, captain }) {
  return [
    "あなたはサッカー初心者向けのワールドカップガイドアプリのライターです。",
    "以下の選手について、日本語で読みやすいプロフィールを JSON で出力してください。",
    "事実は Wikipedia から渡される英文の bio に厳密に従い、無い情報は推測しないこと。",
    "選手の好印象を持つようなトーンで、ただし誇張しすぎないように。",
    "",
    `名前: ${name}`,
    `所属国: ${country}`,
    `ポジション: ${position}${captain ? " (キャプテン)" : ""}`,
    `所属クラブ: ${club}`,
    "",
    "Wikipedia bio (英文):",
    wikiExtract || "(情報なし)",
    "",
    "以下の形式の JSON だけを返してください。説明文・コードブロック・前後の文字は不要。",
    "{",
    '  "tagline": "短いキャッチコピー（10〜15文字）",',
    '  "story": ["1行目（30〜40文字）", "2行目", "3行目"],',
    '  "strengths": [',
    '    {"label":"スピード","rating":4.0},',
    '    {"label":"テクニック","rating":4.5},',
    '    {"label":"フィジカル","rating":3.5},',
    '    {"label":"視野","rating":4.0},',
    '    {"label":"決定力","rating":3.0}',
    "  ],",
    '  "whyWatch": "「ここを見てほしい」1文。50〜80文字。具体的なプレーや特徴を1点に絞る"',
    "}",
    "",
    "ratingは 1.0〜5.0、0.5刻みで。ポジションに応じて label を変更可（DF/MFなら『守備』『パス』など）。",
  ].join("\n");
}

async function callGemini(prompt, attempt = 0) {
  try {
    const resp = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });
    const text = resp.text;
    if (!text) throw new Error("Empty response");
    try {
      return JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
      throw new Error("Failed to parse JSON: " + text.slice(0, 200));
    }
  } catch (err) {
    const msg = String(err?.message ?? err);
    // 429: rate limit、503: 過負荷 → 指数バックオフでリトライ
    const isRetryable = /429|RESOURCE_EXHAUSTED|503|UNAVAILABLE|overloaded/.test(msg);
    if (isRetryable && attempt < 5) {
      // 30, 60, 90, 120, 180 秒（429 は分単位で quota がリセットされるので長めに）
      const waitSec = [30, 60, 90, 120, 180][attempt] ?? 180;
      process.stdout.write(`(${attempt + 1}/5 retry in ${waitSec}s)`);
      await sleep(waitSec * 1000);
      return callGemini(prompt, attempt + 1);
    }
    throw err;
  }
}

function slugifyName(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const squadsRaw = await fs.readFile(SQUADS_PATH, "utf8");
  const squads = JSON.parse(squadsRaw);

  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(OUT_PATH, "utf8"));
  } catch {
    existing = {};
  }

  let totalCount = 0;
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const code of Object.keys(squads)) {
    const teamId = code.toLowerCase();
    const country = code; // 簡略化、country 名 (countryJa) は本ファイル外
    const sq = squads[code];
    for (const p of sq.players) {
      totalCount += 1;
      const id = `${teamId}-${slugifyName(p.name)}`;
      if (existing[id]) {
        skipped += 1;
        continue;
      }

      try {
        process.stdout.write(`[${totalCount}] ${id} (${p.name}) `);
        const wiki = await findBestWikiTitle(p.name, country);
        const extract = wiki?.extract ?? "";
        const prompt = buildPrompt({
          name: p.name,
          club: p.club,
          position: POS_LABEL[p.pos] ?? p.pos,
          country,
          wikiExtract: extract,
          captain: p.captain,
        });
        const ai_data = await callGemini(prompt);

        existing[id] = {
          ...ai_data,
          source: {
            wikiTitle: wiki?.title ?? null,
            wikiUrl: wiki?.pageUrl ?? null,
            extractLen: extract.length,
          },
          generatedAt: new Date().toISOString(),
        };
        processed += 1;
        process.stdout.write("✓\n");

        // 進捗保存（途中で止まっても再開可）
        if (processed % 5 === 0) {
          await fs.writeFile(OUT_PATH, JSON.stringify(existing, null, 2));
        }
      } catch (err) {
        failed += 1;
        console.error(`✗ ${err.message?.slice(0, 100)}`);
      }
      // gemini-2.5-flash は 5 RPM 上限。安全圏で 15 秒間隔 = 4 RPM
      await sleep(15000);
    }
  }

  await fs.writeFile(OUT_PATH, JSON.stringify(existing, null, 2));
  console.log(
    `\n完了: total=${totalCount} processed=${processed} skipped=${skipped} failed=${failed}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
