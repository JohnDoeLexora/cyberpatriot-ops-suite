#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
if ! command -v systemctl >/dev/null 2>&1; then
  cp_skip "Skipped: systemctl is not installed. This check needs systemd."
fi
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
    services.append({"name": name, "state": state, "enabled": False, "platform": "linux", "description": ""})
print(json.dumps({"ok": True, "status": "ok", "summary": f"{len(services)} services.", "services": services}, indent=2))
PY
