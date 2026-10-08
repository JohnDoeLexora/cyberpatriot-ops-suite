#!/usr/bin/env bash
# Classifies empty/locked/set. Never prints hashes.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, spwd
users = []
try:
    entries = spwd.getspall()
except Exception as e:
    print(json.dumps({
        "ok": False,
        "status": "skipped",
        "summary": "Skipped: password classifications need permission to read the shadow file. Re-run as root on the authorized image. Hashes are not printed.",
        "warnings": ["shadow unreadable"],
    }))
    raise SystemExit(3)
for s in entries:
    field = s.sp_pwd or ""
    empty = field == ""
    locked = field.startswith("!") or field.startswith("*")
    if empty or (not locked and not field):
        users.append({"name": s.sp_nam, "passwordEmpty": empty, "locked": locked, "passwordHidden": True, "platform": "linux", "groups": []})
print(json.dumps({"ok": True, "users": users}, indent=2))
PY
