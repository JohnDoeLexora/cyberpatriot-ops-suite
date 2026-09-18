#!/usr/bin/env bash
# Shadow aging + empty classification. Never prints hashes.
set -euo pipefail
python3 - <<'PY'
import json
rows = []
try:
    shadow = open("/etc/shadow", encoding="utf-8", errors="replace")
except OSError:
    print(json.dumps({"ok": True, "extra": {"note": "/etc/shadow unreadable; hashes never requested"}, "users": []}))
    raise SystemExit(0)
with shadow:
    for line in shadow:
        if not line or line.startswith("#"):
            continue
        parts = line.rstrip("\n").split(":")
        if len(parts) < 5:
            continue
        name, field, max_raw = parts[0], parts[1], parts[4]
        empty = field == ""
        locked = field.startswith("!") or field.startswith("*")
        try:
            max_days = int(max_raw) if max_raw else None
        except ValueError:
            max_days = None
        never = max_days is None or max_days < 0 or max_days >= 99999
        if never or empty:
            rows.append({
                "name": name,
                "passwordEmpty": empty,
                "passwordNeverExpires": never,
                "locked": locked,
                "passwordHidden": True,
                "maxDays": max_days,
            })
print(json.dumps({"ok": True, "users": rows, "extra": {"note": "Classification only; hashes omitted"}}, indent=2))
PY
