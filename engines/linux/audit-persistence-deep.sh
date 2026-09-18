#!/usr/bin/env bash
set -euo pipefail
python3 - <<'PY'
import json, os
files = []
for p in ("/etc/rc.local", "/etc/profile.d", "/etc/xdg/autostart", "/etc/cron.d", "/etc/crontab"):
    if os.path.exists(p):
        files.append({"path": p, "note": "persistence"})
print(json.dumps({"ok": True, "files": files, "extra": {"note": "Inventory only; payloads not executed."}}, indent=2))
PY
