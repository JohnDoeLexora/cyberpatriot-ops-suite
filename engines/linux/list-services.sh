#!/usr/bin/env bash
set -euo pipefail
python3 - <<'PY'
import json, subprocess
def run(cmd):
    try:
        return subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL)
    except Exception:
        return ""
units = run(["systemctl", "list-units", "--type=service", "--all", "--no-pager", "--no-legend", "--plain"])
services = []
for line in units.splitlines():
    cols = line.split()
    if len(cols) < 4:
        continue
    name = cols[0][:-8] if cols[0].endswith(".service") else cols[0]
    active = cols[2]
    state = "running" if active == "active" else "stopped" if active in ("inactive", "failed") else "unknown"
    services.append({"name": name, "state": state, "enabled": False, "platform": "linux"})
print(json.dumps({"ok": True, "services": services}, indent=2))
PY
