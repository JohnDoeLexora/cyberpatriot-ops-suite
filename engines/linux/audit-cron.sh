#!/usr/bin/env bash
set -euo pipefail
python3 - <<'PY'
import json, pathlib
files = []
for p in [pathlib.Path("/etc/crontab"), *pathlib.Path("/etc/cron.d").glob("*")]:
    if p.is_file():
        files.append({"path": str(p), "note": p.read_text(errors="replace")[:500]})
print(json.dumps({"ok": True, "files": files}, indent=2))
PY
