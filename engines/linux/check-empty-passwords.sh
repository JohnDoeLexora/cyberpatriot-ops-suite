#!/usr/bin/env bash
# Classifies empty/locked/set. Never prints hashes.
set -euo pipefail
python3 - <<'PY'
import json, spwd
users = []
try:
    entries = spwd.getspall()
except Exception as e:
    print(json.dumps({"ok": False, "error": "shadow unreadable (need root)", "detail": str(e)}))
    raise SystemExit(0)
for s in entries:
    field = s.sp_pwd or ""
    empty = field == ""
    locked = field.startswith("!") or field.startswith("*")
    if empty or (not locked and not field):
        users.append({"name": s.sp_nam, "passwordEmpty": empty, "locked": locked, "passwordHidden": True, "platform": "linux", "groups": []})
print(json.dumps({"ok": True, "users": users}, indent=2))
PY
