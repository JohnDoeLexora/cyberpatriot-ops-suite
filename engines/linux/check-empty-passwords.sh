#!/usr/bin/env bash
# Classifies empty/locked/set. Never prints hashes.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json
users = []
try:
    lines = open("/etc/shadow", encoding="utf-8", errors="replace").read().splitlines()
except OSError:
    print(json.dumps({
        "ok": False,
        "status": "skipped",
        "summary": "Skipped: password classifications need permission to read the shadow file. Re-run as root on the authorized image. Hashes are not printed.",
        "warnings": ["shadow unreadable"],
        "exitCode": 3,
    }))
    raise SystemExit(3)
for line in lines:
    parts = line.split(":")
    if len(parts) < 2 or not parts[0]:
        continue
    field = parts[1]
    empty = field == ""
    locked = field.startswith("!") or field.startswith("*")
    if empty:
        users.append({
            "name": parts[0],
            "passwordEmpty": True,
            "locked": locked,
            "passwordHidden": True,
            "platform": "linux",
            "groups": [],
        })
summary = f"{len(users)} empty-password accounts (hashes omitted)." if users else "No empty passwords detected (or shadow unreadable)."
print(json.dumps({"ok": True, "status": "ok", "summary": summary, "users": users}, indent=2))
PY
