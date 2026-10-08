#!/usr/bin/env bash
# List groups from /etc/group.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os
path = os.environ.get("CP_ROOT", "")
group = (path + "/etc/group") if path else "/etc/group"
rows = []
try:
    lines = open(group, encoding="utf-8", errors="replace")
except OSError as exc:
    print(json.dumps({"ok": False, "status": "skipped", "summary": f"Skipped: cannot read {group}. {exc}", "exitCode": 3}))
    raise SystemExit(0)
for line in lines:
    if not line.strip() or line.startswith("#"):
        continue
    name, _pw, gid, members = (line.rstrip("\n").split(":") + ["", "", "", ""])[:4]
    rows.append({
        "name": name,
        "members": [m for m in members.split(",") if m],
        "privileged": name.lower() in {"sudo", "wheel", "admin", "root", "docker"},
    })
print(json.dumps({"ok": True, "status": "ok", "summary": f"{len(rows)} groups.", "groups": rows}, indent=2))
PY
