#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, pathlib
files = []
for p in [pathlib.Path("/etc/crontab"), *pathlib.Path("/etc/cron.d").glob("*")]:
    if p.is_file():
        files.append({"path": str(p), "note": p.read_text(errors="replace")[:500]})
print(json.dumps({"ok": True, "files": files}, indent=2))
PY
