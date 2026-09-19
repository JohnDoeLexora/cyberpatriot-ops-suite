#!/usr/bin/env bash
# Read-only local README keyword skim. Never contacts CCS or the internet.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" files-readme && exit 0 || true
fi
ROOT="$(cd "$HERE/../.." && pwd)"
python3 - "$ROOT" <<'PY'
import json, os, re, sys
from pathlib import Path
root = Path(sys.argv[1])
kws = [ln.strip().lower() for ln in (root / "config" / "forensics-keywords.txt").read_text(encoding="utf-8", errors="replace").splitlines() if ln.strip() and not ln.startswith("#") and len(ln.strip()) >= 3]
hits = []
files = []
for base in ["/home", "/root", "/opt", "/tmp"]:
    b = Path(base)
    if not b.is_dir():
        continue
    for p in b.rglob("*"):
        if len(files) >= 80:
            break
        if not p.is_file() or p.stat().st_size > 400000:
            continue
        name = p.name.lower()
        if name.startswith("readme") or "forensic" in name or "question" in name:
            files.append(p)
    if len(files) >= 80:
        break
hashish = re.compile(r"^[a-f0-9]{32,}$", re.I)
for p in files:
    try:
        text = p.read_text(encoding="utf-8", errors="replace")
    except OSError:
        continue
    for line in text.splitlines():
        t = line.strip()
        if not t or hashish.match(t.replace(" ", "")):
            continue
        low = t.lower()
        for kw in kws:
            if kw in low:
                hits.append({"path": str(p), "keyword": kw, "line": t[:160]})
                break
        if len(hits) >= 40:
            break
    if len(hits) >= 40:
        break
print(json.dumps({"ok": True, "extra": {"hits": hits, "ccsContacted": False}}))
PY
