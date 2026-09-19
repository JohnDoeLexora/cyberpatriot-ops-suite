#!/usr/bin/env bash
# Drop hosts-file sinkholes of update/AV/public names. Keep localhost.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
python3 - <<'PY'
from pathlib import Path
import re, json
path = Path("/etc/hosts")
text = path.read_text(encoding="utf-8", errors="replace") if path.exists() else ""
pat = re.compile(r"windowsupdate|microsoft\.com|virustotal|avast|avg|defender|google\.com|facebook|youtube|twitter|bing\.com|adobe\.com|symantec|mcafee", re.I)
keep, drop = [], []
for line in text.splitlines(True):
    t = line.strip()
    if not t or t.startswith("#"):
        keep.append(line)
        continue
    parts = t.split()
    ip, names = parts[0], parts[1:]
    sink = ip in {"127.0.0.1", "0.0.0.0", "::1"}
    if sink and any(pat.search(n) for n in names):
        drop.append(t)
        continue
    keep.append(line)
path.write_text("".join(keep) if keep else "127.0.0.1\tlocalhost\n", encoding="utf-8")
print(json.dumps({"ok": True, "dropped": drop}))
PY
