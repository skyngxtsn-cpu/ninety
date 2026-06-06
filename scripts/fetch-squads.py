#!/usr/bin/env python3
"""
Wikipedia「2026 FIFA World Cup squads」から全48カ国の代表メンバーを取得。
各国上位5人を抜粋し、TheSportsDBで写真URLも引っ張ってJSONに出力する。

実行: python3 scripts/fetch-squads.py
出力: src/lib/data/squads.json
"""
import json, re, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

WIKI = "https://en.wikipedia.org/w/api.php"
SDB = "https://www.thesportsdb.com/api/v1/json/3"

# FIFAコード → fifa_code on OpenFootball (uppercase)
TARGETS = [
  "MEX","RSA","KOR","CZE","CAN","BIH","QAT","SUI",
  "BRA","MAR","HAI","SCO","USA","PAR","AUS","TUR",
  "GER","CUW","CIV","ECU","NED","JPN","SWE","TUN",
  "BEL","EGY","IRN","NZL","ESP","CPV","KSA","URU",
  "FRA","SEN","IRQ","NOR","ARG","ALG","AUT","JOR",
  "POR","COD","UZB","COL","ENG","CRO","GHA","PAN",
]

# 国名（Wikipedia上の名前）→ fifa_code 逆引きが必要
COUNTRY_NAMES = {
  "Mexico":"MEX","South Africa":"RSA","South Korea":"KOR","Czech Republic":"CZE",
  "Canada":"CAN","Bosnia and Herzegovina":"BIH","Qatar":"QAT","Switzerland":"SUI",
  "Brazil":"BRA","Morocco":"MAR","Haiti":"HAI","Scotland":"SCO",
  "United States":"USA","Paraguay":"PAR","Australia":"AUS","Turkey":"TUR",
  "Germany":"GER","Curaçao":"CUW","Ivory Coast":"CIV","Ecuador":"ECU",
  "Netherlands":"NED","Japan":"JPN","Sweden":"SWE","Tunisia":"TUN",
  "Belgium":"BEL","Egypt":"EGY","Iran":"IRN","New Zealand":"NZL",
  "Spain":"ESP","Cape Verde":"CPV","Saudi Arabia":"KSA","Uruguay":"URU",
  "France":"FRA","Senegal":"SEN","Iraq":"IRQ","Norway":"NOR",
  "Argentina":"ARG","Algeria":"ALG","Austria":"AUT","Jordan":"JOR",
  "Portugal":"POR","DR Congo":"COD","Uzbekistan":"UZB","Colombia":"COL",
  "England":"ENG","Croatia":"CRO","Ghana":"GHA","Panama":"PAN",
}

UA = "90-Match-Story/0.1 (https://github.com/personal-app; contact: dev@example.com)"

def http_get(url, timeout=10):
  req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
  with urllib.request.urlopen(req, timeout=timeout) as r:
    return json.load(r)

def get_sections():
  url = f"{WIKI}?action=parse&page=2026_FIFA_World_Cup_squads&format=json&prop=sections"
  return http_get(url)["parse"]["sections"]

def get_section_wikitext(index):
  url = f"{WIKI}?action=parse&page=2026_FIFA_World_Cup_squads&format=json&prop=wikitext&section={index}"
  return http_get(url)["parse"]["wikitext"]["*"]

COACH_PAT = re.compile(r"(?:Coach|Manager|Head coach)\s*:\s*\[\[([^\]|]+)(?:\|[^\]]+)?\]\]", re.IGNORECASE)

def find_player_templates(wt):
  """Each {{nat fs g player|...}} may contain nested {{...}}. Brace-balanced scan."""
  results = []
  i = 0
  marker = "{{nat fs g player"
  while True:
    start = wt.find(marker, i)
    if start == -1: break
    # find matching }} with depth tracking
    j = start + len(marker)
    depth = 1
    while j < len(wt):
      if wt[j:j+2] == "{{":
        depth += 1; j += 2
      elif wt[j:j+2] == "}}":
        depth -= 1; j += 2
        if depth == 0:
          break
      else:
        j += 1
    if depth != 0: break
    body = wt[start + len(marker):j-2]  # between |...| ... and closing }}
    if body.startswith("|"): body = body[1:]
    results.append(body)
    i = j
  return results

def parse_section(wt):
  coach_m = COACH_PAT.search(wt)
  coach = coach_m.group(1) if coach_m else None
  players = []
  for raw in find_player_templates(wt):
    fields = {}
    # split on | but skip pipes inside [[...]] or {{...}}
    depth = 0
    cur = ""
    parts = []
    for ch in raw:
      if ch in "[{": depth += 1
      elif ch in "]}": depth -= 1
      if ch == "|" and depth == 0:
        parts.append(cur); cur = ""
      else:
        cur += ch
    if cur: parts.append(cur)
    for kv in parts:
      if "=" in kv:
        k, v = kv.split("=", 1)
        fields[k.strip()] = v.strip()
    name_raw = fields.get("name","").strip()
    # parse [[Wiki Title|Display]] or [[Wiki Title]]
    nm = re.match(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]", name_raw)
    if nm:
      name = nm.group(2) or nm.group(1)
      # remove (footballer) etc disambig
      name = re.sub(r"\s*\([^)]*\)", "", name).strip()
    else:
      name = name_raw
    club_raw = fields.get("club","").strip()
    cm = re.match(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]", club_raw)
    club = (cm.group(2) or cm.group(1)) if cm else club_raw
    other = fields.get("other","")
    is_captain = "captain" in other.lower()
    players.append({
      "no": fields.get("no",""),
      "pos": fields.get("pos",""),
      "name": name,
      "club": club,
      "captain": is_captain,
    })
  return coach, players

def pick_top(players, max_count=5):
  """Captain + #10 + #1 GK + #9 FW + remaining MFs"""
  picked = []
  used = set()
  # captain first
  for p in players:
    if p["captain"] and len(picked) < max_count:
      picked.append(p); used.add(p["no"])
  # #10
  for p in players:
    if p["no"] == "10" and p["no"] not in used and len(picked) < max_count:
      picked.append(p); used.add(p["no"])
  # #1 GK
  for p in players:
    if p["no"] == "1" and p["pos"] == "GK" and p["no"] not in used and len(picked) < max_count:
      picked.append(p); used.add(p["no"])
  # #9 FW or any FW
  for p in players:
    if p["pos"] == "FW" and p["no"] not in used and len(picked) < max_count:
      picked.append(p); used.add(p["no"])
      break
  # fill with MFs, then DFs
  for pos_pref in ["MF", "DF", "FW", "GK"]:
    for p in players:
      if len(picked) >= max_count: break
      if p["pos"] == pos_pref and p["no"] not in used:
        picked.append(p); used.add(p["no"])
  return picked[:max_count]

import unicodedata

def strip_accents(s):
  return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

def _search_one(q):
  try:
    url = f"{SDB}/searchplayers.php?p={urllib.parse.quote(q)}"
    d = http_get(url, timeout=8)
    ps = d.get("player") or []
    best = next((p for p in ps if p.get("strSport") == "Soccer"), ps[0] if ps else None)
    if not best: return None
    return best.get("strCutout") or best.get("strThumb")
  except Exception:
    return None

def fetch_photo(name, club_hint=None):
  # 1) full name as-is
  r = _search_one(name)
  if r: return r
  # 2) アクセント除去
  ascii_name = strip_accents(name)
  if ascii_name != name:
    r = _search_one(ascii_name)
    if r: return r
  # 3) 姓のみ
  parts = ascii_name.split()
  if len(parts) >= 2:
    last = parts[-1]
    if len(last) >= 4:
      r = _search_one(last)
      if r: return r
  return None

def main():
  print("Fetching section index...", file=sys.stderr)
  secs = get_sections()
  # map section "line" → index, only top-level team sections (level 3 = ===Team===)
  team_secs = []
  for s in secs:
    line = s.get("line","")
    code = COUNTRY_NAMES.get(line)
    if code and s.get("level") == "3":
      team_secs.append((code, s["index"], line))
  print(f"Found {len(team_secs)} team sections", file=sys.stderr)

  squads = {}
  for code, idx, line in team_secs:
    print(f"  {code} ({line}) ...", file=sys.stderr)
    try:
      wt = get_section_wikitext(idx)
      coach, all_players = parse_section(wt)
      top = pick_top(all_players, max_count=5)
      squads[code] = {
        "coach": coach,
        "players": top,
      }
    except Exception as e:
      print(f"    ERROR: {e}", file=sys.stderr)
      squads[code] = {"coach": None, "players": []}
    time.sleep(0.3)  # be polite

  # Photo lookup (sequential, rate-limit safe)
  # 既存のsquads.jsonに photo がある選手はスキップ（増分実行用）
  print("Fetching photos from TheSportsDB (sequential, 1.2s/req)...", file=sys.stderr)
  existing = {}
  prev_file = Path(__file__).parent.parent / "src" / "lib" / "data" / "squads.json"
  if prev_file.exists():
    try:
      prev = json.loads(prev_file.read_text())
      for code, sq in prev.items():
        for p in sq.get("players", []):
          if p.get("photo"):
            existing[(code, p["no"])] = p["photo"]
    except Exception: pass

  jobs = []
  for code, sq in squads.items():
    for p in sq["players"]:
      jobs.append((code, p["no"], p["name"], p.get("club")))

  done = 0
  hits = 0
  cached = 0
  for code, no, name, club in jobs:
    done += 1
    if (code, no) in existing:
      photo = existing[(code, no)]
      cached += 1
    else:
      photo = fetch_photo(name, club)
      time.sleep(1.2)
    if photo: hits += 1
    # write back
    for p in squads[code]["players"]:
      if p["no"] == no:
        p["photo"] = photo
        break
    if done % 20 == 0 or done == len(jobs):
      print(f"  {done}/{len(jobs)} (hits: {hits}, cached: {cached})", file=sys.stderr)

  out = Path(__file__).parent.parent / "src" / "lib" / "data" / "squads.json"
  out.write_text(json.dumps(squads, ensure_ascii=False, indent=2))
  print(f"\nWrote {out}", file=sys.stderr)
  print(f"Teams: {len(squads)}", file=sys.stderr)
  print(f"Players: {sum(len(s['players']) for s in squads.values())}", file=sys.stderr)
  total_photos = sum(1 for s in squads.values() for p in s["players"] if p.get("photo"))
  print(f"Photos found: {total_photos}", file=sys.stderr)

if __name__ == "__main__":
  main()
